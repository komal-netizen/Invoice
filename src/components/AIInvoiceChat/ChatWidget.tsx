"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { parseInvoiceCommand, buildDraftLineItems } from "@/lib/aiInvoiceParser";
import { recalc } from "@/lib/invoiceRecalc";
import type { Client, Invoice, LineItem } from "@/lib/types";
import type { ParsedCommand } from "@/lib/aiInvoiceParser";
import { addDays, format } from "date-fns";

type MessageRole = "user" | "assistant";

/** Web Speech API recognition instance (browser type not in TS lib) */
interface SpeechRecognitionLike {
  start(): void;
  stop(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: Iterable<{ [i: number]: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  draft?: InvoiceDraft;
}

export interface InvoiceDraft {
  clientId: string;
  client: Client;
  lineItems: { description: string; quantity: number; unit: string; price: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  taxRate: number;
}

const DEFAULT_SECTION_ORDER = [
  "header",
  "billTo",
  "lineItems",
  "totals",
  "payment",
  "lateFees",
  "notes",
];

export function ChatWidget() {
  const router = useRouter();
  const clients = useStore((s) => s.clients);
  const settings = useStore((s) => s.settings);
  const addInvoice = useStore((s) => s.addInvoice);
  const getNextInvoiceNumber = useStore((s) => s.getNextInvoiceNumber);
  const getClient = useStore((s) => s.getClient);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Create an invoice with a simple message. Try: \"Create an invoice for Acme Corp for $5,000\" or \"Invoice [Client name] for [amount]\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingDraft, setPendingDraft] = useState<InvoiceDraft | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceInputMode, setVoiceInputMode] = useState<"append" | "replace">("replace");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }) : null;
    const API = w && (w.SpeechRecognition || w.webkitSpeechRecognition);
    setVoiceSupported(!!API);
  }, []);

  // Cleanup: stop speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    const onOpen = () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-ai-chat", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-ai-chat", onOpen);
    };
  }, []);

  const buildInvoiceFromDraft = useCallback(
    (draft: InvoiceDraft): Omit<Invoice, "id" | "createdAt" | "updatedAt"> => {
      const lineItems: LineItem[] = buildDraftLineItems(draft.lineItems).map((li) => ({
        ...li,
        total: li.quantity * li.price,
      }));
      const taxRate = settings.invoiceDefaults.defaultTaxRate ?? 0;
      const { subtotal, taxAmount, discountAmount, total } = recalc(
        lineItems,
        taxRate,
        "none",
        0
      );
      const issueDate = format(new Date(), "yyyy-MM-dd");
      const dueDate = format(
        addDays(new Date(), 30),
        "yyyy-MM-dd"
      );
      return {
        invoiceNumber: getNextInvoiceNumber(),
        clientId: draft.clientId,
        status: "draft",
        issueDate,
        dueDate,
        lineItems,
        subtotal,
        taxRate,
        taxName: settings.invoiceDefaults.defaultTaxName ?? "Tax",
        taxAmount,
        discountType: "none",
        discountValue: 0,
        discountAmount,
        total,
        currency: settings.invoiceDefaults.defaultCurrency ?? "USD",
        paymentMethods: settings.paymentMethods.filter((p) => p.enabled).map((p) => p.name),
        lateFeeEnabled: false,
        showLogo: true,
        showHeaderImage: false,
        applyTax: taxRate > 0,
        displayTaxId: settings.invoiceDefaults.displayTaxId ?? true,
        shippingAddress: false,
        showReferenceNumber: false,
        sectionOrder: DEFAULT_SECTION_ORDER,
        template: settings.template,
      };
    },
    [settings, getNextInvoiceNumber]
  );

  const runCreate = useCallback(
    (draft: InvoiceDraft) => {
      const payload = buildInvoiceFromDraft(draft);
      const invoice = addInvoice(payload);
      setPendingDraft(null);
      setMessages((m) =>
        m.concat({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Invoice #${invoice.invoiceNumber} created for ${getClient(invoice.clientId)?.companyName ?? "client"}. Opening editor...`,
        })
      );
      router.push(`/dashboard/invoices/${invoice.id}`);
    },
    [buildInvoiceFromDraft, addInvoice, getClient, router]
  );

  const runEdit = useCallback(
    (draft: InvoiceDraft) => {
      const payload = buildInvoiceFromDraft(draft);
      const invoice = addInvoice(payload);
      setPendingDraft(null);
      setMessages((m) =>
        m.concat({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Invoice #${invoice.invoiceNumber} created. You can edit it in the editor.`,
        })
      );
      router.push(`/dashboard/invoices/${invoice.id}`);
    },
    [buildInvoiceFromDraft, addInvoice, router]
  );

  const handleCancelDraft = useCallback(() => {
    setPendingDraft(null);
    setMessages((m) =>
      m.concat({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Draft cancelled. You can ask for a new invoice anytime.",
      })
    );
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setIsProcessing(true);
    setMessages((m) =>
      m.concat({ id: crypto.randomUUID(), role: "user", content: text })
    );

    let parsed: ParsedCommand;
    try {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            clients: clients.map((c) => ({
              id: c.id,
              companyName: c.companyName,
              contactName: c.contactName,
            })),
          }),
        });
        if (res.ok && res.status === 200) {
          const api = await res.json();
          const client = api.clientId ? clients.find((c) => c.id === api.clientId) : undefined;
          parsed = {
            type: api.type ?? "unclear",
            clientId: api.clientId,
            clients: client ? [client] : [],
            amount: api.amount,
            lineItems: api.lineItems ?? undefined,
            needClient: api.needClient,
            needAmount: api.needAmount,
            message: api.message ?? undefined,
          };
        } else {
          parsed = parseInvoiceCommand(text, clients);
        }
      } catch {
        parsed = parseInvoiceCommand(text, clients);
      }

      if (parsed.type === "unclear" || parsed.message) {
        setMessages((m) =>
          m.concat({
            id: crypto.randomUUID(),
            role: "assistant",
            content: parsed.message ?? "I didn't understand. Try: \"Create an invoice for [Client] for $[amount]\".",
          })
        );
        return;
      }

      if (parsed.needClient || parsed.needAmount) {
        setMessages((m) =>
          m.concat({
            id: crypto.randomUUID(),
            role: "assistant",
            content: parsed.message ?? "Please specify the client or amount.",
          })
        );
        return;
      }

      if (parsed.type === "create_invoice" && parsed.clientId && parsed.lineItems?.length) {
        const client = clients.find((c) => c.id === parsed.clientId);
        if (!client) {
          setMessages((m) =>
            m.concat({
              id: crypto.randomUUID(),
              role: "assistant",
              content: "I couldn't find that client. Please try again or add the client first.",
            })
          );
          return;
        }
        const lineItems = buildDraftLineItems(parsed.lineItems);
        const taxRate = settings.invoiceDefaults.defaultTaxRate ?? 0;
        const { subtotal, taxAmount, total } = recalc(
          lineItems,
          taxRate,
          "none",
          0
        );
        const draft: InvoiceDraft = {
          clientId: parsed.clientId,
          client,
          lineItems: parsed.lineItems,
          subtotal,
          taxAmount,
          total,
          currency: settings.invoiceDefaults.defaultCurrency ?? "USD",
          taxRate,
        };
        setPendingDraft(draft);
        const lines = parsed.lineItems
          .map(
            (li) =>
              `• ${li.description}: ${li.quantity} ${li.unit} @ ${draft.currency === "USD" ? "$" : ""}${li.price.toFixed(2)} = ${draft.currency === "USD" ? "$" : ""}${(li.quantity * li.price).toFixed(2)}`
          )
          .join("\n");
        setMessages((m) =>
          m.concat({
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Here’s your invoice for **${client.companyName}**:\n\n${lines}\n\n**Subtotal:** ${draft.currency === "USD" ? "$" : ""}${subtotal.toFixed(2)}\n**Tax (${taxRate}%):** ${draft.currency === "USD" ? "$" : ""}${taxAmount.toFixed(2)}\n**Total:** ${draft.currency === "USD" ? "$" : ""}${total.toFixed(2)}\n\nChoose an action below.`,
            draft,
          })
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }, [input, clients, settings.invoiceDefaults]);

  const toggleVoice = useCallback(() => {
    if (!voiceSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError(null);
      return;
    }

    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError("Voice not supported in this browser");
      return;
    }

    setVoiceError(null);
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: { results: Iterable<{ [i: number]: { transcript: string } }> }) => {
      const results = Array.from(event.results);
      const transcript = results
        .map(result => result[0]?.transcript)
        .filter(Boolean)
        .join(" ")
        .trim();
      if (transcript) {
        setInput((prev) => voiceInputMode === "append" && prev ? `${prev} ${transcript}` : transcript);
        setVoiceError(null);
        inputRef.current?.focus();
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onerror = (event: Event & { error?: string }) => {
      recognitionRef.current = null;
      setIsListening(false);
      const err = (event as { error?: string }).error;
      if (err === "not-allowed" || err === "permission-denied") {
        setVoiceError("Microphone access denied. Allow access and try again.");
      } else if (err === "no-speech") {
        setVoiceError("No speech heard. Try again.");
      } else {
        setVoiceError("Voice input failed. Try again.");
      }
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError("Could not start microphone. Check permissions.");
    }
  }, [isListening, voiceSupported]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-neutral-950"
        aria-label="Open AI invoice assistant (Cmd+K)"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
            <h3 className="font-semibold text-white">AI Invoice Assistant</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex max-h-[360px] flex-1 flex-col overflow-y-auto p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 ${msg.role === "user" ? "ml-6 text-right" : "mr-6 text-left"}`}
              >
                <div
                  className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-orange-600 text-white"
                      : "bg-neutral-800 text-neutral-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
                </div>
                {msg.draft && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runCreate(msg.draft!)}
                      className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
                    >
                      Create invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => runEdit(msg.draft!)}
                      className="rounded-lg border border-neutral-600 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
                    >
                      Edit first
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDraft}
                      className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-neutral-700 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                setInput(e.target.value);
                if (voiceError) setVoiceError(null);
              }}
                placeholder="e.g. Create invoice for Acme for $5,000"
                disabled={isProcessing || isListening}
                className="flex-1 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    inputRef.current?.focus();
                  }}
                  title="Clear input"
                  className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  aria-label="Clear input"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={isProcessing}
                  title={isListening ? "Stop listening" : "Voice input"}
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    isListening
                      ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                      : "border border-neutral-600 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                disabled={isProcessing}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Send
              </button>
            </form>
            {isListening && (
              <p className="mt-1.5 text-xs text-orange-400 flex items-center gap-1.5" role="status">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                Listening... Speak now
              </p>
            )}
            {voiceError && (
              <div className="mt-1.5 flex items-center justify-between text-xs text-amber-400" role="alert">
                <span>{voiceError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceError(null);
                    if (voiceSupported) toggleVoice();
                  }}
                  className="ml-2 text-orange-400 hover:text-orange-300 underline"
                >
                  Retry
                </button>
              </div>
            )}
            {!isListening && !voiceError && (
              <p className="mt-1.5 text-xs text-neutral-500">
                {voiceSupported ? "Type or use the mic to speak. " : ""}Press Cmd+K (Mac) or Ctrl+K (Windows) to open
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
