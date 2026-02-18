import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you may want to add authentication)
    const internalHeader = request.headers.get("X-Internal-Request");
    if (internalHeader !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      priority,
      slackUserId,
      slackChannelId,
      slackTeamId,
      slackMessageTs,
      slackMessageText,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Task data to be stored
    const taskData = {
      title,
      description: description || undefined,
      priority: priority || "medium",
      status: "todo",
      slackMetadata: {
        userId: slackUserId,
        channelId: slackChannelId,
        teamId: slackTeamId,
        messageTs: slackMessageTs,
        messageText: slackMessageText,
        createdAt: new Date().toISOString(),
      },
    };

    // Return task data with success message
    // Note: Since this is a client-side store, the actual task creation
    // will happen in the client via a webhook or polling mechanism
    return NextResponse.json({
      success: true,
      task: taskData,
      message: "Task created successfully",
      boardId: "default", // You may want to determine the correct board
    });
  } catch (error) {
    console.error("Error creating task from Slack:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
