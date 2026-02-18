"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import type { SlackIntegration } from "@/lib/types";

function SlackCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateSettings = useStore((s) => s.updateSettings);
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    const data = searchParams.get("data");
    
    if (!data) {
      setStatus("error");
      setTimeout(() => router.push("/dashboard/integrations"), 2000);
      return;
    }

    try {
      const integrationData = JSON.parse(decodeURIComponent(data));
      
      const slackIntegration: SlackIntegration = {
        workspaceId: integrationData.workspaceId,
        workspaceName: integrationData.workspaceName,
        teamId: integrationData.teamId,
        botToken: integrationData.botToken,
        botUserId: integrationData.botUserId,
        accessToken: integrationData.accessToken,
        scope: integrationData.scope,
        connectedAt: new Date().toISOString(),
        enabled: true,
        channelId: integrationData.channelId,
      };

      updateSettings({ slackIntegration });
      setStatus("success");
      
      setTimeout(() => {
        router.push("/dashboard/integrations/slack");
      }, 2000);
    } catch (error) {
      console.error("Failed to save Slack integration:", error);
      setStatus("error");
      setTimeout(() => router.push("/dashboard/integrations"), 2000);
    }
  }, [searchParams, updateSettings, router]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {status === "processing" && (
        <>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neutral-700 border-t-orange-500" />
          <h2 className="mt-6 text-xl font-semibold text-white">Connecting Slack...</h2>
          <p className="mt-2 text-sm text-neutral-400">Please wait while we complete the setup</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">Slack Connected!</h2>
          <p className="mt-2 text-sm text-neutral-400">Redirecting to Slack settings...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">Connection Failed</h2>
          <p className="mt-2 text-sm text-neutral-400">Redirecting back to integrations...</p>
        </>
      )}
    </div>
  );
}

export default function SlackCallbackPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neutral-700 border-t-orange-500" />
      </div>
    }>
      <SlackCallbackContent />
    </Suspense>
  );
}
