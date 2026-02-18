import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verify Slack signature for security
function verifySlackSignature(request: NextRequest, body: string): boolean {
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  
  if (!timestamp || !signature) return false;
  
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return false;

  // Check timestamp to prevent replay attacks
  const time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 60 * 5) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac("sha256", signingSecret);
  const computed = `v0=${hmac.update(baseString).digest("hex")}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  
  // Verify request is from Slack
  if (!verifySlackSignature(request, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const text = params.get("text") || "";
  const userId = params.get("user_id");
  const channelId = params.get("channel_id");
  const triggerId = params.get("trigger_id");
  const teamId = params.get("team_id");

  // Open interactive modal for task creation
  const modal = {
    type: "modal",
    callback_id: "create_task_modal",
    title: {
      type: "plain_text",
      text: "Create Task",
    },
    submit: {
      type: "plain_text",
      text: "Create",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    private_metadata: JSON.stringify({
      userId,
      channelId,
      teamId,
    }),
    blocks: [
      {
        type: "input",
        block_id: "task_title",
        label: {
          type: "plain_text",
          text: "Task Title",
        },
        element: {
          type: "plain_text_input",
          action_id: "title",
          initial_value: text,
          placeholder: {
            type: "plain_text",
            text: "Enter task title",
          },
        },
      },
      {
        type: "input",
        block_id: "task_description",
        label: {
          type: "plain_text",
          text: "Description",
        },
        element: {
          type: "plain_text_input",
          action_id: "description",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Add details about the task",
          },
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "task_priority",
        label: {
          type: "plain_text",
          text: "Priority",
        },
        element: {
          type: "static_select",
          action_id: "priority",
          placeholder: {
            type: "plain_text",
            text: "Select priority",
          },
          options: [
            {
              text: { type: "plain_text", text: "Low" },
              value: "low",
            },
            {
              text: { type: "plain_text", text: "Medium" },
              value: "medium",
            },
            {
              text: { type: "plain_text", text: "High" },
              value: "high",
            },
            {
              text: { type: "plain_text", text: "Urgent" },
              value: "urgent",
            },
          ],
          initial_option: {
            text: { type: "plain_text", text: "Medium" },
            value: "medium",
          },
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Task will be created in your Invoice Platform dashboard",
          },
        ],
      },
    ],
  };

  // Open modal using Slack API
  try {
    const modalResponse = await fetch("https://slack.com/api/views.open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        trigger_id: triggerId,
        view: modal,
      }),
    });

    const modalData = await modalResponse.json();

    if (!modalData.ok) {
      console.error("Failed to open modal:", modalData.error);
      return NextResponse.json({
        response_type: "ephemeral",
        text: "Sorry, something went wrong. Please try again.",
      });
    }

    // Return empty response (modal will handle the rest)
    return new NextResponse("", { status: 200 });
  } catch (error) {
    console.error("Error opening Slack modal:", error);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Failed to open task creation modal. Please try again.",
    });
  }
}
