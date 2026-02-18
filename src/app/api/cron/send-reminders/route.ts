import { NextRequest, NextResponse } from "next/server";
import { differenceInDays } from "date-fns";

// This API route is called by Vercel Cron daily at 9 AM
// It sends payment reminders for overdue invoices

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Since we're using client-side storage (localStorage via Zustand),
    // we need a different approach for server-side cron jobs
    // Option 1: Move to a database (Vercel Postgres, MongoDB, etc.)
    // Option 2: Use a webhook to trigger client-side processing
    // Option 3: Implement a server-side storage layer

    // For now, return a placeholder response
    // In production, you'd:
    // 1. Query all unpaid invoices from database where dueDate < today
    // 2. Check settings.autoRemindersEnabled
    // 3. Calculate if reminder is due based on firstReminderDaysAfterDue and reminderRepeatDays
    // 4. Send reminder email via Resend
    // 5. Update lastReminderAt timestamp
    // 6. Create activity record

    const processed = {
      message: "Automated reminders require server-side data storage",
      recommendation: "Implement with Vercel Postgres or MongoDB for production use",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(processed);
  } catch (error) {
    console.error("Error sending reminders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
