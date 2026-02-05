# Step 4: Power Automate Notification Flows

## Beginner's Guide - Read Everything Carefully

**Estimated Time:** 2-3 hours (for all flows)
**Difficulty:** Medium
**What You'll Create:** Automated email notifications triggered by workflow changes

---

## ⚠️ Security Update (February 2026)

Power Automate flows now integrate with enhanced security features:
- **CSRF tokens** protect against fake email triggers
- **Audit logging** tracks every notification sent (who, what, when)
- **Validation checks** prevent unauthorized notifications
- **Error handling** logs failed emails for investigation

These security features were added in February 2026 and work automatically once the backend is deployed.

### Backend Security Validation

**Important:** The backend performs security validation BEFORE adding items to the NotificationQueue:

1. **Request Authentication:** Only authenticated users can trigger workflows
2. **Authorization Check:** User must have permission for the action (e.g., PBP approval)
3. **Data Validation:** All input is validated before processing
4. **Audit Logging:** Every notification trigger is logged to the AuditTrail table

**This means:**
- ✅ Power Automate only receives valid, authenticated requests
- ✅ No unauthorized users can trigger notifications
- ✅ All notification events are audited
- ✅ Invalid data is rejected before reaching the notification queue

**For IT:** When setting up Power Automate, you can trust that items in the NotificationQueue have already passed backend security validation.

---

## Prerequisites

Before starting this guide, you must have completed:

- [ ] **Step 0: Environment Setup** (SESSION_SECRET generated)
- [ ] Step 1: SQL Server Setup (database created with AuditTrail table)
- [ ] Step 2: SharePoint Libraries Setup (site created)
- [ ] Azure AD setup from IT (App Registration details received)
- [ ] Backend API deployed and working

**Why?** Power Automate will watch the SharePoint NotificationQueue list. The API writes to this list when stage changes occur. The backend now includes security validation before adding items to the queue.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 HOW NOTIFICATIONS WORK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User action (e.g., PBP approves)                            │
│              │                                                   │
│              ▼                                                   │
│  2. Backend API updates Submissions table                        │
│              │                                                   │
│              ▼                                                   │
│  3. Backend API writes ONE record to NotificationQueue          │
│     (SharePoint list)                                           │
│              │                                                   │
│              ▼                                                   │
│  4. Power Automate triggers: "New item in NotificationQueue"    │
│              │                                                   │
│              ▼                                                   │
│  5. Power Automate reads notification details                   │
│              │                                                   │
│              ▼                                                   │
│  6. Power Automate sends email to correct recipient             │
│              │                                                   │
│              ▼                                                   │
│  7. Power Automate marks queue item as "Processed"              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why this pattern?**
- ✅ DLP compliant (SharePoint triggers, not HTTP)
- ✅ Predictable (one queue item = one email)
- ✅ No notification spam from field updates
- ✅ Auditable (queue shows all notifications sent)
- ✅ Scalable (handles thousands of submissions/year)

---

## Email Recipients Reference

## CRITICAL: Workflow Understanding

**PBP reviews the QUESTIONNAIRE (pre-submission), NOT the full form.**

```
Q2.7 = "No" → Questionnaire Modal → PBP reviews questionnaire → Approves
            → Requester gets certificate → Uploads to form → Completes form
            → Full form submitted → Goes to PROCUREMENT (not PBP)
```

**Alemba ticket is created when FULL FORM is submitted (goes to Procurement first).**

---

## Email Recipients Reference

| Notification Type | Recipient | Email | When Triggered |
|-------------------|-----------|-------|----------------|
| PBP Questionnaire Submitted | PBP Panel | **TBC** | Q2.7="No" + questionnaire submitted |
| PBP Questionnaire Approved | Requester | From questionnaire | PBP approves questionnaire |
| PBP Questionnaire Rejected | Requester | From questionnaire | PBP rejects questionnaire |
| Procurement Review Needed | Procurement Team | barts.procurement@nhs.net | FULL form submitted (Section 7) |
| OPW Review Needed | OPW Panel | Bartshealth.opwpanelbarts@nhs.net | Procurement routes to OPW |
| Contract Upload Needed | Contract Team | **TBC** (may share with OPW) | OPW completes |
| AP Control Review | AP Control | Apcontrol.bartshealth@nhs.net | Ready for final verification |
| Supplier Complete | Requester | From submission record | AP Control verifies |
| Supplier Rejected | Requester | From submission record | Any stage rejects |
| Admin Alerts | Admin | barts.procurement@nhs.net | Errors/issues |

