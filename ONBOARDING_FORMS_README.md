# Client Onboarding Forms System

## Overview

A comprehensive client onboarding form system that allows agencies to create custom forms, share them via unique links, capture client submissions, and display results in both the dashboard and client portal.

## Features Implemented

### ✅ 1. Form Management Dashboard
- **Location**: `/dashboard/onboarding-forms`
- Create custom forms or use pre-built templates
- Drag-and-drop form builder with real-time preview
- Generate shareable, token-based public links
- Toggle form availability on/off
- Track submission counts per form
- Duplicate and delete forms

### ✅ 2. Form Builder
- **Component**: `OnboardingFormBuilder.tsx`
- 9 field types supported:
  - Short Text
  - Long Text (Textarea)
  - Multiple Choice (Radio buttons)
  - Checkboxes
  - Dropdown
  - Email
  - Phone
  - Date
  - File Upload
- Drag-and-drop field reordering
- Live field editor with options configuration
- Required field toggle
- Placeholder and help text support

### ✅ 3. Built-in Templates
- **Web Design Project Onboarding** - 12 fields for web projects
- **Branding Package Onboarding** - 9 fields for branding work
- **General Service Onboarding** - 8 fields for any service

### ✅ 4. Public Form Submission
- **URL Pattern**: `/onboarding/[token]`
- Clean, responsive public-facing form
- Real-time validation
- File upload support (with placeholder implementation)
- Success confirmation page
- Mobile-friendly design

### ✅ 5. Submissions Review Dashboard
- **Location**: `/dashboard/onboarding-forms/submissions`
- View all submissions with status filtering
- Status tabs: All, Pending, Reviewed, Accepted, Rejected
- Detailed submission viewer modal
- Accept submissions → Auto-create client & project
- Reject submissions with notes
- Sync button to fetch new submissions from server

### ✅ 6. Client Portal Integration
- **New Tab**: "Onboarding Details"
- Displays accepted submission data in client board
- Shows all responses with proper formatting
- File attachments with download links
- Review notes display
- Conditional visibility (only shows if submission exists)

### ✅ 7. Email Notifications
- **Template**: `onboarding-submission.ts`
- HTML and plain text email templates
- Ready for integration with email services (Resend, SendGrid, etc.)
- Includes setup instructions and example code
- Currently logs to console (needs API key for production)

## Data Flow

```
1. Agency creates form → Form saved to Zustand store
2. Agency generates token → Form synced to server-side store
3. Agency shares link → Client accesses `/onboarding/[token]`
4. Client submits form → Submission saved to server
5. Email notification sent → Agency receives alert (console log)
6. Agency syncs submissions → New submissions appear in dashboard
7. Agency reviews → Accept or reject with notes
8. If accepted → Client and project auto-created
9. Submission shown in client portal → Client can view their details
```

## File Structure

```
src/
├── lib/
│   ├── types.ts                          # FormField, OnboardingForm, FormSubmission types
│   ├── form-templates.ts                 # 3 built-in templates
│   ├── store.ts                          # Zustand store with form methods
│   ├── sync-forms.ts                     # Sync helper functions
│   └── email-templates/
│       └── onboarding-submission.ts      # Email notification template
├── components/
│   └── OnboardingFormBuilder.tsx         # Form builder modal component
├── app/
│   ├── dashboard/
│   │   └── onboarding-forms/
│   │       ├── page.tsx                  # Forms management page
│   │       └── submissions/
│   │           └── page.tsx              # Submissions review page
│   ├── onboarding/
│   │   └── [token]/
│   │       ├── page.tsx                  # Public form page (server component)
│   │       └── OnboardingFormPublic.tsx  # Public form (client component)
│   └── api/
│       └── onboarding-form/
│           ├── [token]/
│           │   └── route.ts              # GET form by token
│           ├── sync/
│           │   └── route.ts              # POST sync forms to server
│           └── submit/
│               └── route.ts              # POST form submission + GET submissions
```

## Usage Instructions

### Creating a Form

1. Navigate to **Onboarding Forms** in the dashboard sidebar
2. Click **"Use Template"** to start from a template, or **"Create Custom Form"** for a blank form
3. Fill in form name and description
4. Add fields using the field palette
5. Click on a field to edit its properties
6. Drag fields to reorder them
7. Click **"Create Form"** to save

### Sharing a Form

1. Find your form in the forms list
2. Click **"Generate Shareable Link"** (if not already generated)
3. Toggle the form **Active/Disabled** checkbox to control access
4. Click **"Copy"** to copy the public URL
5. Share the URL with your client

### Reviewing Submissions

1. Navigate to **View Submissions** from the forms page
2. Filter by status: Pending, Reviewed, Accepted, Rejected
3. Click **"Review"** on any submission
4. Review all submitted data
5. Add optional review notes
6. Click **"Accept & Create Client"** to:
   - Create a new client record
   - Create a new project linked to the form
   - Mark submission as accepted
7. Or click **"Reject"** to decline with required notes

### Viewing in Client Portal

When a submission is accepted and linked to a client:
1. The client's board will show an **"Onboarding Details"** tab
2. All submission data is displayed in a clean, organized format
3. Review notes are shown at the bottom
4. File attachments have download links

## Email Notifications Setup

To enable email notifications for new submissions:

1. **Install email service SDK** (e.g., Resend):
   ```bash
   npm install resend
   ```

2. **Add environment variables** to `.env.local`:
   ```env
   RESEND_API_KEY=your_resend_api_key
   NOTIFICATION_EMAIL=your@email.com
   AGENCY_NAME=Your Agency Name
   ```

3. **Update the email function** in `src/lib/email-templates/onboarding-submission.ts`:
   - Uncomment the Resend implementation
   - Replace the console.log with actual email sending

4. **Email notifications will include**:
   - Submission details
   - All form responses
   - Direct link to review in dashboard
   - Formatted HTML and plain text versions

## Customization Options

### Adding New Field Types
Edit `FORM_FIELD_TYPES` in `src/lib/types.ts` and add rendering logic in `OnboardingFormPublic.tsx`

### Custom Templates
Add new templates to `FORM_TEMPLATES` in `src/lib/form-templates.ts`

### Email Templates
Modify `generateOnboardingSubmissionEmailHTML()` in `src/lib/email-templates/onboarding-submission.ts`

### Styling
All components use Tailwind CSS classes and follow the existing dark theme design system

## Technical Notes

- **State Management**: Zustand with localStorage persistence
- **Server-Side Storage**: In-memory Map (replace with database in production)
- **Token Security**: UUID-based tokens (consider adding expiration in production)
- **File Uploads**: Placeholder implementation (integrate with S3/Cloudinary for production)
- **Authentication**: Public forms are token-based and don't require login
- **Form Validation**: Client-side validation with error messages

## Future Enhancements (Optional)

- [ ] Conditional field logic (show/hide based on answers)
- [ ] Multi-page forms
- [ ] Form analytics (view counts, completion rate)
- [ ] Webhook integrations
- [ ] PDF export of submissions
- [ ] Form themes/branding
- [ ] Auto-save drafts for clients
- [ ] Form duplication with data migration
- [ ] Bulk operations on submissions

## Support

For questions or issues, refer to:
- Type definitions in `src/lib/types.ts`
- Form builder component in `src/components/OnboardingFormBuilder.tsx`
- API routes in `src/app/api/onboarding-form/`
