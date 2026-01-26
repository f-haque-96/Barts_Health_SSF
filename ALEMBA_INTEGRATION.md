# Alemba Integration Guide - Automatic Ticket Management

## Overview

This guide details how to integrate Alemba with the NHS Supplier Setup Form for:
- **Automatic ticket CREATION** when form is submitted (with all data auto-filled)
- **Automatic ticket UPDATES** as workflow progresses through stages
- **Automatic ticket CLOSURE** when supplier setup is complete

---

## Table of Contents

1. [Ticket Lifecycle](#1-ticket-lifecycle)
2. [Getting Alemba API Access](#2-getting-alemba-api-access)
3. [Automatic Ticket Creation](#3-automatic-ticket-creation)
4. [Automatic Ticket Updates](#4-automatic-ticket-updates)
5. [Automatic Ticket Closure](#5-automatic-ticket-closure)
6. [Power Automate Implementation](#6-power-automate-implementation)
7. [Complete Flow Examples](#7-complete-flow-examples)
8. [Error Handling](#8-error-handling)
9. [Testing](#9-testing)

---

## 1. Ticket Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ALEMBA TICKET LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FORM SUBMITTED (after PBP approval)                                           │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🎫 TICKET CREATED AUTOMATICALLY                                         │   │
│  │                                                                          │   │
│  │  Title: New Supplier Setup - SUP-2025-00001 - ACME LTD                  │   │
│  │  Status: Open                                                            │   │
│  │  Assigned To: Procurement Team                                           │   │
│  │  Priority: Based on contract value                                       │   │
│  │                                                                          │   │
│  │  ALL FORM DATA AUTO-FILLED:                                             │   │
│  │  • Requester details                                                     │   │
│  │  • Supplier details                                                      │   │
│  │  • Financial information                                                 │   │
│  │  • Service description                                                   │   │
│  │  • Link to review page                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📝 PROCUREMENT REVIEWS                                                  │   │
│  │  Comment added: "Under procurement review"                               │   │
│  │  Status: In Progress                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                       │
│         ├──────────────────┬──────────────────┐                                │
│         ▼                  ▼                  ▼                                │
│    ┌─────────┐      ┌───────────┐      ┌─────────┐                            │
│    │STANDARD │      │   OPW     │      │ REJECT  │                            │
│    └────┬────┘      └─────┬─────┘      └────┬────┘                            │
│         │                 │                  │                                 │
│         │           ┌─────▼─────┐            │                                 │
│         │           │ OPW Panel │            │                                 │
│         │           │  Review   │            │                                 │
│         │           └─────┬─────┘            │                                 │
│         │                 │                  │                                 │
│         │           ┌─────▼─────┐            │                                 │
│         │           │ Contract  │            │                                 │
│         │           │  Drafter  │            │                                 │
│         │           └─────┬─────┘            │                                 │
│         │                 │                  │                                 │
│         ▼                 ▼                  ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ✅ AP CONTROL COMPLETES SETUP                                          │   │
│  │                                                                          │   │
│  │  🎫 TICKET CLOSED AUTOMATICALLY                                         │   │
│  │                                                                          │   │
│  │  Resolution: "Supplier setup complete. Vendor ID: V12345"               │   │
│  │  Status: Resolved/Closed                                                 │   │
│  │  Final comment: All signatures captured, PDF generated                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Getting Alemba API Access

### Contact Your Alemba Administrator

Request the following from your IT/Alemba admin:

| Item Needed | Example | Purpose |
|-------------|---------|---------|
| API Base URL | `https://bartshealth.alemba.cloud/api/v1` | Endpoint for all API calls |
| API Key | `ak_live_xxxxxxxxxxxx` | Authentication |
| Service Catalog ID | `SC-SUPPLIER-SETUP` | Category for supplier tickets |
| Team IDs | `TEAM-PROC-001`, `TEAM-AP-001` | For routing tickets |
| Custom Field IDs | See below | For storing form data |

### Required Custom Fields in Alemba

Ask your Alemba admin to create these custom fields for the Supplier Setup service:

| Field Name | Field Type | Purpose |
|------------|------------|---------|
| `cf_submission_id` | Text | Link to SharePoint |
| `cf_supplier_name` | Text | Company name |
| `cf_supplier_type` | Dropdown | Limited Company/Charity/Sole Trader/Public Sector |
| `cf_crn` | Text | Company Registration Number |
| `cf_contract_value` | Number | Estimated value |
| `cf_requester_email` | Email | For notifications |
| `cf_requester_department` | Text | Department |
| `cf_review_page_url` | URL | Link to review page |
| `cf_workflow_stage` | Dropdown | PBP/Procurement/OPW/Contract/AP |

---

## 2.1 Document Attachments Policy

### Documents ATTACHED to Alemba Tickets

| Document | When Attached | Stage |
|----------|---------------|-------|
| **PBP Approval Certificate** | Ticket creation | Form Submission |
| **Bank Details on Letterhead** | Ticket creation | Form Submission |
| **CEST Form (IR35 Determination)** | If OPW route | OPW Decision |
| **Signed Contract/Agreement** | If contract required | Contract Upload |
| **Final Completed PDF** | Ticket closure | AP Completion |

### Documents NOT ATTACHED (Data Protection)

| Document | Reason |
|----------|--------|
| **Passport copy** | Sensitive personal ID - stored in SharePoint only |
| **Driving Licence copy** | Sensitive personal ID - stored in SharePoint only |
| **Other ID documents** | Data protection compliance |

> **Note:** ID documents for sole traders are stored securely in SharePoint Document Library but are NOT attached to Alemba tickets to comply with data protection requirements. AP Control can access these documents directly via the SharePoint link in the ticket.

---

## 3. Automatic Ticket Creation

### When to Create Ticket

**Trigger:** When full form is submitted (after PBP approval in Section 7)

### Ticket Creation Payload (Full Form Data)

```json
{
  "title": "New Supplier Setup - {SubmissionID} - {CompanyName}",
  "description": "A new supplier setup request has been submitted and requires Procurement review.\n\n---\n\n**REQUESTER INFORMATION**\nName: {RequesterName}\nEmail: {RequesterEmail}\nDepartment: {RequesterDepartment}\nPhone: {RequesterPhone}\n\n---\n\n**SUPPLIER DETAILS**\nCompany Name: {CompanyName}\nTrading Name: {TradingName}\nSupplier Type: {SupplierType}\nCompany Registration Number: {CRN}\nCRN Verified: {CRNVerified}\nCharity Number: {CharityNumber}\n\n**Registered Address:**\n{RegisteredAddress}\n{City}, {Postcode}\n\n**Contact:**\nName: {ContactName}\nEmail: {ContactEmail}\nPhone: {ContactPhone}\nWebsite: {Website}\n\n---\n\n**SERVICE INFORMATION**\nDescription: {ServiceDescription}\nCategory: {ServiceCategory}\nService Types: {ServiceTypes}\n\n---\n\n**FINANCIAL INFORMATION**\nOverseas Supplier: {OverseasSupplier}\nBank Name: {BankName}\nSort Code: {SortCode}\nAccount Number: {AccountNumber}\nIBAN: {IBAN}\nSWIFT Code: {SwiftCode}\nContract Value: £{ContractValue}\nPayment Terms: {PaymentTerms}\n\n---\n\n**PRE-BUY PANEL**\nPBP Approval Date: {PBPApprovalDate}\nApproved By: {PBPApprovedBy}\n\n---\n\n**CONFLICT OF INTEREST**\nDeclared Connection: {SupplierConnection}\nDetails: {ConnectionDetails}\n\n---\n\n**REVIEW THIS SUBMISSION:**\n{ReviewPageURL}\n\n---\n\nSubmission ID: {SubmissionID}\nSubmitted: {SubmittedDate}",

  "serviceCatalogItem": "Supplier Setup Request",
  "category": "Procurement",
  "subcategory": "New Supplier",

  "priority": "{CalculatedPriority}",
  "impact": "Medium",
  "urgency": "{CalculatedUrgency}",

  "assignedTeam": "Procurement Team",

  "requester": {
    "email": "{RequesterEmail}",
    "name": "{RequesterName}"
  },

  "customFields": {
    "cf_submission_id": "{SubmissionID}",
    "cf_supplier_name": "{CompanyName}",
    "cf_supplier_type": "{SupplierType}",
    "cf_crn": "{CRN}",
    "cf_contract_value": {ContractValue},
    "cf_requester_email": "{RequesterEmail}",
    "cf_requester_department": "{RequesterDepartment}",
    "cf_review_page_url": "{ReviewPageURL}",
    "cf_workflow_stage": "Procurement"
  },

  "attachments": [
    {
      "name": "PBP_Approval_Certificate.pdf",
      "url": "{PBPCertificateURL}"
    },
    {
      "name": "Bank_Details_Letterhead.pdf",
      "url": "{LetterheadDocumentURL}"
    },
    {
      "name": "CEST_Determination_{SubmissionID}.pdf",
      "url": "{CESTFormURL}",
      "condition": "Only if OPW/Sole Trader"
    }
  ],

  "note": "ID documents (passport/driving licence) are NOT attached for data protection"
}
```

### Priority Calculation Logic

```javascript
// In Power Automate, use a Condition or Switch to set priority

if (ContractValue >= 100000) {
  Priority = "Critical";
  Urgency = "High";
} else if (ContractValue >= 50000) {
  Priority = "High";
  Urgency = "High";
} else if (ContractValue >= 10000) {
  Priority = "Medium";
  Urgency = "Medium";
} else {
  Priority = "Low";
  Urgency = "Low";
}
```

---

## 4. Automatic Ticket Updates

### Update at Each Stage

#### 4.1 Procurement Decision - Standard Supplier

```json
{
  "status": "In Progress",
  "assignedTeam": "AP Control Team",
  "customFields": {
    "cf_workflow_stage": "AP Control"
  },
  "comment": {
    "text": "✅ PROCUREMENT DECISION: Standard Supplier\n\nApproved by: {ProcurementApprover}\nDate: {DecisionDate}\n\nRouting to AP Control for supplier setup.\n\nAP Control Review Page: {APReviewPageURL}",
    "isInternal": false
  }
}
```

#### 4.2 Procurement Decision - Potential OPW

```json
{
  "status": "In Progress",
  "assignedTeam": "OPW Panel",
  "customFields": {
    "cf_workflow_stage": "OPW Review"
  },
  "comment": {
    "text": "⚠️ PROCUREMENT DECISION: Potential Off-Payroll Worker (IR35)\n\nApproved by: {ProcurementApprover}\nDate: {DecisionDate}\nReason: Supplier identified as potential OPW - requires IR35 determination\n\nRouting to OPW Panel for review.\n\nOPW Review Page: {OPWReviewPageURL}",
    "isInternal": false
  }
}
```

#### 4.3 Procurement Decision - Rejected

```json
{
  "status": "Rejected",
  "resolution": "Supplier request rejected by Procurement",
  "customFields": {
    "cf_workflow_stage": "Rejected"
  },
  "comment": {
    "text": "❌ PROCUREMENT DECISION: Rejected\n\nRejected by: {ProcurementApprover}\nDate: {DecisionDate}\nReason: {RejectionReason}\n\nRequester has been notified via email.",
    "isInternal": false
  }
}
```

#### 4.4 OPW Panel Decision

```json
{
  "status": "In Progress",
  "assignedTeam": "Contract Drafting Team",
  "customFields": {
    "cf_workflow_stage": "Contract Draft"
  },
  "comment": {
    "text": "📋 OPW PANEL DECISION: {IR35Decision}\n\nDetermined by: {OPWApprover}\nDate: {DecisionDate}\nIR35 Status: {InsideIR35 ? 'INSIDE IR35' : 'OUTSIDE IR35'}\n\nRouting to Contract Drafter.\n\nContract Draft Page: {ContractDraftPageURL}",
    "isInternal": false
  }
}
```

#### 4.5 Contract Uploaded

```json
{
  "status": "In Progress",
  "assignedTeam": "AP Control Team",
  "customFields": {
    "cf_workflow_stage": "AP Control"
  },
  "comment": {
    "text": "📄 CONTRACT UPLOADED\n\nUploaded by: {ContractDrafter}\nDate: {UploadDate}\nContract Type: {ContractType}\n\nSigned contract has been uploaded. Routing to AP Control for final setup.\n\nAP Control Review Page: {APReviewPageURL}",
    "isInternal": false
  },
  "attachments": [
    {
      "name": "Signed_Contract_{SubmissionID}.pdf",
      "url": "{ContractDocumentURL}"
    }
  ]
}
```

---

## 5. Automatic Ticket Closure

### When AP Control Completes Setup

**Trigger:** When AP Control clicks "Complete Setup" and signs off

```json
{
  "status": "Resolved",
  "resolution": "Supplier successfully created in Oracle/Finance system",
  "resolutionCode": "Completed",
  "closedDate": "{CompletionDate}",

  "customFields": {
    "cf_workflow_stage": "Complete",
    "cf_vendor_number": "{VendorNumber}"
  },

  "comment": {
    "text": "✅ SUPPLIER SETUP COMPLETE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**SUPPLIER CREATED**\nVendor Number: {VendorNumber}\nSupplier Name: {CompanyName}\nSetup Date: {CompletionDate}\n\n**VERIFIED BY AP CONTROL**\nAP Controller: {APApproverName}\nBank Details Verified: ✅\nSignature Captured: ✅\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**AUTHORISATION TRAIL**\n\n1. PBP Approval: {PBPApprovalDate} by {PBPApprover}\n2. Procurement: {ProcurementDate} by {ProcurementApprover} ({ProcurementDecision})\n{OPWSection}\n{ContractSection}\n3. AP Control: {APApprovalDate} by {APApprover}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nRequester ({RequesterName}) has been notified via email with the completed form PDF attached.\n\nThis ticket is now CLOSED.",
    "isInternal": false
  },

  "attachments": [
    {
      "name": "Supplier_Setup_Complete_{SubmissionID}.pdf",
      "url": "{FinalPDFURL}"
    },
    {
      "name": "Bank_Details_Letterhead.pdf",
      "url": "{LetterheadDocumentURL}"
    },
    {
      "name": "CEST_Determination_{SubmissionID}.pdf",
      "url": "{CESTFormURL}",
      "condition": "Only attached if OPW route was taken"
    },
    {
      "name": "Signed_Contract_{SubmissionID}.pdf",
      "url": "{ContractDocumentURL}",
      "condition": "Only attached if contract was required"
    }
  ],

  "excludedDocuments": [
    "ID documents (passport/driving licence) - excluded for data protection"
  ]
}
```

---

## 6. Power Automate Implementation

### 6.1 Flow: Create Alemba Ticket on Form Submission

```
Flow Name: NHS-Supplier-CreateAlembaTicket
Trigger: Called from NHS-Supplier-SubmitFullForm flow
```

**Step-by-Step:**

1. **Receive submission data** (from parent flow)

2. **Initialize variables:**
   ```
   varAlembaApiKey = "your-api-key"
   varAlembaBaseUrl = "https://bartshealth.alemba.cloud/api/v1"
   varPriority = "" (will be set by condition)
   ```

3. **Calculate Priority** (Condition):
   ```
   If ContractValue >= 100000
     Set varPriority = "Critical"
   Else If ContractValue >= 50000
     Set varPriority = "High"
   Else If ContractValue >= 10000
     Set varPriority = "Medium"
   Else
     Set varPriority = "Low"
   ```

4. **Compose ticket body:**
   ```json
   {
     "title": "New Supplier Setup - @{variables('SubmissionID')} - @{triggerBody()?['companyName']}",
     "description": "@{variables('FullDescription')}",
     "priority": "@{variables('varPriority')}",
     "assignedTeam": "Procurement Team",
     "customFields": {
       "cf_submission_id": "@{variables('SubmissionID')}",
       ...
     }
   }
   ```

5. **HTTP Action - Create Ticket:**
   ```
   Method: POST
   URI: @{variables('varAlembaBaseUrl')}/requests
   Headers:
     Content-Type: application/json
     Authorization: Bearer @{variables('varAlembaApiKey')}
   Body: @{outputs('Compose_Ticket_Body')}
   ```

6. **Parse JSON response** to extract ticketId

7. **Update SharePoint** with AlembaTicketID:
   ```
   Update item: SupplierSubmissions
   AlembaTicketID: @{body('Parse_JSON')?['ticketId']}
   ```

8. **Return ticketId** to parent flow

---

### 6.2 Flow: Update Alemba Ticket

```
Flow Name: NHS-Supplier-UpdateAlembaTicket
```

**Input parameters:**
- ticketId (string)
- updateType (string): "procurement_standard", "procurement_opw", "procurement_reject", "opw_decision", "contract_uploaded"
- decisionData (object)

**Steps:**

1. **Switch on updateType:**

   **Case: procurement_standard**
   ```
   HTTP PATCH to /requests/{ticketId}
   Body: { status, assignedTeam, customFields, comment }
   ```

   **Case: procurement_opw**
   ```
   HTTP PATCH to /requests/{ticketId}
   Body: { status, assignedTeam: "OPW Panel", customFields, comment }
   ```

   **Case: procurement_reject**
   ```
   HTTP PATCH to /requests/{ticketId}
   Body: { status: "Rejected", resolution, comment }
   ```

   **Case: opw_decision**
   ```
   HTTP PATCH to /requests/{ticketId}
   Body: { assignedTeam: "Contract Drafting", customFields, comment }
   ```

   **Case: contract_uploaded**
   ```
   HTTP PATCH to /requests/{ticketId}
   Body: { assignedTeam: "AP Control", customFields, comment, attachments }
   ```

---

### 6.3 Flow: Close Alemba Ticket

```
Flow Name: NHS-Supplier-CloseAlembaTicket
```

**Input parameters:**
- ticketId (string)
- submissionId (string)
- completionData (object)

**Steps:**

1. **Get full submission data** from SharePoint

2. **Generate final PDF** (or get URL if already generated)

3. **Compose closure body:**
   ```json
   {
     "status": "Resolved",
     "resolution": "Supplier @{companyName} successfully created. Vendor ID: @{vendorNumber}",
     "closedDate": "@{utcNow()}",
     "comment": { ... full authorisation trail ... },
     "attachments": [{ "name": "...", "url": "..." }]
   }
   ```

4. **HTTP PATCH** to close ticket

5. **Update SharePoint** to mark Alemba ticket as closed

---

## 7. Complete Flow Examples

### 7.1 Full Submission Flow with Alemba

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow: NHS-Supplier-SubmitFullForm (Updated with Alemba)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. HTTP Trigger receives form data                             │
│                │                                                │
│                ▼                                                │
│  2. Validate PBP approval status                                │
│                │                                                │
│                ▼                                                │
│  3. Update SharePoint (Status = Submitted)                      │
│                │                                                │
│                ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  4. HTTP: CREATE ALEMBA TICKET                           │   │
│  │                                                          │   │
│  │  POST https://bartshealth.alemba.cloud/api/v1/requests  │   │
│  │                                                          │   │
│  │  Body: Full form data (see Section 3)                    │   │
│  │                                                          │   │
│  │  Response: { "ticketId": "REQ-12345" }                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                │                                                │
│                ▼                                                │
│  5. Parse response, extract ticketId                            │
│                │                                                │
│                ▼                                                │
│  6. Update SharePoint with AlembaTicketID                       │
│                │                                                │
│                ▼                                                │
│  7. Create AuditLog entry                                       │
│                │                                                │
│                ▼                                                │
│  8. Send email to Procurement (includes ticket number)          │
│                │                                                │
│                ▼                                                │
│  9. Return response to frontend                                 │
│     { success: true, submissionId, alembaTicketId }             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 AP Completion Flow with Ticket Closure

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow: NHS-Supplier-APComplete (Updated with Alemba Closure)    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. HTTP Trigger receives completion data                       │
│                │                                                │
│                ▼                                                │
│  2. Get submission from SharePoint (includes AlembaTicketID)    │
│                │                                                │
│                ▼                                                │
│  3. Update SharePoint (Status = Completed)                      │
│                │                                                │
│                ▼                                                │
│  4. Generate final PDF with all signatures                      │
│                │                                                │
│                ▼                                                │
│  5. Upload PDF to SharePoint Document Library                   │
│                │                                                │
│                ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  6. HTTP: CLOSE ALEMBA TICKET                            │   │
│  │                                                          │   │
│  │  PATCH https://bartshealth.alemba.cloud/api/v1/         │   │
│  │        requests/{AlembaTicketID}                         │   │
│  │                                                          │   │
│  │  Body:                                                   │   │
│  │  {                                                       │   │
│  │    "status": "Resolved",                                 │   │
│  │    "resolution": "Supplier created. Vendor: V12345",    │   │
│  │    "closedDate": "2025-01-26T15:30:00Z",                │   │
│  │    "comment": {                                          │   │
│  │      "text": "✅ SUPPLIER SETUP COMPLETE\n\n..."        │   │
│  │    },                                                    │   │
│  │    "attachments": [{                                     │   │
│  │      "name": "Supplier_Setup_Complete.pdf",             │   │
│  │      "url": "{SharePointPDFUrl}"                        │   │
│  │    }]                                                    │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                │                                                │
│                ▼                                                │
│  7. Create AuditLog entry (ticket closed)                       │
│                │                                                │
│                ▼                                                │
│  8. Send email to requester with PDF attached                   │
│     Subject: "Supplier Setup Complete - {CompanyName}"          │
│                │                                                │
│                ▼                                                │
│  9. Return success response                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling

### Alemba API Errors

```
┌──────────────────────────────────────────────────────────────┐
│  In Power Automate, wrap HTTP actions in "Scope" with        │
│  Configure Run After → "has failed"                          │
└──────────────────────────────────────────────────────────────┘
```

**Handle common errors:**

| Error Code | Meaning | Action |
|------------|---------|--------|
| 401 | Unauthorized | Check API key, alert admin |
| 404 | Ticket not found | Log error, continue without Alemba |
| 429 | Rate limited | Wait and retry (use delay action) |
| 500 | Server error | Log error, send email to support |

**Fallback behavior:**
- If Alemba fails, the form should still work
- Log the error to SharePoint AuditLog
- Send email notification instead
- Flag submission for manual ticket creation

### Power Automate Error Handling Pattern

```
Scope: Try Create Alemba Ticket
  │
  ├── HTTP: Create Ticket
  │
  └── Parse JSON Response

Scope: Catch Alemba Error (Configure run after: has failed)
  │
  ├── Compose error details
  │
  ├── Create AuditLog entry: "Alemba ticket creation failed"
  │
  ├── Send email to IT support
  │
  └── Update SharePoint: AlembaTicketID = "FAILED - MANUAL REQUIRED"
```

---

## 9. Testing

### Test Checklist

#### Ticket Creation
- [ ] Submit a test form
- [ ] Verify ticket created in Alemba
- [ ] Verify all form data appears in ticket
- [ ] Verify ticket assigned to Procurement
- [ ] Verify priority calculated correctly
- [ ] Verify link to review page works

#### Ticket Updates
- [ ] Procurement Standard → Verify ticket reassigned to AP
- [ ] Procurement OPW → Verify ticket reassigned to OPW Panel
- [ ] Procurement Reject → Verify ticket status = Rejected
- [ ] OPW Decision → Verify ticket reassigned to Contract Drafter
- [ ] Contract Upload → Verify attachment added, routed to AP

#### Ticket Closure
- [ ] AP Complete → Verify ticket status = Resolved
- [ ] Verify resolution message includes vendor number
- [ ] Verify PDF attached to ticket
- [ ] Verify closure date recorded
- [ ] Verify full authorisation trail in final comment

### Test Scenarios

| Scenario | Path | Expected Alemba State |
|----------|------|----------------------|
| Happy path - Standard | PBP → Procurement (Standard) → AP | Created → Updated → Closed |
| OPW path | PBP → Procurement (OPW) → OPW → Contract → AP | Created → Updated 4x → Closed |
| Rejection | PBP → Procurement (Reject) | Created → Rejected |
| Alemba down | Submit when Alemba unavailable | Form works, ticket created manually later |

---

## Quick Reference - API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Create ticket | POST | `/api/v1/requests` |
| Update ticket | PATCH | `/api/v1/requests/{ticketId}` |
| Add comment | POST | `/api/v1/requests/{ticketId}/comments` |
| Add attachment | POST | `/api/v1/requests/{ticketId}/attachments` |
| Close ticket | PATCH | `/api/v1/requests/{ticketId}` with status: "Resolved" |
| Get ticket | GET | `/api/v1/requests/{ticketId}` |

---

## Support

If you have issues with Alemba integration:

1. Check the AuditLog in SharePoint for error details
2. Verify API credentials are correct
3. Test API in Postman first
4. Contact Alemba administrator for API access issues

---

*Document Version: 1.0*
*Last Updated: January 2025*