---

## Part A: Create the NotificationQueue SharePoint List

### Step 1: Go to Your SharePoint Site

1. Open browser
2. Go to: `https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms`
3. Log in if prompted

### Step 2: Create New List

1. Click **"+ New"**
2. Click **"List"**
3. Click **"Blank list"**
4. Name: `NotificationQueue`
5. Description: `Queue for Power Automate email notifications. API writes here, Power Automate reads and sends emails.`
6. Click **"Create"**

### Step 3: Add Columns

Click **"+ Add column"** for each of these:

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| SubmissionID | Single line of text | Yes | Links to submission |
| NotificationType | Choice | Yes | See choices below |
| RecipientEmail | Single line of text | Yes | Who receives email |
| RecipientName | Single line of text | No | Display name |
| EmailSubject | Single line of text | Yes | Email subject line |
| EmailBody | Multiple lines of text | Yes | Email content (HTML) |
| Processed | Yes/No | Yes | Default: No |
| ProcessedDate | Date and time | No | When email was sent |
| ErrorMessage | Multiple lines of text | No | If sending failed |

### Step 4: Configure NotificationType Choices

When adding the NotificationType column, enter these choices:

```
PBP_QUESTIONNAIRE_SUBMITTED
PBP_QUESTIONNAIRE_APPROVED
PBP_QUESTIONNAIRE_REJECTED
PBP_INFO_REQUESTED
PROCUREMENT_REVIEW_NEEDED
PROCUREMENT_APPROVED
PROCUREMENT_REJECTED
OPW_REVIEW_NEEDED
OPW_APPROVED
OPW_REJECTED
CONTRACT_UPLOAD_NEEDED
CONTRACT_UPLOADED
AP_REVIEW_NEEDED
SUPPLIER_COMPLETE
SUPPLIER_REJECTED
DAILY_REMINDER
ADMIN_ALERT
```

**Note:** PBP notifications are for the QUESTIONNAIRE (pre-form submission), not the full form.
Procurement is the FIRST stage after full form submission.

### Step 5: Verify List Created

Your NotificationQueue list should now show columns:
- Title (default)
- SubmissionID
- NotificationType
- RecipientEmail
- RecipientName
- EmailSubject
- EmailBody
- Processed
- ProcessedDate
- ErrorMessage

**✅ CHECKPOINT: Can you see the NotificationQueue list with all columns?**

---

## Part B: Open Power Automate

### Step 1: Access Power Automate

1. Open browser
2. Go to: **https://make.powerautomate.com**
3. Sign in with your NHS email

### Step 2: Check Your Environment

Look at the top right - make sure you're in the correct environment (usually "Barts Health" or your organization name).

---

## Part C: Create Flow 1 - Process Notification Queue

This is the MAIN flow that sends all emails.

### Step 1: Create New Flow

1. Click **"+ Create"** (left sidebar)
2. Click **"Automated cloud flow"**
3. Name: `NHS-Supplier-ProcessNotificationQueue`
4. Search for trigger: **"When an item is created"**
5. Select **"When an item is created (SharePoint)"**
6. Click **"Create"**

### Step 2: Configure Trigger

Fill in the trigger:

| Field | Value |
|-------|-------|
| Site Address | `https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms` |
| List Name | `NotificationQueue` |

```
┌─────────────────────────────────────────────────────────────┐
│  When an item is created                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Site Address:  [NHS-Supplier-Forms              ▼]        │
│                                                             │
│  List Name:     [NotificationQueue               ▼]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Add Condition - Check Not Already Processed

1. Click **"+ New step"**
2. Search for **"Condition"**
3. Select **"Condition"**

Configure the condition:

| Field | Value |
|-------|-------|
| Left side | `Processed` (from dynamic content) |
| Operator | `is equal to` |
| Right side | `false` |

```
┌─────────────────────────────────────────────────────────────┐
│  Condition                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Processed]  [is equal to]  [false]                       │
│                                                             │
│  If yes ────────────────    If no ──────────────           │
│  (Send email)               (Do nothing)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: In the "If yes" Branch - Send Email

