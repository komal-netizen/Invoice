import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verify Slack signature
function verifySlackSignature(request: NextRequest, body: string): boolean {
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  
  if (!timestamp || !signature) return false;
  
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return false;

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
  
  // Verify request from Slack
  if (!verifySlackSignature(request, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(new URLSearchParams(body).get("payload")!);

  // Handle modal submission
  if (payload.type === "view_submission") {
    const values = payload.view.state.values;
    const metadata = JSON.parse(payload.view.private_metadata || "{}");
    
    const taskData = {
      title: values.task_title.title.value,
      description: values.task_description?.description?.value || "",
      priority: values.task_priority?.priority?.selected_option?.value || "medium",
      slackUserId: metadata.userId || payload.user.id,
      slackChannelId: metadata.channelId,
      slackTeamId: metadata.teamId,
      slackMessageTs: metadata.messageTs,
      slackMessageText: metadata.messageText,
    };

    // Create task via internal API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/tasks/create-from-slack`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Internal-Request": "true",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const result = await response.json();

      // Send confirmation message to Slack
      if (metadata.channelId && process.env.SLACK_BOT_TOKEN) {
        await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          },
          body: JSON.stringify({
            channel: metadata.channelId,
            text: `Task created: ${taskData.title}`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `✅ *Task Created*\n*${taskData.title}*\n${taskData.description ? taskData.description.substring(0, 100) : ""}`,
                },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "View in Dashboard",
                    },
                    url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/task-boards/${result.boardId}`,
                    style: "primary",
                  },
                ],
              },
            ],
          }),
        });
      }

      return NextResponse.json({ response_action: "clear" });
    } catch (error) {
      console.error("Failed to create task:", error);
      return NextResponse.json({
        response_action: "errors",
        errors: {
          task_title: "Failed to create task. Please try again.",
        },
      });
    }
  }

  // Handle message actions
  if (payload.type === "message_action") {
    const message = payload.message;
    
    const modal = {
      type: "modal",
      callback_id: "create_task_from_message",
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
        messageTs: message.ts,
        channelId: payload.channel.id,
        messageText: message.text,
        userId: payload.user.id,
        teamId: payload.team.id,
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
            initial_value: message.text.substring(0, 100),
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
            initial_value: message.text,
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
            options: [
              { text: { type: "plain_text", text: "Low" }, value: "low" },
              { text: { type: "plain_text", text: "Medium" }, value: "medium" },
              { text: { type: "plain_text", text: "High" }, value: "high" },
              { text: { type: "plain_text", text: "Urgent" }, value: "urgent" },
            ],
            initial_option: { text: { type: "plain_text", text: "Medium" }, value: "medium" },
          },
        },
        {
          type: "section",
          block_id: "original_message",
          text: {
            type: "mrkdwn",
            text: `*Original message:*\n>${message.text}`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Posted by <@${message.user}> in <#${payload.channel.id}>`,
            },
          ],
        },
      ],
    };

    // Open modal
    try {
      const response = await fetch("https://slack.com/api/views.open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          trigger_id: payload.trigger_id,
          view: modal,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error("Failed to open modal:", data.error);
      }

      return new NextResponse("", { status: 200 });
    } catch (error) {
      console.error("Error opening modal:", error);
      return new NextResponse("", { status: 500 });
    }
  }

  return NextResponse.json({});
}
