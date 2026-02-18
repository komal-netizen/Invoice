# Slack Integration Setup Guide

This guide will help you set up the Slack integration to create tasks directly from Slack conversations.

## Prerequisites

- A Slack workspace (admin access recommended)
- Your Invoice Platform running and accessible (localhost or deployed)

## Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app name: **"Invoice Platform Tasks"**
5. Select your workspace
6. Click **"Create App"**

## Step 2: Configure OAuth & Permissions

1. In your app settings, go to **"OAuth & Permissions"**
2. Scroll to **"Scopes"** section
3. Add the following **Bot Token Scopes**:
   - `chat:write` - Send messages
   - `commands` - Add slash commands
   - `im:history` - Read direct messages
   - `channels:history` - Read public channel messages
   - `groups:history` - Read private channel messages

4. Scroll to **"Redirect URLs"**
5. Click **"Add New Redirect URL"**
6. Enter: `https://your-domain.com/api/slack/oauth`
   - For local development: `http://localhost:3000/api/slack/oauth`
7. Click **"Save URLs"**

## Step 3: Enable Interactivity

1. Go to **"Interactivity & Shortcuts"**
2. Toggle **"Interactivity"** to **ON**
3. Set Request URL to: `https://your-domain.com/api/slack/interactions`
   - For local: `http://localhost:3000/api/slack/interactions`
4. Click **"Save Changes"**

## Step 4: Add Slash Commands

1. Go to **"Slash Commands"**
2. Click **"Create New Command"**
3. Configure:
   - **Command**: `/create-task`
   - **Request URL**: `https://your-domain.com/api/slack/commands/create-task`
   - **Short Description**: "Create a new task"
   - **Usage Hint**: "[task description]"
4. Click **"Save"**

## Step 5: Add Message Action

1. Go to **"Interactivity & Shortcuts"**
2. Scroll to **"Message Shortcuts"**
3. Click **"Create New Shortcut"**
4. Configure:
   - **Name**: "Create Task from Message"
   - **Short Description**: "Convert this message to a task"
   - **Callback ID**: `create_task_from_message`
5. Click **"Create"**

## Step 6: Get Your Credentials

1. Go to **"Basic Information"**
2. Scroll to **"App Credentials"**
3. Copy these values:
   - **Client ID**
   - **Client Secret**
   - **Signing Secret**

4. Go to **"OAuth & Permissions"**
5. Click **"Install to Workspace"**
6. Authorize the app
7. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

## Step 7: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Slack Integration
NEXT_PUBLIC_SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
SLACK_SIGNING_SECRET=your_signing_secret_here
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# Your app URL (for OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Step 8: Test the Integration

1. Restart your Next.js development server
2. Go to **Dashboard → Integrations**
3. Click **"Connect Slack"** on the Slack card
4. Authorize the connection
5. You'll be redirected back to your app

## Usage

### Creating Tasks from Slack

**Method 1: Slash Command**
```
/create-task Update client portal design
```

**Method 2: Message Action**
1. Hover over any client message
2. Click the three dots (⋮)
3. Select "Create Task from Message"
4. Fill in the modal and click Create

### What Gets Created

When you create a task from Slack:
- **Title**: From your input or message content
- **Description**: Full message text
- **Context**: Link to original Slack message
- **Metadata**: Slack user, channel, timestamp

## Troubleshooting

### "Invalid signature" error
- Verify your `SLACK_SIGNING_SECRET` is correct
- Check that your server time is accurate (for timestamp validation)

### Modal doesn't open
- Verify `SLACK_BOT_TOKEN` is correct
- Check that the bot is installed in your workspace
- Ensure Request URLs are accessible from Slack servers

### OAuth redirect fails
- Check `NEXT_PUBLIC_APP_URL` matches your actual URL
- Verify redirect URL is saved in Slack app settings
- For local development, use ngrok or similar tunnel

## Local Development with ngrok

If testing locally, you'll need to expose your localhost to Slack:

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000

# Use the ngrok URL in your Slack app settings
# Example: https://abc123.ngrok.io/api/slack/oauth
```

## Security Notes

- Never commit `.env.local` to version control
- Rotate secrets if they're exposed
- Signature verification protects against replay attacks
- Bot tokens should be kept secure
- Use HTTPS in production

## Support

For issues or questions:
- Slack API docs: [https://api.slack.com/](https://api.slack.com/)
- Check your app's **Event Subscriptions** logs for errors
- Review server logs for API errors