1. Inside the **"If yes"** box, click **"Add an action"**
2. Search for **"Send an email (V2)"**
3. Select **"Send an email (V2)"** (Office 365 Outlook)

Configure the email:

| Field | Value (Dynamic Content) |
|-------|------------------------|
| To | `RecipientEmail` |
| Subject | `EmailSubject` |
| Body | `EmailBody` |

```
┌─────────────────────────────────────────────────────────────┐
│  Send an email (V2)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  To:       [RecipientEmail]           (dynamic content)    │
│                                                             │
│  Subject:  [EmailSubject]             (dynamic content)    │
│                                                             │
│  Body:     [EmailBody]                (dynamic content)    │
│            ☑️ Is HTML: Yes                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**IMPORTANT:** Click on the Body field, then click the **"</>""** code view button and make sure "Is HTML" is enabled.

### Step 5: Mark as Processed

1. After the email action, click **"Add an action"**
2. Search for **"Update item"**
3. Select **"Update item (SharePoint)"**

Configure:

| Field | Value |
|-------|-------|
| Site Address | Same as trigger |
| List Name | `NotificationQueue` |
| Id | `ID` (from dynamic content - this is the item ID) |
| Processed | `Yes` |
| ProcessedDate | `utcNow()` (expression) |

**To enter utcNow():**
1. Click in the ProcessedDate field
2. Click **"Expression"** tab
3. Type: `utcNow()`
4. Click **"OK"**

### Step 6: Handle Errors (Optional but Recommended)

1. Click the **"..."** menu on the "Send an email" action
2. Click **"Configure run after"**
3. Check **"has failed"**

4. Add a parallel branch that runs on failure:
   - Update item with ErrorMessage = `Error sending email`

### Step 7: Save and Test

1. Click **"Save"** (top right)
2. Flow is now active

**To test:**
1. Go to SharePoint → NotificationQueue list
2. Click **"+ New"**
3. Add a test item:
   - SubmissionID: `TEST-001`
   - NotificationType: `ADMIN_ALERT`
   - RecipientEmail: `your.email@bartshealth.nhs.uk`
   - EmailSubject: `Test Notification`
   - EmailBody: `<p>This is a test notification.</p>`
   - Processed: `No`
4. Save the item
5. Check your email within 1-2 minutes

---

## Part D: Create Flow 2 - Daily Reminder

This sends reminders for submissions pending more than 2 days.

### Step 1: Create New Flow

1. Click **"+ Create"**
2. Click **"Scheduled cloud flow"**
3. Name: `NHS-Supplier-DailyReminder`
4. Configure schedule:
   - Start: Tomorrow's date
   - Repeat every: `1` `Day`
   - At these times: `09:00`
5. Click **"Create"**

### Step 2: Get Pending Submissions

1. Click **"+ New step"**
2. Search for **"Get items"**
3. Select **"Get items (SharePoint)"**

Configure:

| Field | Value |
|-------|-------|
| Site Address | Your SharePoint site |
| List Name | `Submissions` (if you have this list) OR use HTTP to call your API |

**Filter Query (if using SharePoint list):**
```
Status eq 'pending_review' and Created lt '@{addDays(utcNow(), -2)}'
```

### Step 3: Loop Through and Create Notifications

1. Click **"+ New step"**
2. Search for **"Apply to each"**
3. Select **"Apply to each"**
4. In "Select an output from previous steps": Choose `value` from Get items

Inside the loop:

1. Add **"Create item (SharePoint)"** action
2. Configure to create notification in NotificationQueue:

| Field | Value |
|-------|-------|
| Site Address | Your SharePoint site |
| List Name | `NotificationQueue` |
| SubmissionID | `SubmissionID` from current item |
| NotificationType | `DAILY_REMINDER` |
| RecipientEmail | Based on CurrentStage (use Switch or Condition) |
| EmailSubject | `Reminder: Submission [SubmissionID] pending review` |
| EmailBody | See template below |
| Processed | `No` |

### Step 4: Email Template for Reminder

```html
<p>This is a reminder that the following submission requires your review:</p>

