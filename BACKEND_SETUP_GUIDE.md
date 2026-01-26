# NHS Supplier Setup Form - Backend Setup Guide

## URGENT DEPLOYMENT GUIDE

This guide provides step-by-step instructions to set up the backend using **SharePoint Lists** as the database, **Power Automate** for workflow automation, and **Alemba** for ticket routing.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Workflow Summary](#2-workflow-summary)
3. [SharePoint Setup](#3-sharepoint-setup)
4. [Power Automate Flows](#4-power-automate-flows)
5. [Alemba Integration](#5-alemba-integration)
6. [Frontend Integration](#6-frontend-integration)
7. [Email Templates](#7-email-templates)
8. [Testing Checklist](#8-testing-checklist)
9. [Quick Reference](#9-quick-reference)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (VerseOne)                             │
│                         React Application with SSO                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POWER AUTOMATE (HTTP Triggers)                     │
│  • Submit PBP Review          • Submit Full Form                            │
│  • Get Submission Status      • Update Submission Status                     │
│  • Upload Document            • Verify CRN (Companies House)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   SHAREPOINT LISTS   │  │      ALEMBA      │  │    O365 EMAIL        │
│   (Database)         │  │   (Ticketing)    │  │  (Notifications)     │
│                      │  │                  │  │                      │
│ • Submissions        │  │ • Create Ticket  │  │ • PBP Approval Cert  │
│ • PBP Reviews        │  │ • Route to Team  │  │ • Status Updates     │
│ • Documents          │  │ • Track Status   │  │ • Setup Confirmation │
│ • Audit Log          │  │                  │  │ • PDF Attachments    │
└──────────────────────┘  └──────────────────┘  └──────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React (VerseOne hosted) | User interface |
| Authentication | VerseOne SSO | Role-based access |
| Database | SharePoint Lists | Store form data |
| Workflow | Power Automate Premium | Business logic & routing |
| Ticketing | Alemba REST API | Route to departments |
| Email | O365 Outlook | Notifications & certificates |
| File Storage | SharePoint Document Library | Uploaded documents |

---

## 2. Workflow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: PRE-SCREENING (Section 2 Questionnaire)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Requester fills Section 1 & 2  ──►  Submits Questionnaire                 │
│                                              │                              │
│                                              ▼                              │
│                                    Power Automate triggers                  │
│                                              │                              │
│                                              ▼                              │
│                              ┌───────────────────────────┐                  │
│                              │     PBP PANEL REVIEW      │                  │
│                              │  (Via email link to page) │                  │
│                              └───────────────────────────┘                  │
│                                              │                              │
│                    ┌─────────────────────────┼─────────────────────────┐    │
│                    ▼                         ▼                         ▼    │
│              ┌─────────┐              ┌─────────────┐            ┌─────────┐│
│              │ APPROVE │              │ REQUEST INFO│            │ REJECT  ││
│              └────┬────┘              └──────┬──────┘            └────┬────┘│
│                   │                          │                        │     │
│                   ▼                          ▼                        ▼     │
│         Email approval cert         Email to requester         Email reject │
│         to requester                asking for more info       notification │
│                   │                          │                        │     │
│                   ▼                          │                        │     │
│         Requester uploads                    │                   END FLOW   │
│         cert to Q2.7                         │                              │
│                   │                          │                              │
│                   ▼                          │                              │
│         Continue to Section 3+               │                              │
│                                              │                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: FULL FORM SUBMISSION                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Requester completes Sections 3-7  ──►  Submits Full Form                  │
│                                              │                              │
│                                              ▼                              │
│                              Power Automate + Alemba Ticket                 │
│                                              │                              │
│                                              ▼                              │
│                              ┌───────────────────────────┐                  │
│                              │   PROCUREMENT REVIEW      │                  │
│                              │  (Via Alemba ticket link) │                  │
│                              └───────────────────────────┘                  │
│                                              │                              │
│                    ┌─────────────────────────┼─────────────────────────┐    │
│                    ▼                         ▼                         ▼    │
│         ┌──────────────────┐      ┌──────────────────┐          ┌─────────┐│
│         │ STANDARD SUPPLIER│      │   POTENTIAL OPW  │          │ REJECT  ││
│         └────────┬─────────┘      └────────┬─────────┘          └────┬────┘│
│                  │                         │                          │     │
│                  │                         ▼                          │     │
│                  │              ┌──────────────────────┐              │     │
│                  │              │   OPW PANEL REVIEW   │              │     │
│                  │              │ (Inside/Outside IR35)│              │     │
│                  │              └──────────┬───────────┘              │     │
│                  │                         │                          │     │
│                  │                         ▼                          │     │
│                  │              ┌──────────────────────┐              │     │
│                  │              │   CONTRACT DRAFTER   │              │     │
│                  │              │(Upload signed contract)             │     │
│                  │              └──────────┬───────────┘              │     │
│                  │                         │                          │     │
│                  ▼                         ▼                          │     │
│         ┌──────────────────────────────────────────────┐              │     │
│         │              AP CONTROL REVIEW               │              │     │
│         │     (Verify bank details, setup supplier)    │              │     │
│         └──────────────────────┬───────────────────────┘              │     │
│                                │                                      │     │
│                                ▼                                      │     │
│                    Email to requester with                       END FLOW   │
│                    PDF (all signatures)                                     │
│                    "Supplier Setup Complete"                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SharePoint Setup

### 3.1 Create SharePoint Site

1. Go to SharePoint Admin Center
2. Create a new **Team Site** called: `NHS-Supplier-Forms`
3. Set permissions for relevant teams

### 3.2 Create SharePoint Lists

You need to create **4 SharePoint Lists**:

---

#### LIST 1: SupplierSubmissions (Main submissions database)

**Go to:** SharePoint Site → New → List → Blank List → Name: `SupplierSubmissions`

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line text | Yes | Auto-generated submission ID (e.g., SUP-2025-00001) |
| Status | Choice | Yes | Choices: `PBP_Pending`, `PBP_Approved`, `PBP_Rejected`, `PBP_MoreInfo`, `Submitted`, `Procurement_Review`, `OPW_Review`, `Contract_Draft`, `AP_Review`, `Completed`, `Rejected` |
| CurrentStage | Choice | Yes | Choices: `PBP`, `Procurement`, `OPW`, `ContractDraft`, `AP`, `Complete` |
| RequesterName | Single line text | Yes | |
| RequesterEmail | Single line text | Yes | |
| RequesterDepartment | Single line text | Yes | |
| RequesterPhone | Single line text | No | |
| CompanyName | Single line text | Yes | |
| TradingName | Single line text | No | |
| SupplierType | Choice | Yes | Choices: `LIMITED_COMPANY`, `CHARITY`, `SOLE_TRADER`, `PUBLIC_SECTOR` |
| CRN | Single line text | No | Company Registration Number |
| CRNVerified | Yes/No | No | |
| CharityNumber | Single line text | No | |
| RegisteredAddress | Multiple lines text | No | |
| City | Single line text | No | |
| Postcode | Single line text | No | |
| ContactName | Single line text | Yes | |
| ContactEmail | Single line text | Yes | |
| ContactPhone | Single line text | No | |
| BankName | Single line text | No | |
| SortCode | Single line text | No | |
| AccountNumber | Single line text | No | |
| IBAN | Single line text | No | |
| SwiftCode | Single line text | No | |
| ServiceDescription | Multiple lines text | No | |
| ContractValue | Currency | No | |
| PaymentTerms | Single line text | No | |
| FormDataJSON | Multiple lines text | Yes | Full form data as JSON |
| SubmittedDate | Date and Time | Yes | |
| LastUpdated | Date and Time | Yes | |
| AlembaTicketID | Single line text | No | |
| PBPApprovalDate | Date and Time | No | |
| PBPApprovedBy | Single line text | No | |
| ProcurementDecision | Choice | No | Choices: `Standard`, `OPW`, `Rejected` |
| ProcurementApprovedBy | Single line text | No | |
| ProcurementDate | Date and Time | No | |
| OPWDecision | Choice | No | Choices: `Inside_IR35`, `Outside_IR35` |
| OPWApprovedBy | Single line text | No | |
| OPWDate | Date and Time | No | |
| APApprovedBy | Single line text | No | |
| APApprovalDate | Date and Time | No | |
| SupplierConnection | Yes/No | No | Conflict of interest flag |
| ConnectionDetails | Multiple lines text | No | |

---

#### LIST 2: PBPReviews (Pre-Buy Panel reviews)

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line text | Yes | Links to SubmissionID |
| SubmissionID | Lookup | Yes | Lookup to SupplierSubmissions |
| QuestionnaireJSON | Multiple lines text | Yes | Section 2 data as JSON |
| Status | Choice | Yes | Choices: `Pending`, `Approved`, `Rejected`, `MoreInfoRequested` |
| ReviewerName | Single line text | No | |
| ReviewerEmail | Single line text | No | |
| ReviewDate | Date and Time | No | |
| ReviewComments | Multiple lines text | No | |
| MoreInfoRequest | Multiple lines text | No | |
| ApprovalCertificateURL | Hyperlink | No | |

---

#### LIST 3: Documents (Uploaded files tracking)

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line text | Yes | Document name |
| SubmissionID | Lookup | Yes | Lookup to SupplierSubmissions |
| DocumentType | Choice | Yes | Choices: `PBP_Certificate`, `Letterhead`, `ID_Document`, `Contract`, `Other` |
| FileURL | Hyperlink | Yes | SharePoint document library URL |
| UploadedBy | Single line text | Yes | |
| UploadedDate | Date and Time | Yes | |

---

#### LIST 4: AuditLog (Activity tracking)

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line text | Yes | Auto-generated log ID |
| SubmissionID | Lookup | Yes | Lookup to SupplierSubmissions |
| Action | Choice | Yes | Choices: `Created`, `Updated`, `StatusChanged`, `DocumentUploaded`, `EmailSent`, `AlembaTicketCreated` |
| ActionBy | Single line text | Yes | |
| ActionDate | Date and Time | Yes | |
| Details | Multiple lines text | No | |
| PreviousValue | Single line text | No | |
| NewValue | Single line text | No | |

---

### 3.3 Create Document Library

1. **Go to:** SharePoint Site → New → Document Library
2. **Name:** `SupplierDocuments`
3. **Create folders:**
   - `/PBP_Certificates/`
   - `/Letterheads/`
   - `/ID_Documents/`
   - `/Contracts/`
   - `/SignedForms/`

---

## 4. Power Automate Flows

You need to create **6 Power Automate flows**:

### 4.1 Flow 1: Submit PBP Questionnaire

**Trigger:** HTTP Request (When a HTTP request is received)

```
Flow Name: NHS-Supplier-SubmitPBPQuestionnaire
```

**Steps:**

1. **Trigger: When a HTTP request is received**
   - Method: POST
   - Request Body JSON Schema:
   ```json
   {
     "type": "object",
     "properties": {
       "requesterName": { "type": "string" },
       "requesterEmail": { "type": "string" },
       "requesterDepartment": { "type": "string" },
       "requesterPhone": { "type": "string" },
       "questionnaireData": { "type": "object" }
     }
   }
   ```

2. **Initialize variable** - SubmissionID
   - Name: `varSubmissionID`
   - Type: String
   - Value: `SUP-@{formatDateTime(utcNow(), 'yyyy')}-@{rand(10000,99999)}`

3. **Create item** (SharePoint - SupplierSubmissions list)
   - Title: `@{variables('varSubmissionID')}`
   - Status: `PBP_Pending`
   - CurrentStage: `PBP`
   - RequesterName: `@{triggerBody()?['requesterName']}`
   - RequesterEmail: `@{triggerBody()?['requesterEmail']}`
   - RequesterDepartment: `@{triggerBody()?['requesterDepartment']}`
   - FormDataJSON: `@{string(triggerBody()?['questionnaireData'])}`
   - SubmittedDate: `@{utcNow()}`
   - LastUpdated: `@{utcNow()}`

4. **Create item** (SharePoint - PBPReviews list)
   - Title: `@{variables('varSubmissionID')}`
   - SubmissionID: (lookup to created item)
   - QuestionnaireJSON: `@{string(triggerBody()?['questionnaireData'])}`
   - Status: `Pending`

5. **Create item** (SharePoint - AuditLog)
   - Action: `Created`
   - Details: `PBP Questionnaire submitted`

6. **Send an email (V2)** - To PBP Panel
   - To: `pbp-panel@bartshealth.nhs.uk` (or distribution list)
   - Subject: `[ACTION REQUIRED] New Supplier Pre-Screening: @{variables('varSubmissionID')}`
   - Body: (See Email Templates section)

7. **Response** - Return to frontend
   ```json
   {
     "success": true,
     "submissionId": "@{variables('varSubmissionID')}",
     "message": "Questionnaire submitted for PBP review"
   }
   ```

---

### 4.2 Flow 2: PBP Panel Decision

**Trigger:** HTTP Request

```
Flow Name: NHS-Supplier-PBPDecision
```

**Request Body:**
```json
{
  "submissionId": "string",
  "decision": "string",  // Approved, Rejected, MoreInfoRequested
  "reviewerName": "string",
  "reviewerEmail": "string",
  "comments": "string",
  "moreInfoRequest": "string"
}
```

**Steps:**

1. **Get item** (SharePoint - SupplierSubmissions by Title = submissionId)

2. **Condition:** Check decision

   **If Approved:**
   - Update SupplierSubmissions: Status = `PBP_Approved`, PBPApprovalDate = utcNow(), PBPApprovedBy = reviewerName
   - Update PBPReviews: Status = `Approved`, ReviewerName, ReviewDate, ReviewComments
   - **Generate PDF** (using premium connector or call external service)
   - **Upload PDF** to SharePoint Document Library
   - **Send email** to requester with approval certificate attached
   - Store certificate URL in PBPReviews.ApprovalCertificateURL

   **If Rejected:**
   - Update SupplierSubmissions: Status = `PBP_Rejected`
   - Update PBPReviews: Status = `Rejected`
   - **Send email** to requester with rejection notice

   **If MoreInfoRequested:**
   - Update SupplierSubmissions: Status = `PBP_MoreInfo`
   - Update PBPReviews: Status = `MoreInfoRequested`, MoreInfoRequest = moreInfoRequest
   - **Send email** to requester requesting more information

3. **Create AuditLog entry**

4. **Response**

---

### 4.3 Flow 3: Submit Full Form (WITH AUTOMATIC ALEMBA TICKET CREATION)

**Trigger:** HTTP Request

```
Flow Name: NHS-Supplier-SubmitFullForm
```

**Request Body:**
```json
{
  "submissionId": "string",
  "formData": { },
  "uploadedFiles": { }
}
```

**Steps:**

1. **Get item** (SupplierSubmissions by submissionId)

2. **Condition:** Verify PBP status is `PBP_Approved`

3. **Update item** (SupplierSubmissions)
   - Status: `Submitted`
   - CurrentStage: `Procurement`
   - All form fields from formData
   - FormDataJSON: full JSON

4. **Calculate Priority** (Condition based on ContractValue):
   - >= £100,000 → Critical
   - >= £50,000 → High
   - >= £10,000 → Medium
   - < £10,000 → Low

5. **🎫 CREATE ALEMBA TICKET AUTOMATICALLY** (HTTP Action):
   ```
   Method: POST
   URI: https://bartshealth.alemba.cloud/api/v1/requests
   Headers:
     Content-Type: application/json
     Authorization: Bearer {API_KEY}
   Body:
   {
     "title": "New Supplier Setup - @{variables('SubmissionID')} - @{formData.companyName}",
     "description": "REQUESTER: @{formData.requesterName} (@{formData.nhsEmail})\nDEPARTMENT: @{formData.department}\n\nSUPPLIER: @{formData.companyName}\nTYPE: @{formData.supplierType}\nCRN: @{formData.crn}\nCONTACT: @{formData.contactName} (@{formData.contactEmail})\n\nADDRESS:\n@{formData.registeredAddress}\n@{formData.city}, @{formData.postcode}\n\nBANK DETAILS:\nSort Code: @{formData.sortCode}\nAccount: @{formData.accountNumber}\n\nCONTRACT VALUE: £@{formData.contractValue}\n\nREVIEW PAGE: @{variables('ReviewPageURL')}",
     "priority": "@{variables('Priority')}",
     "assignedTeam": "Procurement Team",
     "category": "Supplier Setup",
     "customFields": {
       "cf_submission_id": "@{variables('SubmissionID')}",
       "cf_supplier_name": "@{formData.companyName}",
       "cf_contract_value": @{formData.contractValue},
       "cf_requester_email": "@{formData.nhsEmail}",
       "cf_review_page_url": "@{variables('ReviewPageURL')}"
     },
     "attachments": [
       { "name": "PBP_Approval_Certificate.pdf", "url": "@{PBPCertificateURL}" },
       { "name": "Bank_Details_Letterhead.pdf", "url": "@{LetterheadDocumentURL}" }
     ]
   }
   ```

   > ⚠️ **Note:** ID documents (passport/driving licence) are NOT attached to protect sensitive data

6. **Parse JSON** - Extract ticketId from response

7. **Update SharePoint** - Store AlembaTicketID in submission record

8. **Create AuditLog entry** - "Alemba ticket REQ-XXXXX created"

9. **Send email** to Procurement with ticket number

10. **Response** - Return submissionId and alembaTicketId

---

### 4.4 Flow 4: Procurement Decision (WITH ALEMBA TICKET UPDATE)

**Trigger:** HTTP Request

```
Flow Name: NHS-Supplier-ProcurementDecision
```

**Request Body:**
```json
{
  "submissionId": "string",
  "decision": "Standard | OPW | Rejected",
  "reviewerName": "string",
  "reviewerEmail": "string",
  "comments": "string"
}
```

**Steps based on decision:**

- **Standard Supplier:**
  1. Update SharePoint: Status = `AP_Review`, CurrentStage = `AP`
  2. **🎫 UPDATE ALEMBA TICKET:**
     ```
     Method: PATCH
     URI: https://bartshealth.alemba.cloud/api/v1/requests/{AlembaTicketID}
     Body:
     {
       "status": "In Progress",
       "assignedTeam": "AP Control Team",
       "customFields": { "cf_workflow_stage": "AP Control" }
     }
     ```
  3. **Add comment to ticket:**
     ```
     POST /requests/{ticketId}/comments
     { "text": "✅ PROCUREMENT APPROVED as Standard Supplier\nApproved by: {reviewerName}\nRouting to AP Control" }
     ```
  4. Send email to AP Control with link

- **Potential OPW:**
  1. Update SharePoint: Status = `OPW_Review`, CurrentStage = `OPW`
  2. **🎫 UPDATE ALEMBA TICKET:**
     ```
     PATCH /requests/{AlembaTicketID}
     { "assignedTeam": "OPW Panel", "customFields": { "cf_workflow_stage": "OPW Review" } }
     ```
  3. **Add comment:** "⚠️ Identified as Potential OPW - Routing to OPW Panel for IR35 determination"
  4. Send email to OPW Panel with link

- **Rejected:**
  1. Update SharePoint: Status = `Rejected`
  2. **🎫 UPDATE ALEMBA TICKET:**
     ```
     PATCH /requests/{AlembaTicketID}
     { "status": "Rejected", "resolution": "Rejected by Procurement: {reason}" }
     ```
  3. **Add comment:** "❌ REJECTED by Procurement\nReason: {comments}"
  4. Email requester with rejection notification

---

### 4.5 Flow 5: OPW Panel Decision (WITH ALEMBA TICKET UPDATE)

**Trigger:** HTTP Request

```
Flow Name: NHS-Supplier-OPWDecision
```

**Request Body:**
```json
{
  "submissionId": "string",
  "decision": "Inside_IR35 | Outside_IR35",
  "reviewerName": "string",
  "reviewerEmail": "string",
  "comments": "string"
}
```

**Steps:**

1. Get submission from SharePoint (includes AlembaTicketID)
2. Update SharePoint: Status = `Contract_Draft`, CurrentStage = `ContractDraft`, OPWDecision = decision
3. **🎫 UPDATE ALEMBA TICKET:**
   ```
   Method: PATCH
   URI: /requests/{AlembaTicketID}
   Body:
   {
     "assignedTeam": "Contract Drafting Team",
     "customFields": {
       "cf_workflow_stage": "Contract Draft",
       "cf_ir35_status": "{decision}"
     }
   }
   ```
4. **Add comment to ticket:**
   ```
   POST /requests/{ticketId}/comments
   {
     "text": "📋 OPW PANEL DECISION: {decision}\n\nDetermined by: {reviewerName}\nIR35 Status: {Inside IR35 / Outside IR35}\n\nRouting to Contract Drafter for agreement preparation."
   }
   ```

5. **Attach CEST form to ticket:**
   ```
   POST /requests/{ticketId}/attachments
   { "name": "CEST_Determination_{submissionId}.pdf", "url": "{CESTFormURL}" }
   ```

6. Email Contract Drafter with link to upload signed contract

---

### 4.6 Flow 6: AP Control Completion (WITH AUTOMATIC TICKET CLOSURE)

**Trigger:** HTTP Request

```
Flow Name: NHS-Supplier-APComplete
```

**Request Body:**
```json
{
  "submissionId": "string",
  "approverName": "string",
  "approverEmail": "string",
  "approverSignature": "string",
  "bankDetailsVerified": true,
  "vendorNumber": "string",
  "comments": "string"
}
```

**Steps:**

1. Get submission from SharePoint (includes AlembaTicketID and full history)

2. Update SharePoint:
   - Status = `Completed`
   - CurrentStage = `Complete`
   - APApprovedBy = approverName
   - APApprovalDate = utcNow()

3. Generate final PDF with all signatures (use PDF connector or call external service)

4. Upload PDF to SharePoint Document Library

5. **🎫 CLOSE ALEMBA TICKET AUTOMATICALLY:**
   ```
   Method: PATCH
   URI: https://bartshealth.alemba.cloud/api/v1/requests/{AlembaTicketID}
   Headers:
     Content-Type: application/json
     Authorization: Bearer {API_KEY}
   Body:
   {
     "status": "Resolved",
     "resolution": "Supplier successfully created in finance system. Vendor Number: {vendorNumber}",
     "closedDate": "@{utcNow()}",
     "customFields": {
       "cf_workflow_stage": "Complete",
       "cf_vendor_number": "{vendorNumber}"
     }
   }
   ```

6. **Add final comment to ticket with full audit trail:**
   ```
   POST /requests/{ticketId}/comments
   {
     "text": "✅ SUPPLIER SETUP COMPLETE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSUPPLIER CREATED\nVendor Number: {vendorNumber}\nCompany: {companyName}\nSetup Date: {completionDate}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAUTHORISATION TRAIL\n\n1. PBP Approval: {pbpDate} by {pbpApprover}\n2. Procurement: {procDate} by {procApprover} ({procDecision})\n3. OPW Panel: {owpDate} by {owpApprover} (if applicable)\n4. Contract: {contractDate} (if applicable)\n5. AP Control: {apDate} by {apApprover}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nRequester notified. PDF attached.\n\nTICKET CLOSED."
   }
   ```

7. **Attach documents to ticket (excluding ID documents for data protection):**
   ```
   POST /requests/{ticketId}/attachments

   Attachment 1: Final PDF
   { "name": "Supplier_Setup_Complete_{submissionId}.pdf", "url": "{SharePointPDFUrl}" }

   Attachment 2: Bank Details Letterhead
   { "name": "Bank_Details_Letterhead.pdf", "url": "{LetterheadDocumentURL}" }

   Attachment 3 (if OPW route): CEST Form
   { "name": "CEST_Determination_{submissionId}.pdf", "url": "{CESTFormURL}" }

   Attachment 4 (if contract required): Signed Contract
   { "name": "Signed_Contract_{submissionId}.pdf", "url": "{ContractDocumentURL}" }

   ⚠️ DO NOT ATTACH: ID documents (passport/driving licence) - data protection
   ```

8. Create AuditLog entry: "Supplier setup complete. Alemba ticket {ticketId} closed."

9. **Send email to requester:**
   - Subject: "✅ Supplier Setup Complete - {companyName}"
   - Attach: Final PDF with all signatures
   - Body: Confirmation with vendor number

10. Return success response

---

### 4.7 Flow 7: Contract Upload (WITH ALEMBA TICKET UPDATE)

**Trigger:** HTTP Request

```
Flow Name: NHS-Supplier-ContractUpload
```

**Request Body:**
```json
{
  "submissionId": "string",
  "contractType": "IR35_Inside | IR35_Outside | Standard",
  "documentUrl": "string",
  "uploaderName": "string",
  "uploaderEmail": "string"
}
```

**Steps:**

1. Get submission from SharePoint (includes AlembaTicketID)

2. Update SharePoint:
   - Status = `AP_Review`
   - CurrentStage = `AP`
   - ContractDocumentUrl = documentUrl

3. **🎫 UPDATE ALEMBA TICKET:**
   ```
   Method: PATCH
   URI: /requests/{AlembaTicketID}
   Body:
   {
     "assignedTeam": "AP Control Team",
     "customFields": { "cf_workflow_stage": "AP Control" }
   }
   ```

4. **Add comment to ticket:**
   ```
   POST /requests/{ticketId}/comments
   {
     "text": "📄 SIGNED CONTRACT UPLOADED\n\nUploaded by: {uploaderName}\nContract Type: {contractType}\n\nRouting to AP Control for final supplier setup."
   }
   ```

5. **Attach contract to ticket:**
   ```
   POST /requests/{ticketId}/attachments
   { "name": "Signed_Contract_{submissionId}.pdf", "url": "{documentUrl}" }
   ```

6. Create AuditLog entry

7. Email AP Control with link to complete setup

8. Return success response

---

### 4.8 Creating HTTP Trigger Flows - Step by Step

For each flow above:

1. **Go to:** https://make.powerautomate.com
2. **Click:** Create → Instant cloud flow
3. **Select trigger:** "When a HTTP request is received"
4. **After saving**, you'll get a URL like:
   ```
   https://prod-XX.westeurope.logic.azure.com:443/workflows/XXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXXX
   ```
5. **Copy this URL** - this is your API endpoint

---

## 5. Alemba Integration

> **📚 For comprehensive Alemba integration details, see [ALEMBA_INTEGRATION.md](./ALEMBA_INTEGRATION.md)**

### 5.1 Overview

Alemba integration provides:

| Feature | When It Happens | Automatic? |
|---------|-----------------|------------|
| 🎫 **Ticket Created** | When full form is submitted | ✅ Yes |
| 📝 **Ticket Updated** | At each workflow stage | ✅ Yes |
| ✅ **Ticket Closed** | When AP Control completes setup | ✅ Yes |

### 5.2 Ticket Lifecycle Summary

```
Form Submitted → 🎫 TICKET CREATED (all form data auto-filled)
       ↓
Procurement Decision → 📝 Ticket updated, reassigned
       ↓
OPW Panel (if needed) → 📝 Ticket updated
       ↓
Contract Upload (if needed) → 📝 Document attached
       ↓
AP Control Completes → ✅ TICKET CLOSED (with full audit trail)
```

### 5.3 What Gets Auto-Filled in Ticket

When ticket is created, ALL form data is included:

- **Requester:** Name, Email, Department, Phone
- **Supplier:** Company Name, Type, CRN, Address, Contact details
- **Financial:** Bank details, Contract value, Payment terms
- **Links:** Direct link to review page
- **Attachments:** PBP approval certificate

### 5.4 Getting Started with Alemba

**Contact your Alemba administrator for:**

1. API Base URL (e.g., `https://bartshealth.alemba.cloud/api/v1`)
2. API Key for authentication
3. Service Catalog ID for "Supplier Setup"
4. Team IDs for routing (Procurement, OPW, AP Control)

### 5.5 Quick API Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Create ticket | POST | `/api/v1/requests` |
| Update ticket | PATCH | `/api/v1/requests/{ticketId}` |
| Add comment | POST | `/api/v1/requests/{ticketId}/comments` |
| Attach file | POST | `/api/v1/requests/{ticketId}/attachments` |
| Close ticket | PATCH | `/api/v1/requests/{ticketId}` with `status: "Resolved"`
```

### 5.6 Simple Integration Approach (Recommended for Speed)

**Minimal Alemba integration for quick deployment:**

1. **Create ticket** when form is submitted (after PBP approval)
2. **Include review page URL** in ticket so Procurement clicks to open
3. **Add comments** as status changes
4. **Close ticket** when complete

**You do NOT need to:**
- Pull data back from Alemba to the form
- Sync bidirectionally
- Use webhooks initially

This keeps it simple while still having audit trail in Alemba.

### 5.7 Getting Alemba API Access

Contact your IT team / Alemba administrator to:

1. Get API endpoint URL
2. Get API key or OAuth credentials
3. Get list of available categories/teams
4. Test access in Postman first

---

## 6. Frontend Integration

### 6.1 Update Environment Variables

Edit `.env.production`:

```env
# Power Automate Flow URLs (get these after creating flows)
VITE_API_SUBMIT_PBP=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXX
VITE_API_PBP_DECISION=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?...
VITE_API_SUBMIT_FORM=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?...
VITE_API_GET_SUBMISSION=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?...
VITE_API_PROCUREMENT_DECISION=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?...
VITE_API_OPW_DECISION=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?...
VITE_API_AP_COMPLETE=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?...

# Disable test buttons
VITE_ENABLE_TEST_BUTTONS=false
```

### 6.2 Code Changes Required

I will create/update these files for you:

1. `src/utils/api.js` - New file for API calls
2. `src/components/sections/Section2PreScreening.jsx` - Add PBP submission
3. `src/components/sections/Section7ReviewSubmit.jsx` - Update submission logic
4. `src/pages/ProcurementReviewPage.jsx` - Add decision submission
5. `src/pages/OPWReviewPage.jsx` - Add decision submission
6. `src/pages/APControlReviewPage.jsx` - Add completion logic

---

## 7. Email Templates

### 7.1 PBP Review Request Email

**To:** PBP Panel
**Subject:** [ACTION REQUIRED] New Supplier Pre-Screening: {SubmissionID}

```html
<h2>New Supplier Pre-Screening Request</h2>

<p><strong>Submission ID:</strong> {SubmissionID}</p>
<p><strong>Submitted:</strong> {SubmittedDate}</p>

<h3>Requester Details</h3>
<ul>
  <li><strong>Name:</strong> {RequesterName}</li>
  <li><strong>Email:</strong> {RequesterEmail}</li>
  <li><strong>Department:</strong> {RequesterDepartment}</li>
</ul>

<h3>Supplier Overview</h3>
<ul>
  <li><strong>Company:</strong> {CompanyName}</li>
  <li><strong>Type:</strong> {SupplierType}</li>
  <li><strong>Estimated Value:</strong> {ContractValue}</li>
</ul>

<p><strong>Please review and make a decision:</strong></p>

<a href="{PBPReviewPageURL}" style="background-color: #005EB8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
  Review Submission
</a>

<p style="color: #666; font-size: 12px; margin-top: 24px;">
  This is an automated message from the NHS Supplier Setup System.
</p>
```

### 7.2 PBP Approval Certificate Email

**To:** Requester
**Subject:** Pre-Buy Panel APPROVED: {SubmissionID}

```html
<h2>Pre-Buy Panel Approval</h2>

<p>Your supplier pre-screening request has been <strong style="color: green;">APPROVED</strong>.</p>

<p><strong>Submission ID:</strong> {SubmissionID}</p>
<p><strong>Approved By:</strong> {ApproverName}</p>
<p><strong>Approval Date:</strong> {ApprovalDate}</p>

<h3>Next Steps</h3>
<ol>
  <li>Download and save the attached approval certificate</li>
  <li>Return to the Supplier Setup Form</li>
  <li>Upload the approval certificate in Section 2, Question 2.7</li>
  <li>Complete the remaining sections of the form</li>
</ol>

<a href="{FormURL}" style="background-color: #005EB8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
  Continue Form
</a>

<p><strong>Attachment:</strong> PBP_Approval_Certificate_{SubmissionID}.pdf</p>
```

### 7.3 Supplier Setup Complete Email

**To:** Requester
**Subject:** Supplier Setup COMPLETE: {CompanyName} - {SubmissionID}

```html
<h2>Supplier Setup Complete</h2>

<p>Your supplier setup request has been <strong style="color: green;">COMPLETED</strong>.</p>

<p><strong>Submission ID:</strong> {SubmissionID}</p>
<p><strong>Supplier:</strong> {CompanyName}</p>
<p><strong>Completion Date:</strong> {CompletionDate}</p>

<h3>Authorisation Summary</h3>
<ul>
  <li><strong>PBP Approval:</strong> {PBPApprovalDate} by {PBPApprover}</li>
  <li><strong>Procurement Approval:</strong> {ProcurementDate} by {ProcurementApprover}</li>
  <li><strong>AP Control Approval:</strong> {APDate} by {APApprover}</li>
</ul>

<p>Please find attached the completed supplier setup form with all authorisation signatures.</p>

<p><strong>Attachment:</strong> Supplier_Setup_Complete_{SubmissionID}.pdf</p>

<p style="color: #666; font-size: 12px; margin-top: 24px;">
  The supplier is now active in the system and can be used for purchase orders.
</p>
```

---

## 8. Testing Checklist

### Phase 1: SharePoint Setup
- [ ] SharePoint site created
- [ ] SupplierSubmissions list created with all columns
- [ ] PBPReviews list created
- [ ] Documents list created
- [ ] AuditLog list created
- [ ] SupplierDocuments library created with folders

### Phase 2: Power Automate Flows
- [ ] Flow 1: Submit PBP Questionnaire - Created and tested
- [ ] Flow 2: PBP Decision - Created and tested
- [ ] Flow 3: Submit Full Form - Created and tested
- [ ] Flow 4: Procurement Decision - Created and tested
- [ ] Flow 5: OPW Decision - Created and tested
- [ ] Flow 6: AP Complete - Created and tested

### Phase 3: Alemba Integration
- [ ] API credentials obtained
- [ ] Test ticket creation works
- [ ] Ticket routing to correct team

### Phase 4: Frontend Integration
- [ ] API URLs configured in .env.production
- [ ] Section 2 PBP submission working
- [ ] Section 7 full submission working
- [ ] Review pages sending decisions

### Phase 5: End-to-End Testing
- [ ] Full workflow test: Submit → PBP → Procurement → AP → Complete
- [ ] OPW workflow test: Submit → PBP → Procurement (OPW) → OPW Panel → Contract → AP
- [ ] Rejection workflow test
- [ ] Email notifications received
- [ ] PDF generation working

---

## 9. Quick Reference

### SharePoint Site URL
```
https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms
```

### Power Automate Flow URLs
*(Fill in after creating)*

| Flow | URL |
|------|-----|
| Submit PBP | `https://prod-XX.westeurope.logic.azure.com/...` |
| PBP Decision | `https://prod-XX.westeurope.logic.azure.com/...` |
| Submit Form | `https://prod-XX.westeurope.logic.azure.com/...` |
| Procurement Decision | `https://prod-XX.westeurope.logic.azure.com/...` |
| OPW Decision | `https://prod-XX.westeurope.logic.azure.com/...` |
| AP Complete | `https://prod-XX.westeurope.logic.azure.com/...` |

### Key Contacts
| Role | Contact |
|------|---------|
| SharePoint Admin | |
| Power Automate Support | |
| Alemba Admin | |
| VerseOne Support | |

---

## Appendix A: Alternative - Azure Functions Backend

If Power Automate becomes limiting, you can create Azure Functions instead:

```javascript
// Example Azure Function for Submit PBP
module.exports = async function (context, req) {
    const { requesterName, requesterEmail, questionnaireData } = req.body;

    // Connect to SharePoint via Microsoft Graph API
    // Create list item
    // Send email via Graph API

    context.res = {
        body: { success: true, submissionId: 'SUP-2025-00001' }
    };
};
```

This provides more flexibility but requires Azure subscription and more technical setup.

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Author: Development Team*
