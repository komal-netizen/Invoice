import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/integrations?error=${error}`
    );
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    // Exchange code for token
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/slack/oauth`,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack OAuth error:", data.error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/integrations?error=oauth_failed`
      );
    }

    // Encode the integration data to pass to the callback page
    const integrationData = {
      workspaceId: data.team.id,
      workspaceName: data.team.name,
      teamId: data.team.id,
      botToken: data.access_token,
      botUserId: data.bot_user_id,
      accessToken: data.access_token,
      scope: data.scope,
      channelId: data.incoming_webhook?.channel_id,
    };

    const encodedData = encodeURIComponent(JSON.stringify(integrationData));

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/integrations/slack/callback?data=${encodedData}`
    );
  } catch (error) {
    console.error("Slack OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/integrations?error=connection_failed`
    );
  }
}