<table style="border-collapse: collapse; width: 100%;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Submission ID:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">@{items('Apply_to_each')?['SubmissionID']}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Company:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">@{items('Apply_to_each')?['CompanyName']}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Submitted:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">@{items('Apply_to_each')?['Created']}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Days Waiting:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd; color: red;"><strong>More than 2 days</strong></td>
  </tr>
</table>

<p style="margin-top: 20px;">
  <a href="https://your-app-url/review/@{items('Apply_to_each')?['SubmissionID']}"
     style="background-color: #005EB8; color: white; padding: 10px 20px; text-decoration: none;">
    Review Now
  </a>
</p>

<p style="color: #666; font-size: 12px; margin-top: 20px;">
  This is an automated reminder from the NHS Supplier Setup System.
</p>
```

### Step 5: Save

Click **"Save"**.

---

## Part E: Email Templates Reference

The backend API will generate these email bodies, but here are the templates for reference:

### Template 1: PBP Review Needed

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background-color: #005EB8; color: white; padding: 20px;">
    <h2 style="margin: 0;">New Supplier Request - PBP Review Required</h2>
  </div>

  <div style="padding: 20px; background-color: #f5f5f5;">
    <p>A new supplier setup request requires Pre-Buy Panel review.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Submission ID:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[SubmissionID]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Requester:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[RequesterName]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Department:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[RequesterDepartment]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Supplier:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[CompanyName]</td>
      </tr>
    </table>

    <p>
      <a href="[ReviewPageURL]" style="background-color: #005EB8; color: white; padding: 12px 24px; text-decoration: none; display: inline-block;">
        Review Request
      </a>
    </p>

    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This is an automated notification from the NHS Supplier Setup System.<br>
      Barts Health NHS Trust
    </p>
  </div>
</div>
```

### Template 2: PBP Approved

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background-color: #00703C; color: white; padding: 20px;">
    <h2 style="margin: 0;">✓ Pre-Buy Panel Approved</h2>
  </div>

  <div style="padding: 20px; background-color: #f5f5f5;">
    <p>Dear [RequesterName],</p>

    <p>Your supplier pre-screening request has been <strong style="color: #00703C;">APPROVED</strong> by the Pre-Buy Panel.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Submission ID:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[SubmissionID]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Supplier:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[CompanyName]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Approved By:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[ApproverName]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Date:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[ApprovalDate]</td>
      </tr>
    </table>

    <h3>Next Steps:</h3>
    <ol>
      <li>Your approval certificate is attached to this email</li>
      <li>Return to the form and upload the certificate</li>
      <li>Complete the remaining sections (Supplier Details, Financial Info)</li>
      <li>Submit the full form</li>
    </ol>

    <p>
      <a href="[FormURL]" style="background-color: #005EB8; color: white; padding: 12px 24px; text-decoration: none; display: inline-block;">
        Continue Form
      </a>
    </p>
  </div>
</div>
```

### Template 3: PBP Rejected

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background-color: #d4351c; color: white; padding: 20px;">
    <h2 style="margin: 0;">Request Rejected</h2>
  </div>

  <div style="padding: 20px; background-color: #f5f5f5;">
    <p>Dear [RequesterName],</p>

    <p>Your supplier pre-screening request has been <strong style="color: #d4351c;">REJECTED</strong>.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Submission ID:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[SubmissionID]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Supplier:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[CompanyName]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Rejected By:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[ReviewerName]</td>
      </tr>
    </table>

    <div style="background-color: #fef7f7; border-left: 4px solid #d4351c; padding: 15px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #d4351c;">Reason for Rejection:</h4>
      <p style="margin-bottom: 0;">[RejectionReason]</p>
    </div>

    <p>Please review the feedback above. You may submit a new request once the issues have been addressed.</p>

    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      If you have questions, please contact the PBP Panel.
    </p>
  </div>
</div>
```

