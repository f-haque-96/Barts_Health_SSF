# NHS Supplier Setup Form - Complete Deployment Guide

**Version:** 2.1
**Last Updated:** 26 January 2026
**SharePoint Site:** https://nhs.sharepoint.com/sites/R1H_FIN_Legacy_Procurement/

---

## Table of Contents

1. [System Overview](#1-system-overview)
   - [Rejection Notification System](#rejection-notification-system)
   - [Fuzzy Matching & Duplicate Detection](#fuzzy-matching--duplicate-detection)
   - [Conflict of Interest Flagging](#conflict-of-interest-flagging)
2. [Prerequisites](#2-prerequisites)
3. [SharePoint Setup](#3-sharepoint-setup)
4. [Power Automate Flows](#4-power-automate-flows)
5. [React App Configuration](#5-react-app-configuration)
6. [Running Locally](#6-running-locally)
7. [Building for Production](#7-building-for-production)
8. [Deployment Options](#8-deployment-options)
9. [External System Integration](#9-external-system-integration)
10. [Testing Checklist](#10-testing-checklist)
11. [Draft Emails for Vendors](#11-draft-emails-for-vendors)
12. [Claude Documentation Prompt](#12-claude-documentation-prompt)
13. [Troubleshooting](#13-troubleshooting)
14. [Quick Reference](#14-quick-reference)

---

## 1. System Overview

### What This System Does

This is an NHS Supplier Setup Form application that:
- Allows NHS staff to request new supplier setups
- Routes requests through approval workflows (PBP Panel, Procurement, OPW/IR35)
- Stores data in SharePoint Lists
- Sends automated notifications via Power Automate
- **Automatically notifies requesters of rejections with detailed reasons**
- **Fuzzy matching to detect duplicate suppliers and flag for review**
- **Conflict of interest detection and flagging**
- Integrates with Alemba (ticketing) and VerseOne (V1) - **TBC**
- Generates PDF documentation

### Workflow Summary

```
Requester Submits Form
        |
        v
[Section 1-2] Pre-Screening Questionnaire
        |
        v
PBP Panel Review (Approve/Reject/Request Info)
        |
        v (if approved)
[Section 3-7] Complete Supplier Details
        |
        v
Procurement Review
        |
    +---+---+
    |       |
Standard   OPW/IR35 Route
    |       |
    v       v
AP Control <- OPW Panel Review
    |
    v
Supplier Created in System
```

### Key Constraints

**DLP Policy Restriction:**
- Cannot use `shared_office365` connector with `httpRequestReceived` trigger
- **Solution:** Use SharePoint list triggers instead of HTTP triggers
- All Power Automate flows in this guide are designed to work within these constraints

**External Systems:**
- **Alemba:** TBC - Awaiting API access
- **VerseOne (V1):** TBC - Awaiting API access

### Rejection Notification System

When a submission is rejected at any stage, the system automatically:

1. **Notifies the Requester** via email with:
   - Submission ID and supplier name
   - Who rejected it and from which department (PBP/Procurement)
   - Date of rejection
   - **Full rejection reason** explaining why it was rejected
   - **Alemba ticket reference and link** (if an Alemba call exists)
   - Notification that Alemba ticket has been closed
   - Next steps to resolve the issue

2. **Closes Alemba Ticket** (if applicable):
   - Automatically closes/cancels the Alemba call
   - Sets status to "Rejected"
   - Records closure reason matching the rejection reason
   - Includes link to Alemba ticket in requester email

3. **Notifies the Admin Team** with:
   - Alert about the rejection
   - Full audit trail details
   - Alemba ticket reference and closure status

4. **Creates an Audit Entry** containing:
   - Timestamp and submission details
   - Rejection reason
   - Flag status (REQUESTER_FLAGGED)
   - Notification confirmation
   - Alemba ticket reference and closure status

**Rejection Flow:**
```
Reviewer Clicks "Reject"
        |
        v
Enters Rejection Reason (Required)
        |
        v
Signs Decision
        |
        v
System Automatically:
  - Closes Alemba ticket (if exists) with rejection reason
  - Sends email to requester with reason + Alemba link
  - Sends alert to admin team
  - Creates audit trail entry
  - Updates submission status
```

**Alemba Ticket in Rejection Email:**
```
ALEMBA TICKET STATUS:
The Alemba call (3000545) has been closed with reason: Rejected.
You can view the ticket details at: https://alemba.nhs.net/calls/3000545
```

### Alemba API Integration - Mandatory Fields

When closing an Alemba ticket via API, the following **mandatory fields** must be provided:

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| Type | Dropdown | `New supplier request` | Select from dropdown |
| Reason | Dropdown | `New supplier created` or `Query resolved` | Based on outcome |
| Call Status | Dropdown | `Closed` | Final status |
| Resolution Summary | Text | Dynamic | Generated based on outcome |
| Email User | Checkbox | `true` | Notify the user |

**Reason Field Mapping:**

| Outcome | Alemba Reason Value |
|---------|---------------------|
| Supplier successfully created | `New supplier created` |
| Request rejected | `Query resolved` |
| OPW/IR35 determination complete | `Query resolved` |

**Resolution Summary Examples:**

| Scenario | Resolution Summary |
|----------|-------------------|
| **Approved** | `New supplier created. Acme Ltd - Vendor 1234` |
| **Rejected** | `Rejected request - No approval email attached. Rejected by John Smith at Procurement stage. Guidance sent to requester.` |
| **OPW Inside IR35** | `OPW/IR35 Determination: Inside IR35. Acme Consulting. Processed via OPW route.` |
| **OPW Outside IR35** | `OPW/IR35 Determination: Outside IR35. Acme Consulting. Processed via OPW route.` |

**API Payload Structure:**
```json
{
  "alembaReference": "3000545",
  "alembaFields": {
    "type": "New supplier request",
    "reason": "Query resolved",
    "callStatus": "Closed",
    "resolutionSummary": "Rejected request - Missing documentation. Rejected by Jane Doe at Procurement stage. Guidance sent to requester.",
    "emailUser": true
  }
}
```

### Fuzzy Matching & Duplicate Detection

The system includes fuzzy matching to detect potential duplicate suppliers:

**How It Works:**
1. When a submission is approved at PBP stage, the system checks the supplier name against existing suppliers
2. Uses Levenshtein distance algorithm to calculate similarity scores
3. Flags potential duplicates based on thresholds:
   - **95%+ similarity:** EXACT_MATCH - Likely duplicate
   - **85-94% similarity:** HIGH_SIMILARITY - Needs review
   - **75-84% similarity:** POTENTIAL_MATCH - Worth checking

**When Flagged:**
- Admin team receives notification with all potential matches
- PBP team receives notification for high-similarity matches (85%+)
- Reviewers see warning before approving

**Normalization Applied:**
- Removes common suffixes (Ltd, Limited, PLC, LLP, etc.)
- Converts to lowercase
- Removes special characters
- Normalizes whitespace

**Example:**
- "Acme Solutions Ltd" and "ACME SOLUTIONS LIMITED" = 100% match
- "Smith Consulting" and "Smiths Consultancy" = ~85% match

### Conflict of Interest Flagging

When a requester declares a connection to the supplier (Section 2):

1. **Automatic Alert** sent to:
   - Admin team
   - PBP Panel

2. **Alert Contains:**
   - Requester name and email
   - Supplier name
   - Declared connection details
   - Request for additional scrutiny

---

## 2. Prerequisites

### Software Requirements

- **Node.js** (version 18 or higher) - Download from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

To check your versions:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

### Access Requirements

- SharePoint Site Owner or Admin access to: https://nhs.sharepoint.com/sites/R1H_FIN_Legacy_Procurement/
- Power Automate Premium license
- Office 365 email account for notifications

---

## 3. SharePoint Setup

### Step 3.1: Create SharePoint Lists

Navigate to: https://nhs.sharepoint.com/sites/R1H_FIN_Legacy_Procurement/

#### List 1: SupplierSubmissions (Main data store)

1. Click **Site Contents** (gear icon > Site contents)
2. Click **+ New** > **List**
3. Select **Blank list**
4. Name: `SupplierSubmissions`
5. Click **Create**
6. Add columns by clicking **+ Add column**:

| Column Name | Type | Required | Settings |
|-------------|------|----------|----------|
| SubmissionID | Single line of text | Yes | |
| Status | Choice | Yes | Choices: Draft, PendingPBP, PBPApproved, PBPRejected, PendingProcurement, ProcurementApproved, PendingOPW, OPWComplete, PendingAP, Complete, Rejected |
| CurrentStage | Choice | Yes | Choices: PreScreening, PBPReview, SupplierDetails, ProcurementReview, OPWReview, ContractDrafting, APControl, Complete |
| RequesterName | Single line of text | Yes | |
| RequesterEmail | Single line of text | Yes | |
| RequesterDepartment | Single line of text | Yes | |
| RequesterPhone | Single line of text | No | |
| ServiceCategory | Choice | Yes | Choices: Goods, Services, Works, Consultancy |
| CompanyName | Single line of text | No | |
| SupplierType | Choice | No | Choices: limited_company, sole_trader, charity, partnership, public_sector |
| CRN | Single line of text | No | |
| EstimatedValue | Currency | No | |
| FormDataJSON | Multiple lines of text | No | Plain text, unlimited |
| CreatedDate | Date and Time | Yes | Include time |
| LastModified | Date and Time | Yes | Include time |
| PBPApprover | Person or Group | No | |
| PBPApprovalDate | Date and Time | No | |
| PBPComments | Multiple lines of text | No | |
| ProcurementApprover | Person or Group | No | |
| ProcurementRoute | Choice | No | Choices: Standard, OPW_IR35 |
| OPWApprover | Person or Group | No | |
| IR35Determination | Choice | No | Choices: Inside_IR35, Outside_IR35 |
| APApprover | Person or Group | No | |
| VendorNumber | Single line of text | No | |
| AlembaTicketID | Single line of text | No | |
| V1Reference | Single line of text | No | |

#### List 2: ReviewComments (Audit trail)

1. Click **+ New** > **List** > **Blank list**
2. Name: `ReviewComments`
3. Add columns:

| Column Name | Type | Required | Settings |
|-------------|------|----------|----------|
| SubmissionID | Single line of text | Yes | |
| ReviewerName | Single line of text | Yes | |
| ReviewerEmail | Single line of text | Yes | |
| ReviewerRole | Choice | Yes | Choices: PBP, Procurement, OPW, AP, ContractDrafter |
| Decision | Choice | Yes | Choices: Approved, Rejected, MoreInfoRequested, InsideIR35, OutsideIR35, Complete |
| Comments | Multiple lines of text | No | |
| Timestamp | Date and Time | Yes | |

#### List 3: DocumentUploads (File metadata)

1. Click **+ New** > **List** > **Blank list**
2. Name: `DocumentUploads`
3. Add columns:

| Column Name | Type | Required | Settings |
|-------------|------|----------|----------|
| SubmissionID | Single line of text | Yes | |
| DocumentType | Choice | Yes | Choices: Letterhead, ProcurementApproval, CESTForm, Passport, DrivingLicence, Contract, Other |
| FileName | Single line of text | Yes | |
| FileURL | Single line of text | Yes | |
| UploadedBy | Person or Group | Yes | |
| UploadedDate | Date and Time | Yes | |

#### List 4: NotificationQueue (For triggering flows)

1. Click **+ New** > **List** > **Blank list**
2. Name: `NotificationQueue`
3. Add columns:

| Column Name | Type | Required | Settings |
|-------------|------|----------|----------|
| SubmissionID | Single line of text | Yes | |
| NotificationType | Choice | Yes | Choices: PBPReviewRequest, PBPApproval, PBPRejection, MoreInfoRequest, ProcurementReviewRequest, OPWReviewRequest, APNotification, RequesterUpdate, CompletionNotice |
| RecipientEmail | Single line of text | Yes | |
| RecipientName | Single line of text | No | |
| Subject | Single line of text | Yes | |
| Body | Multiple lines of text | Yes | Rich text |
| Processed | Yes/No | Yes | Default: No |
| ProcessedDate | Date and Time | No | |
| ErrorMessage | Single line of text | No | |

### Step 3.2: Create Document Library

1. Click **+ New** > **Document library**
2. Name: `SupplierDocuments`
3. Click **Create**
4. Create folder structure by clicking **+ New** > **Folder**:
   - `2026` (create year folders as needed)

### Step 3.3: Set Permissions

1. Go to **Settings** (gear icon) > **Site permissions**
2. Click **Create group** to create these groups:

| Group Name | Members | Purpose |
|------------|---------|---------|
| PBP Panel Members | PBP reviewers | Can approve/reject pre-screening |
| Procurement Team | Procurement staff | Can review and route submissions |
| OPW Panel | OPW/IR35 assessors | Can make IR35 determinations |
| AP Control Team | AP team members | Can finalise supplier setup |

3. Set list permissions:
   - Go to each list > **Settings** > **Permissions for this list**
   - Grant **Contribute** access to relevant groups

---

## 4. Power Automate Flows

### Important: DLP Compliance

Your organisation's DLP policy restricts using `shared_office365` with `httpRequestReceived`. All flows below use SharePoint list triggers to comply with this policy.

### Flow 1: Process New Submission (PBP Notification)

**Purpose:** When a new submission is created, notify the PBP Panel

**Create the flow:**

1. Go to https://make.powerautomate.com/
2. Click **+ Create** > **Automated cloud flow**
3. Name: `NHS-Supplier-01-NewSubmission`
4. Search for trigger: **When an item is created**
5. Select **When an item is created (SharePoint)**
6. Click **Create**

**Configure the trigger:**
- Site Address: `https://nhs.sharepoint.com/sites/R1H_FIN_Legacy_Procurement`
- List Name: `SupplierSubmissions`

**Add Condition:**
1. Click **+ New step** > **Condition**
2. Set: `Status` is equal to `PendingPBP`

**If Yes branch:**

1. Add **Send an email (V2)** action:
   - To: `pbp-panel@nhs.net` (replace with your PBP distribution list)
   - Subject: `New Supplier Request - @{triggerOutputs()?['body/SubmissionID']} - Action Required`
   - Body (switch to code view and paste):

```html
<p>A new supplier setup request requires PBP review.</p>

<table style="border-collapse: collapse; width: 100%;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Submission ID:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">@{triggerOutputs()?['body/SubmissionID']}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Requester:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">@{triggerOutputs()?['body/RequesterName']}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Department:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">@{triggerOutputs()?['body/RequesterDepartment']}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Service Category:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">@{triggerOutputs()?['body/ServiceCategory']}</td>
  </tr>
</table>

<p><a href="https://YOUR-APP-URL/pbp-review/@{triggerOutputs()?['body/SubmissionID']}" style="background-color: #005eb8; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 10px;">Review Request</a></p>

<p style="color: #666; font-size: 12px;">This is an automated notification from the NHS Supplier Setup System.</p>
```

2. Add **Create item** action (NotificationQueue for audit):
   - Site Address: Same as above
   - List Name: `NotificationQueue`
   - SubmissionID: `@{triggerOutputs()?['body/SubmissionID']}`
   - NotificationType: `PBPReviewRequest`
   - RecipientEmail: `pbp-panel@nhs.net`
   - Subject: Same as email subject
   - Body: `PBP review request sent`
   - Processed: `Yes`
   - ProcessedDate: `@{utcNow()}`

3. Click **Save**

### Flow 2: Process PBP Decision

**Purpose:** When PBP approves/rejects, notify requester and route accordingly

**Create the flow:**

1. **+ Create** > **Automated cloud flow**
2. Name: `NHS-Supplier-02-PBPDecision`
3. Trigger: **When an item is modified (SharePoint)**
4. Site: Same SharePoint site
5. List: `SupplierSubmissions`

**Add Condition:** Check if PBPApprovalDate was just set
- `PBPApprovalDate` is not equal to `null`

**Add nested Condition:** Check Status

**If Status = PBPApproved:**
1. Send email to requester (approval notification)
2. Update item: Set `CurrentStage` to `SupplierDetails`

**If Status = PBPRejected:**
1. Send email to requester (rejection notification with detailed reason)
2. Send alert email to Admin team

### Flow 2b: Rejection Notification Email (IMPORTANT)

**Purpose:** Ensure all rejections notify the requester with full details and reasons

**This flow is triggered automatically when status changes to PBPRejected or ProcurementRejected**

**Email Template for Rejection:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #da291c; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">Supplier Setup Request Rejected</h1>
  </div>

  <div style="padding: 20px; background-color: #f5f5f5;">
    <p>Dear @{triggerOutputs()?['body/RequesterName']},</p>

    <p>Your supplier setup request has been <strong style="color: #da291c;">rejected</strong>.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Submission ID:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">@{triggerOutputs()?['body/SubmissionID']}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Supplier Name:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">@{triggerOutputs()?['body/CompanyName']}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Rejected By:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">@{triggerOutputs()?['body/PBPApprover']} (PBP Panel)</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Date:</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">@{formatDateTime(triggerOutputs()?['body/PBPApprovalDate'], 'dd MMMM yyyy')}</td>
      </tr>
    </table>

    <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #856404;">Reason for Rejection:</h3>
      <p style="margin-bottom: 0;">@{triggerOutputs()?['body/PBPComments']}</p>
    </div>

    <h3>Next Steps:</h3>
    <p>Please review the feedback above and address the issues identified. You may submit a new request once the concerns have been resolved.</p>

    <p>If you have questions, please contact the reviewing team.</p>

    <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
      This is an automated notification from the NHS Supplier Setup System.<br>
      Barts Health NHS Trust
    </p>
  </div>
</div>
```

**Key Points:**
- **Rejection reason is REQUIRED** - The system enforces this in the React app
- Email clearly shows WHO rejected, WHEN, and WHY
- Requester knows exactly what to fix before resubmitting

### Flow 3: Process Full Submission (To Procurement)

**Purpose:** When full form is submitted, notify Procurement team

**Trigger:** When an item is modified (SupplierSubmissions)
**Condition:** Status equals `PendingProcurement`

**Actions:**
1. Send email to Procurement Team
2. Create audit record in NotificationQueue

### Flow 4: Process Procurement Decision

**Purpose:** Route to Standard (AP) or OPW/IR35 path

**Trigger:** When an item is modified (SupplierSubmissions)
**Condition:** ProcurementRoute has been set

**If ProcurementRoute = Standard:**
- Update Status to `PendingAP`
- Send email to AP Control team

**If ProcurementRoute = OPW_IR35:**
- Update Status to `PendingOPW`
- Send email to OPW Panel

### Flow 5: Daily Reminder for Pending Reviews

**Purpose:** Send reminders for submissions pending more than 2 days

1. **+ Create** > **Scheduled cloud flow**
2. Name: `NHS-Supplier-05-DailyReminder`
3. Set schedule: Daily at 9:00 AM

**Actions:**
1. Get items from SupplierSubmissions
2. Filter: Status = PendingPBP AND CreatedDate < (Now - 2 days)
3. For each item: Send reminder email

---

## 5. React App Configuration

### Environment Variables

Create `.env.production` file in the project root:

```env
# SharePoint Configuration
VITE_SHAREPOINT_SITE=https://nhs.sharepoint.com/sites/R1H_FIN_Legacy_Procurement
VITE_SHAREPOINT_LIST_SUBMISSIONS=SupplierSubmissions
VITE_SHAREPOINT_LIST_COMMENTS=ReviewComments
VITE_SHAREPOINT_LIST_DOCUMENTS=DocumentUploads
VITE_SHAREPOINT_DOC_LIBRARY=SupplierDocuments

# API Configuration (if using Azure Functions backend)
VITE_API_URL=https://your-function-app.azurewebsites.net/api

# Feature Flags
VITE_ENABLE_TEST_BUTTONS=false

# External Systems (TBC)
VITE_ALEMBA_API_URL=
VITE_V1_API_URL=
```

### SharePoint REST API Integration

The app uses the SharePoint REST API. Update `src/utils/api.js` to include SharePoint calls:

```javascript
// SharePoint configuration
const SP_SITE = import.meta.env.VITE_SHAREPOINT_SITE;
const SP_LIST_SUBMISSIONS = import.meta.env.VITE_SHAREPOINT_LIST_SUBMISSIONS;

// Create submission in SharePoint
export const createSharePointSubmission = async (formData) => {
  const submissionId = `SUP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

  // This will be called when the form is submitted
  // The actual SharePoint API call requires authentication context
  // which is provided when the app is hosted in SharePoint

  const listData = {
    SubmissionID: submissionId,
    Status: 'PendingPBP',
    CurrentStage: 'PreScreening',
    RequesterName: `${formData.firstName} ${formData.lastName}`,
    RequesterEmail: formData.nhsEmail,
    RequesterDepartment: formData.department,
    RequesterPhone: formData.phoneNumber,
    ServiceCategory: formData.serviceCategory,
    FormDataJSON: JSON.stringify(formData),
    CreatedDate: new Date().toISOString(),
    LastModified: new Date().toISOString(),
  };

  return { submissionId, listData };
};
```

---

## 6. Running Locally

### Step 1: Download/Clone the Project

```bash
git clone https://github.com/YOUR-ORG/nhs-supplier-form-react.git
cd nhs-supplier-form-react
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Local Environment File

**Windows (Command Prompt):**
```cmd
copy .env.example .env.local
```

**Windows (PowerShell) / Mac / Linux:**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_ENABLE_TEST_BUTTONS=true
VITE_API_URL=
```

### Step 4: Start Development Server

```bash
npm run dev
```

The application starts at `http://localhost:5173`

### Step 5: Access the Application

- **Main Form:** http://localhost:5173
- **PBP Review:** http://localhost:5173/pbp-review/TEST-001
- **Procurement Review:** http://localhost:5173/procurement-review/TEST-001
- **AP Control:** http://localhost:5173/ap-review/TEST-001

---

## 7. Building for Production

### Step 1: Set Production Environment Variables

Ensure `.env.production` has correct values (see Section 5).

### Step 2: Build

```bash
npm run build
```

Creates a `dist` folder with production files.

### Step 3: Preview (Optional)

```bash
npm run preview
```

Opens at `http://localhost:4173`

---

## 8. Deployment Options

### Option A: Deploy to SharePoint (Recommended for NHS)

1. Build the app: `npm run build`
2. Go to your SharePoint site
3. Navigate to **Site Contents** > **Site Assets**
4. Create a folder called `supplier-form`
5. Upload all files from the `dist` folder
6. Create a SharePoint page with an **Embed** web part pointing to the index.html

### Option B: Azure Static Web Apps

1. Create an Azure Static Web App
2. Connect to your GitHub repository
3. Configure build:
   - App location: `/`
   - Output location: `dist`
4. Add environment variables in Azure Portal

### Option C: IIS Server

1. Copy `dist` folder contents to IIS website root
2. Add `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## 9. External System Integration

### Alemba Integration (TBC)

**Status:** Awaiting API access confirmation

**What's Needed:**
- API endpoint URL
- Authentication credentials (API key or OAuth)
- Ticket creation payload format
- Ticket status query endpoint

**Implementation Plan:**
When API access is granted, Power Automate will create Alemba tickets:
1. Add new Flow triggered on AP completion
2. Call Alemba API to create ticket
3. Store ticket ID in SupplierSubmissions list

### VerseOne (V1) Integration (TBC)

**Status:** Awaiting API access confirmation

**What's Needed:**
- API documentation
- Authentication method
- Supplier creation endpoint
- Required fields mapping

**Implementation Plan:**
When API access is granted:
1. Add V1 API call to AP completion flow
2. Create supplier record in V1
3. Store V1 reference in SupplierSubmissions list

---

## 10. Testing Checklist

### Pre-Deployment

- [ ] All SharePoint lists created with correct columns
- [ ] Document library created
- [ ] Permission groups created and populated
- [ ] Power Automate flows created and turned on
- [ ] React app builds without errors
- [ ] Environment variables configured

### Functional Testing

- [ ] Submit new request (Sections 1-2)
- [ ] Verify PBP notification email received
- [ ] Test PBP approval (check requester gets email)
- [ ] Test PBP rejection (check requester gets email)
- [ ] Complete full form (Sections 3-7)
- [ ] Test Procurement review and routing
- [ ] Test OPW/IR35 route (if applicable)
- [ ] Test AP Control completion
- [ ] Verify PDF generation works
- [ ] Test file uploads

### Integration Testing (When Available)

- [ ] Alemba ticket creation
- [ ] V1 supplier creation
- [ ] End-to-end workflow completion

---

## 11. Draft Emails for Vendors

### Email to Alemba

**To:** [Alemba Support Email]
**Subject:** API Access Request - NHS Barts Health Supplier Setup Integration

```
Dear Alemba Support Team,

I am writing from Barts Health NHS Trust regarding a new supplier setup workflow
system we are implementing. We would like to integrate with Alemba to automatically
create tickets when new supplier requests are submitted and approved.

We require the following information:

1. API DOCUMENTATION
   - REST API endpoint URLs for ticket creation
   - Authentication method (API key, OAuth 2.0, etc.)
   - Required fields for ticket creation
   - Ticket status query endpoints

2. TECHNICAL REQUIREMENTS
   - API rate limits
   - Supported payload formats (JSON/XML)
   - Webhook/callback capabilities for status updates
   - Error response formats

3. ACCESS CREDENTIALS
   - Test/UAT environment API credentials
   - Production environment request process

4. INTEGRATION SUPPORT
   - Technical contact for implementation questions
   - Sample API requests/responses
   - Postman collection or similar (if available)

OUR USE CASE:
- Create tickets automatically when supplier setup requests are approved
- Update ticket status as requests progress through approval stages
- Query ticket status for display in our web application
- Close tickets when supplier setup is complete

TECHNICAL ENVIRONMENT:
- Microsoft Power Automate (Premium) for automation
- SharePoint Online for data storage
- React-based web application for user interface

Please let me know the best way to proceed with obtaining API access and documentation.

Kind regards,
[Your Name]
[Your Title]
Barts Health NHS Trust
[Your Email]
[Your Phone]
```

### Email to VerseOne (V1)

**To:** [VerseOne Support Email]
**Subject:** API Access Request - NHS Barts Health Supplier Setup Integration

```
Dear VerseOne Support Team,

I am writing from Barts Health NHS Trust regarding integration with your V1 system
for our new supplier setup workflow application.

We are implementing an automated supplier onboarding system and need to create
supplier records in V1 once they have been approved through our internal processes.

We require the following information:

1. API DOCUMENTATION
   - REST API endpoint URLs for supplier creation
   - Authentication method and credentials process
   - Required and optional fields for supplier records
   - Field validation rules and data formats

2. TECHNICAL SPECIFICATIONS
   - Supported HTTP methods
   - Request/response formats (JSON/XML)
   - Error handling and status codes
   - Rate limiting policies

3. DATA MAPPING
   - V1 supplier record field specifications
   - Mandatory fields list
   - Field length and format constraints
   - Lookup/reference data requirements (e.g., category codes)

4. ENVIRONMENT ACCESS
   - Test/UAT environment for development
   - Production access request process
   - API key or OAuth credentials

5. SUPPORT
   - Technical implementation contact
   - Documentation portal access
   - Sample integration code (if available)

OUR WORKFLOW:
- Submit approved supplier details to V1 after internal approval process
- Receive confirmation and supplier/vendor reference number
- Store reference for future lookups and audit trail

DATA WE WILL PROVIDE:
- Company name and trading name
- Registered address
- Contact details (name, email, phone)
- Company registration number (CRN)
- VAT number (if applicable)
- Bank details
- Service category

TECHNICAL ENVIRONMENT:
- Microsoft Power Automate (Premium) for automation
- SharePoint Online for data storage
- React-based web application for user interface

Please advise on the next steps to obtain API access and documentation.

Kind regards,
[Your Name]
[Your Title]
Barts Health NHS Trust
[Your Email]
[Your Phone]
```

---

## 12. Claude Documentation Prompt

Use this prompt with Claude to generate complete, detailed documentation:

```
I need comprehensive, beginner-friendly documentation for deploying and operating
an NHS Supplier Setup Form application. Please create detailed step-by-step guides.

PROJECT CONTEXT:
- React application (Vite + React 19) for NHS supplier onboarding
- SharePoint site: https://nhs.sharepoint.com/sites/R1H_FIN_Legacy_Procurement/
- Power Automate Premium license with DLP restrictions:
  * Cannot use HTTP Request trigger with Office 365 connector
  * Must use SharePoint list triggers instead
- External integrations: Alemba (ticketing) and VerseOne V1 (supplier management) - both TBC

WORKFLOW STAGES:
1. Requester fills Sections 1-2 (pre-screening questionnaire)
2. PBP Panel reviews and approves/rejects/requests more info
3. If approved, requester completes Sections 3-7 (full supplier details)
4. Procurement reviews and routes to Standard or OPW/IR35 path
5. If OPW route: OPW Panel makes IR35 determination
6. AP Control team finalises supplier setup in finance systems
7. Notifications sent at each stage

Please create detailed documentation for each of the following:

1. SHAREPOINT SETUP GUIDE
   - Exact steps to create each list with screenshots placeholder descriptions
   - Column configurations with data types, choices, and validation
   - Document library setup
   - Permission groups creation and configuration
   - List views for different user roles

2. POWER AUTOMATE FLOWS (DLP COMPLIANT)
   - Use ONLY SharePoint list triggers (no HTTP triggers)
   - Flow 1: New submission notification to PBP
   - Flow 2: PBP decision processing (approval/rejection/more info)
   - Flow 3: Full form submission to Procurement
   - Flow 4: Procurement decision routing
   - Flow 5: OPW Panel notification and decision
   - Flow 6: AP Control notification
   - Flow 7: Completion notification
   - Flow 8: Daily reminder for pending reviews
   - Include exact configuration for each action
   - Include email templates with dynamic fields

3. REACT APP DEPLOYMENT
   - Local development setup
   - Environment variables explanation
   - Building for production
   - Deploying to SharePoint
   - Deploying to Azure Static Web Apps
   - Testing the deployment

4. USER GUIDES (separate document for each role)
   - REQUESTER GUIDE: How to submit a new supplier request
   - PBP PANEL GUIDE: How to review and make decisions
   - PROCUREMENT GUIDE: How to review and route submissions
   - OPW PANEL GUIDE: How to make IR35 determinations
   - AP CONTROL GUIDE: How to complete supplier setup

5. ADMINISTRATOR GUIDE
   - How to add/remove users from permission groups
   - How to modify Power Automate flows
   - How to handle stuck or errored submissions
   - How to view audit logs
   - Backup and recovery procedures

6. TROUBLESHOOTING GUIDE
   - Common issues and solutions
   - How to check Power Automate flow run history
   - How to debug SharePoint permission issues
   - How to check React app errors

Make all documentation:
- Beginner-friendly with no assumed technical knowledge
- Include [Screenshot: description] placeholders where visual aids would help
- Include exact click paths (e.g., "Click Settings > Site permissions > Advanced permissions")
- Include checklists at the end of each section
- Use tables for reference information
- Include warnings for common mistakes
```

---

## 13. Troubleshooting

### SharePoint Issues

**List not showing new columns:**
- Refresh the page
- Check column was saved (look for confirmation message)
- Try creating column again

**Permission denied errors:**
- Verify user is in correct SharePoint group
- Check list-level permissions
- Clear browser cache and try again

### Power Automate Issues

**Flow not triggering:**
- Check flow is turned ON
- Verify trigger configuration matches list/site
- Check flow run history for errors

**DLP Policy violation:**
- Ensure you're using SharePoint triggers, not HTTP
- Don't mix Office 365 connector with non-business connectors

**Emails not sending:**
- Check recipient email addresses
- Verify Office 365 connector is authenticated
- Check spam/junk folders

### React App Issues

**Build fails:**
- Run `npm install` to ensure dependencies are installed
- Check for syntax errors: `npm run lint`
- Delete `node_modules` and reinstall

**Blank page after deployment:**
- Ensure web server redirects to index.html (SPA routing)
- Check browser console for JavaScript errors
- Verify all files uploaded to correct location

**Environment variables not working:**
- Variables must start with `VITE_`
- Rebuild app after changing `.env.production`
- Check variable is defined: `console.log(import.meta.env.VITE_VAR_NAME)`

---

## 14. Quick Reference

### Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code for errors |

### Key Files

| File | Purpose |
|------|---------|
| `.env.local` | Local environment variables |
| `.env.production` | Production environment variables |
| `src/stores/formStore.js` | Form state management |
| `src/utils/api.js` | API integration |
| `src/components/sections/` | Form section components |
| `src/pages/` | Review page components |

### SharePoint Lists

| List | Purpose |
|------|---------|
| SupplierSubmissions | Main submission data |
| ReviewComments | Audit trail of decisions |
| DocumentUploads | File upload metadata |
| NotificationQueue | Email notification audit |

### Support Contacts

| Issue Type | Contact |
|------------|---------|
| SharePoint/Power Automate | IT Service Desk |
| React App Code | Development Team |
| Alemba Integration | TBC |
| VerseOne Integration | TBC |

---

## Quick Start Checklist

- [ ] Create all SharePoint lists (Section 3)
- [ ] Set up document library (Section 3)
- [ ] Configure permission groups (Section 3)
- [ ] Create Power Automate flows (Section 4)
- [ ] Test flows with sample data
- [ ] Configure environment variables (Section 5)
- [ ] Build React app (Section 7)
- [ ] Deploy to SharePoint or Azure (Section 8)
- [ ] Test end-to-end workflow (Section 10)
- [ ] Send emails to Alemba and V1 (Section 11)
- [ ] Train users on their respective guides

---

*Document maintained by: Development Team*
*Last updated: January 2026*
