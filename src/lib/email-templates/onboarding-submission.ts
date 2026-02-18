import type { FormSubmission } from "../types";

/**
 * Email template for new onboarding form submissions
 * 
 * To integrate with an email service (e.g., Resend):
 * 
 * 1. Install the email service SDK:
 *    npm install resend
 * 
 * 2. Set up environment variables:
 *    RESEND_API_KEY=your_api_key
 *    NOTIFICATION_EMAIL=your@email.com
 * 
 * 3. Create an API utility to send emails:
 *    import { Resend } from 'resend';
 *    const resend = new Resend(process.env.RESEND_API_KEY);
 * 
 * 4. Call sendOnboardingNotification() from the submit API route
 */

export interface OnboardingSubmissionEmailData {
  submission: FormSubmission;
  agencyName: string;
  agencyEmail: string;
}

export function generateOnboardingSubmissionEmailHTML(data: OnboardingSubmissionEmailData): string {
  const { submission, agencyName } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Onboarding Form Submission</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #f97316;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #111;
      font-size: 24px;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background: #fef3c7;
      color: #92400e;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
    .info-section {
      margin: 20px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 14px;
      color: #111;
    }
    .response-item {
      margin: 20px 0;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .response-item:last-child {
      border-bottom: none;
    }
    .response-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
    }
    .response-value {
      color: #111;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 24px;
      background: #f97316;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Onboarding Submission</h1>
      <span class="badge">Pending Review</span>
    </div>

    <div class="info-section">
      <div class="info-label">Form Name</div>
      <div class="info-value">${submission.formName}</div>
    </div>

    ${submission.submitterName ? `
    <div class="info-section">
      <div class="info-label">Submitted By</div>
      <div class="info-value">
        ${submission.submitterName}
        ${submission.submitterEmail ? `<br>${submission.submitterEmail}` : ''}
      </div>
    </div>
    ` : ''}

    <div class="info-section">
      <div class="info-label">Submitted At</div>
      <div class="info-value">${new Date(submission.submittedAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      })}</div>
    </div>

    <h2 style="margin-top: 30px; font-size: 18px; color: #374151;">Responses</h2>

    ${submission.responses.map((response) => `
      <div class="response-item">
        <div class="response-label">${response.fieldLabel}</div>
        <div class="response-value">
          ${Array.isArray(response.value) 
            ? `<ul style="margin: 5px 0; padding-left: 20px;">${response.value.map(v => `<li>${v}</li>`).join('')}</ul>`
            : response.fieldType === 'file-upload'
              ? `<a href="${response.fileUrl}" style="color: #f97316;">${response.value}</a>`
              : response.value || '—'
          }
        </div>
      </div>
    `).join('')}

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/onboarding-forms/submissions" class="cta-button">
        Review Submission
      </a>
    </div>

    <div class="footer">
      <p>This is an automated notification from ${agencyName}</p>
      <p>To manage your notification preferences, visit your dashboard settings</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateOnboardingSubmissionEmailText(data: OnboardingSubmissionEmailData): string {
  const { submission, agencyName } = data;
  
  return `
New Onboarding Form Submission

Form Name: ${submission.formName}
Status: Pending Review

${submission.submitterName ? `
Submitted By: ${submission.submitterName}
${submission.submitterEmail ? `Email: ${submission.submitterEmail}` : ''}
` : ''}

Submitted At: ${new Date(submission.submittedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  })}

---

Responses:

${submission.responses.map((response) => `
${response.fieldLabel}:
${Array.isArray(response.value) 
  ? response.value.map(v => `  - ${v}`).join('\n')
  : response.fieldType === 'file-upload'
    ? `  File: ${response.value} (${response.fileUrl})`
    : `  ${response.value || '—'}`
}
`).join('\n')}

---

Review this submission: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/onboarding-forms/submissions

---

This is an automated notification from ${agencyName}
  `.trim();
}

/**
 * Send onboarding submission notification email
 * 
 * Example implementation with Resend:
 * 
 * import { Resend } from 'resend';
 * 
 * export async function sendOnboardingNotification(data: OnboardingSubmissionEmailData) {
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   
 *   await resend.emails.send({
 *     from: 'notifications@yourdomain.com',
 *     to: data.agencyEmail,
 *     subject: `New Onboarding Submission: ${data.submission.formName}`,
 *     html: generateOnboardingSubmissionEmailHTML(data),
 *     text: generateOnboardingSubmissionEmailText(data),
 *   });
 * }
 */
export async function sendOnboardingNotification(data: OnboardingSubmissionEmailData): Promise<void> {
  // TODO: Implement email sending with your preferred service (Resend, SendGrid, etc.)
  // See comments above for example implementation
  
  console.log('📧 Email notification would be sent to:', data.agencyEmail);
  console.log('Subject:', `New Onboarding Submission: ${data.submission.formName}`);
  console.log('HTML preview:', generateOnboardingSubmissionEmailHTML(data).substring(0, 200) + '...');
  
  // For now, just log. In production, integrate with an email service:
  // await resend.emails.send({ ... });
}
