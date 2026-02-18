import { NextResponse } from "next/server";
import type { FormSubmission, FormResponse } from "@/lib/types";
import { sendOnboardingNotification } from "@/lib/email-templates/onboarding-submission";

// In-memory submissions store
const submissionsStore: FormSubmission[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formId, formName, responses, submitterEmail, submitterName } = body as {
      formId: string;
      formName: string;
      responses: FormResponse[];
      submitterEmail?: string;
      submitterName?: string;
    };

    // Create submission
    const submission: FormSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      formId,
      formName,
      responses,
      status: "pending",
      submittedAt: new Date().toISOString(),
      submitterEmail,
      submitterName,
    };

    // Store submission
    submissionsStore.push(submission);

    // Send email notification to agency owner
    try {
      await sendOnboardingNotification({
        submission,
        agencyName: process.env.AGENCY_NAME || "Your Agency",
        agencyEmail: process.env.NOTIFICATION_EMAIL || "notifications@example.com",
      });
    } catch (emailError) {
      // Don't fail the submission if email fails
      console.error("Failed to send email notification:", emailError);
    }

    return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get submissions (for syncing back to client store)
export async function GET() {
  return NextResponse.json({ submissions: submissionsStore });
}
