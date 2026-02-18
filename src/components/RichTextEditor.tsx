"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect, useMemo, useRef } from "react";

const editorClass =
  "min-h-[120px] w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 prose prose-invert prose-sm max-w-none";

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const setLink = useCallback(() => {
    const url = window.prompt("URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);
  return (
    <div className="flex flex-wrap gap-1 border-b border-neutral-700 pb-2 mb-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("bold") ? "bg-orange-600 text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("italic") ? "bg-orange-600 text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("underline") ? "bg-orange-600 text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
      >
        U
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("bulletList") ? "bg-orange-600 text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("orderedList") ? "bg-orange-600 text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("codeBlock") ? "bg-orange-600 text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
      >
        &lt;/&gt;
      </button>
      <button
        type="button"
        onClick={setLink}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("link") ? "bg-orange-600 text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
      >
        Link
      </button>
    </div>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

function normHtml(s: string) {
  const t = (s || "").trim();
  if (!t) return "";
  return t.replace(/<p>\s*<\/p>/gi, "").trim() || "";
}

export function RichTextEditor({ value, onChange, onBlur, placeholder = "Write something...", className }: RichTextEditorProps) {
  const onBlurRef = useRef(onBlur);
  const onChangeRef = useRef(onChange);
  const editorRef = useRef<Editor | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  onBlurRef.current = onBlur;
  onChangeRef.current = onChange;

  // Stable options by normalized value so Tiptap doesn't call setOptions every render (which can trigger onUpdate → loop).
  const normalizedValue = normHtml(value);
  const initialContent = value || "";

  const editorOptions = useMemo(
    () => ({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({ heading: { levels: [2, 3] } }),
        Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-orange-400 underline" } }),
        Placeholder.configure({ placeholder }),
        Underline,
        Image.configure({ inline: false, allowBase64: true }),
      ],
      content: initialContent,
      editorProps: {
        attributes: { class: editorClass },
        handlePaste: (view: unknown, event: ClipboardEvent) => {
          const items = event.clipboardData?.files;
          if (items?.length && items[0].type.startsWith("image/")) {
            const file = items[0];
            const reader = new FileReader();
            reader.onload = () => {
              const url = reader.result as string;
              editorRef.current?.chain().focus().setImage({ src: url }).run();
            };
            reader.readAsDataURL(file);
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }: { editor: Editor }) => {
        const html = editor.getHTML();
        if (normHtml(html) === normHtml(valueRef.current)) return;
        onChangeRef.current(html);
      },
      onBlur: () => {
        onBlurRef.current?.();
      },
    }),
    [normalizedValue, placeholder]
  );

  const editor = useEditor(editorOptions, [normalizedValue]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sync effect depends only on normalized value so "" and "<p></p>" don't retrigger (avoids update loops).
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const normVal = normalizedValue;
    const normHtmlCur = normHtml(currentHtml);
    const didSetContent = normVal !== normHtmlCur;
    if (didSetContent) {
      editor.commands.setContent(valueRef.current || "", { emitUpdate: false });
    }
  }, [normalizedValue, editor]);

  if (!editor) {
    return <div className={className}><div className="ProseMirror min-h-[80px] rounded border border-neutral-600 bg-neutral-800/50 p-2" /></div>;
  }
  return (
    <div className={className}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