### Template 4: Supplier Setup Complete

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="background-color: #00703C; color: white; padding: 20px;">
    <h2 style="margin: 0;">✓ Supplier Setup Complete</h2>
  </div>

  <div style="padding: 20px; background-color: #f5f5f5;">
    <p>Dear [RequesterName],</p>

    <p>Great news! Your supplier setup request has been <strong style="color: #00703C;">COMPLETED</strong>.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Submission ID:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[SubmissionID]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Supplier:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[CompanyName]</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Vendor Number:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff; color: #00703C;"><strong>[VendorNumber]</strong></td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Completed:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">[CompletionDate]</td>
      </tr>
    </table>

    <p>The supplier is now active in the system and can be used for purchase orders.</p>

    <p>A complete record with all authorisation signatures is attached to this email for your records.</p>

    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      Thank you for using the NHS Supplier Setup System.<br>
      Barts Health NHS Trust
    </p>
  </div>
</div>
```

---

## Part F: Notification Types Summary

### Pre-Form Submission (Questionnaire to PBP)

| NotificationType | Trigger | Recipient | Notes |
|------------------|---------|-----------|-------|
| `PBP_QUESTIONNAIRE_SUBMITTED` | Q2.7="No" + questionnaire submitted | PBP Panel (TBC) | PBP reviews questionnaire ONLY |
| `PBP_QUESTIONNAIRE_APPROVED` | PBP approves questionnaire | Requester | Certificate issued |
| `PBP_QUESTIONNAIRE_REJECTED` | PBP rejects questionnaire | Requester | End of process |
| `PBP_INFO_REQUESTED` | PBP needs more info | Requester | Back-and-forth |

### Post-Form Submission (Full Form Workflow)

| NotificationType | Trigger | Recipient | Notes |
|------------------|---------|-----------|-------|
| `PROCUREMENT_REVIEW_NEEDED` | FULL form submitted (Section 7) | barts.procurement@nhs.net | First stage after submission |
| `PROCUREMENT_APPROVED` | Procurement approves | Next stage team | Routes to OPW or AP |
| `PROCUREMENT_REJECTED` | Procurement rejects | Requester | End of process |
| `OPW_REVIEW_NEEDED` | Procurement routes to OPW | Bartshealth.opwpanelbarts@nhs.net | IR35 determination |
| `OPW_APPROVED` | OPW determines IR35 | Contract team | Inside/Outside IR35 |
| `OPW_REJECTED` | OPW rejects | Requester | End of process |
| `CONTRACT_UPLOAD_NEEDED` | OPW complete | Contract team (TBC) | Agreement preparation |
| `CONTRACT_UPLOADED` | Contract uploaded | AP Control | Ready for final |
| `AP_REVIEW_NEEDED` | Ready for AP | Apcontrol.bartshealth@nhs.net | Final verification |
| `SUPPLIER_COMPLETE` | AP verifies | Requester | Vendor number issued |
| `SUPPLIER_REJECTED` | AP rejects | Requester | End of process |
| `DAILY_REMINDER` | Scheduled 9am | Based on stage | Pending > 2 days |
| `ADMIN_ALERT` | Errors/issues | barts.procurement@nhs.net | System errors |

---

## Completion Checklist

- [ ] NotificationQueue SharePoint list created with all columns
- [ ] Flow 1 (ProcessNotificationQueue) created and tested
- [ ] Flow 2 (DailyReminder) created
- [ ] Test email received successfully
- [ ] All flows are turned ON
- [ ] **Security check:** Verify emails are only sent for valid notification types
- [ ] **Security check:** Confirm AuditTrail logs every email sent (check database)

---

## Troubleshooting

### "Flow doesn't trigger"

1. Check flow is turned ON (toggle at top of flow editor)
2. Verify SharePoint site/list names match exactly
3. Check flow run history for errors

### "Email not sending"

1. Check RecipientEmail has valid email address
2. Verify Office 365 connector is authenticated
3. Check spam/junk folder

### "Permission denied"

1. Make sure you have access to the SharePoint site
2. Verify your account can send emails via Outlook

### "Flow runs but nothing happens"

1. Check the Condition - is Processed already "Yes"?
2. Look at flow run history for which branch executed

---

## TBC Items

Update this document when these are confirmed:

| Item | Current Status | Update When Known |
|------|----------------|-------------------|
| PBP Panel mailbox | Being set up | [Fill in email] |
| Contract team mailbox | TBC (may share with OPW) | [Fill in email] |

---

## Next Steps

Once Power Automate is set up:

1. ✅ All infrastructure is ready
2. Deploy backend API
3. Deploy frontend
4. End-to-end testing

---

*Document Version: 1.0 | Created: January 2026*
