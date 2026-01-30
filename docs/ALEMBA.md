# Alemba Integration Guide - Automatic Ticket Management

## Overview

This guide details how to integrate Alemba with the NHS Supplier Setup Form for:
- **Automatic ticket CREATION** when full form is submitted to Procurement
- **Automatic ticket UPDATES** as workflow progresses through stages
- **Automatic ticket CLOSURE** when supplier setup is complete

---

**Workflow Logic**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CORRECT WORKFLOW - READ CAREFULLY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 1: QUESTIONNAIRE (Before Form Submission)                            │
│  ════════════════════════════════════════════════                           │
│                                                                              │
│  Q2.7: Has procurement been engaged?                                        │
│           │                                                                  │
│           ├── YES → Upload procurement approval document                    │
│           │         → Continue filling form → Go to STAGE 2                 │
│           │                                                                  │
│           └── NO  → Questionnaire Modal opens (Clinical/Non-Clinical)       │
│                     → Questionnaire submitted to PBP                        │
│                     → PBP reviews QUESTIONNAIRE ONLY                        │
│                     → PBP approves → Certificate issued                     │
│                     → Requester uploads certificate to Q2.7                 │
│                     → Continue filling form → Go to STAGE 2                 │
│                                                                              │
│  STAGE 2: FULL FORM SUBMISSION (Sections 1-7 Complete)                      │
│  ═════════════════════════════════════════════════════                      │
│                                                                              │
│  Form submitted → ALEMBA TICKET CREATED → Sent to PROCUREMENT               │
│                   (NOT PBP - PBP already reviewed questionnaire)            │
│                                                                              │
│  STAGE 3: PROCUREMENT REVIEW                                                │
│  ═══════════════════════════                                                │
│                                                                              │
│  Procurement reviews full form and classifies:                              │
│           │                                                                  │
│           ├── STANDARD → Goes directly to AP Control                        │
│           │                                                                  │
│           ├── POTENTIAL OPW → Goes to OPW Panel                             │
│           │                   → OPW determines Inside/Outside IR35          │
│           │                   → Goes to Contract Drafter                    │
│           │                   → Goes to AP Control                          │
│           │                                                                  │
│           └── REJECTED → Ticket closed, Requester notified                  │
│                                                                              │
│  STAGE 4: AP CONTROL                                                        │
│  ═══════════════════                                                        │
│                                                                              │
│  AP Control verifies supplier details:                                      │
│           │                                                                  │
│           ├── VERIFIED → Supplier created, Ticket closed                    │
│           │              Requester notified (Vendor Number issued)          │
│           │                                                                  │
│           └── REJECTED → Ticket closed, Requester notified (with reason)    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

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
│  ⚠️  NOTE: PBP reviews questionnaire BEFORE form submission.                   │
│      Alemba ticket is created AFTER full form submission.                       │
│      First reviewer in Alemba is PROCUREMENT (not PBP).                        │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FULL FORM SUBMITTED (Section 7)                                               │
│  (PBP questionnaire already approved if Q2.7 was "No")                         │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🎫 TICKET CREATED AUTOMATICALLY                                         │   │
│  │                                                                          │   │
│  │  Title: New Supplier Setup - SUP-2025-00001 - ACME LTD                  │   │
│  │  Status: Open                                                            │   │
│  │  Assigned To: PROCUREMENT TEAM (first reviewer)                          │   │
│  │  Priority: Based on contract value                                       │   │
│  │                                                                          │   │
│  │  ALL FORM DATA AUTO-FILLED:                                             │   │
│  │  • Requester details (Section 1)                                        │   │
│  │  • Pre-screening summary (Section 2) - including PBP approval           │   │
│  │  • Supplier classification (Section 3)                                   │   │
│  │  • Supplier details (Section 4)                                         │   │
│  │  • Service description (Section 5)                                       │   │
│  │  • Financial information (Section 6)                                     │   │
│  │  • Link to review page                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📝 PROCUREMENT REVIEWS (First Stage in Alemba)                         │   │
│  │  Comment added: "Under procurement review"                               │   │
│  │  Status: In Progress                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                       │
│         ├──────────────────┬──────────────────┐                                │
│         ▼                  ▼                  ▼                                │
│    ┌─────────┐      ┌───────────┐      ┌─────────┐                            │
│    │STANDARD │      │POTENTIAL  │      │ REJECT  │                            │
│    │         │      │   OPW     │      │         │                            │
│    └────┬────┘      └─────┬─────┘      └────┬────┘                            │
│         │                 │                  │                                 │
│         │           ┌─────▼─────┐            │                                 │
│         │           │ OPW Panel │            │                                 │
│         │           │  Review   │            │                                 │
│         │           │(IR35 det.)│            │                                 │
│         │           └─────┬─────┘            │                                 │
│         │                 │                  │                                 │
│         │           ┌─────▼─────┐            │                                 │
│         │           │ Contract  │            │                                 │
│         │           │  Drafter  │            │                                 │
│         │           └─────┬─────┘            │                                 │
│         │                 │                  │                                 │
│         ▼                 ▼                  ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ✅ AP CONTROL VERIFICATION                                             │   │
│  │                                                                          │   │
│  │  Verifies: Bank details, Company details, VAT (optional), Insurance     │   │
│  │                                                                          │   │
│  │  ├── VERIFIED → Supplier created, Vendor Number assigned                │   │
│  │  │              🎫 TICKET CLOSED - "Supplier setup complete"            │   │
│  │  │              Requester notified with Vendor Number                    │   │
│  │  │                                                                       │   │
│  │  └── REJECTED → 🎫 TICKET CLOSED - "Rejected by AP Control"            │   │
│  │                 Requester notified with rejection reason                 │   │
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
| `cf_workflow_stage` | Dropdown | Procurement/OPW/Contract/AP (NOT PBP - PBP is pre-submission) |
| `cf_pbp_approved` | Yes/No | Whether PBP approved questionnaire |
| `cf_pbp_approval_date` | Date | When PBP approved |

---

## 2.1 Document Attachments Policy

### Documents ATTACHED to Alemba Tickets

| Document | When Attached | Stage |
|----------|---------------|-------|
| **PBP Approval Certificate** | Ticket creation | Form Submission (proof of pre-approval) |
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

> **Note:** ID documents for sole traders are stored securely in SharePoint SensitiveDocuments library but are NOT attached to Alemba tickets to comply with data protection requirements. AP Control can access these documents directly via the SharePoint link in the ticket.

---

## 3. Automatic Ticket Creation

### When to Create Ticket

**Trigger:** When FULL FORM is submitted in Section 7

**Important:** The Alemba ticket is NOT created when the questionnaire is submitted to PBP. PBP questionnaire review happens BEFORE the full form submission and is an internal pre-screening step.

### Ticket Creation Payload (Full Form Data)

```json
{
  "title": "New Supplier Setup - {SubmissionID} - {CompanyName}",
  "description": "A new supplier setup request has been submitted and requires Procurement review.\n\n---\n\n**PRE-BUY PANEL STATUS**\nPBP Questionnaire Approved: {PBPApproved}\nApproval Date: {PBPApprovalDate}\nApproved By: {PBPApprovedBy}\n\n---\n\n**REQUESTER INFORMATION**\nName: {RequesterName}\nEmail: {RequesterEmail}\nDepartment: {RequesterDepartment}\nPhone: {RequesterPhone}\n\n---\n\n**SUPPLIER DETAILS**\nCompany Name: {CompanyName}\nTrading Name: {TradingName}\nSupplier Type: {SupplierType}\nCompany Registration Number: {CRN}\nCRN Verified: {CRNVerified}\nCharity Number: {CharityNumber}\n\n**Registered Address:**\n{RegisteredAddress}\n{City}, {Postcode}\n\n**Contact:**\nName: {ContactName}\nEmail: {ContactEmail}\nPhone: {ContactPhone}\nWebsite: {Website}\n\n---\n\n**SERVICE INFORMATION**\nDescription: {ServiceDescription}\nCategory: {ServiceCategory}\nService Types: {ServiceTypes}\n\n---\n\n**FINANCIAL INFORMATION**\nOverseas Supplier: {OverseasSupplier}\nBank Name: {BankName}\nSort Code: {SortCode}\nAccount Number: {AccountNumber}\nIBAN: {IBAN}\nSWIFT Code: {SwiftCode}\nContract Value: £{ContractValue}\nPayment Terms: {PaymentTerms}\n\n---\n\n**CONFLICT OF INTEREST**\nDeclared Connection: {SupplierConnection}\nDetails: {ConnectionDetails}\n\n---\n\n**REVIEW THIS SUBMISSION:**\n{ReviewPageURL}\n\n---\n\nSubmission ID: {SubmissionID}\nSubmitted: {SubmittedDate}",

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
    "cf_contract_value": "{ContractValue}",
    "cf_requester_email": "{RequesterEmail}",
    "cf_requester_department": "{RequesterDepartment}",
    "cf_review_page_url": "{ReviewPageURL}",
    "cf_workflow_stage": "Procurement",
    "cf_pbp_approved": "Yes",
    "cf_pbp_approval_date": "{PBPApprovalDate}"
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
      "condition": "Only if sole trader"
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
    "text": "✅ PROCUREMENT DECISION: Standard Supplier\n\nApproved by: {ProcurementApprover}\nDate: {DecisionDate}\nAlemba Reference: {AlembaRef}\n\nRouting directly to AP Control for supplier setup.\n\nAP Control Review Page: {APReviewPageURL}",
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
    "text": "⚠️ PROCUREMENT DECISION: Potential Off-Payroll Worker (IR35)\n\nApproved by: {ProcurementApprover}\nDate: {DecisionDate}\nAlemba Reference: {AlembaRef}\nReason: Supplier identified as potential OPW - requires IR35 determination\n\nRouting to OPW Panel for IR35 assessment.\n\nOPW Review Page: {OPWReviewPageURL}",
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

#### 4.4 OPW Panel Decision - Inside/Outside IR35

```json
{
  "status": "In Progress",
  "assignedTeam": "Contract Drafting Team",
  "customFields": {
    "cf_workflow_stage": "Contract Draft"
  },
  "comment": {
    "text": "📋 OPW PANEL DECISION: {IR35Decision}\n\nDetermined by: {OPWApprover}\nDate: {DecisionDate}\nIR35 Status: {InsideOrOutsideIR35}\n\nRouting to Contract Drafter for agreement preparation.\n\nContract Draft Page: {ContractDraftPageURL}",
    "isInternal": false
  }
}
```

#### 4.5 OPW Panel Decision - Rejected

```json
{
  "status": "Rejected",
  "resolution": "Supplier request rejected by OPW Panel",
  "customFields": {
    "cf_workflow_stage": "Rejected"
  },
  "comment": {
    "text": "❌ OPW PANEL DECISION: Rejected\n\nRejected by: {OPWApprover}\nDate: {DecisionDate}\nReason: {RejectionReason}\n\nRequester has been notified via email.",
    "isInternal": false
  }
}
```

#### 4.6 Contract Uploaded

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

### When AP Control Completes Setup (Verified)

**Trigger:** When AP Control clicks "Complete Setup" and signs off

```json
{
  "status": "Resolved",
  "resolution": "Supplier successfully created in finance system",
  "resolutionCode": "Completed",
  "closedDate": "{CompletionDate}",

  "customFields": {
    "cf_workflow_stage": "Complete",
    "cf_vendor_number": "{VendorNumber}"
  },

  "comment": {
    "text": "✅ SUPPLIER SETUP COMPLETE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**SUPPLIER CREATED**\nVendor Number: {VendorNumber}\nSupplier Name: {CompanyName}\nSetup Date: {CompletionDate}\n\n**VERIFIED BY AP CONTROL**\nAP Controller: {APApproverName}\nBank Details Verified: ✅\nCompany Details Verified: ✅\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**AUTHORISATION TRAIL**\n\n1. PBP Approval: {PBPApprovalDate} by {PBPApprover} (pre-submission)\n2. Procurement: {ProcurementDate} by {ProcurementApprover} ({ProcurementDecision})\n{OPWSection}\n{ContractSection}\n3. AP Control: {APApprovalDate} by {APApprover}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nRequester ({RequesterName}) has been notified via email.\n\nThis ticket is now CLOSED.",
    "isInternal": false
  },

  "attachments": [
    {
      "name": "Supplier_Setup_Complete_{SubmissionID}.pdf",
      "url": "{FinalPDFURL}"
    }
  ]
}
```

### When AP Control Rejects

```json
{
  "status": "Rejected",
  "resolution": "Supplier request rejected by AP Control",
  "resolutionCode": "Rejected",
  "closedDate": "{RejectionDate}",

  "customFields": {
    "cf_workflow_stage": "Rejected"
  },

  "comment": {
    "text": "❌ AP CONTROL DECISION: Rejected\n\nRejected by: {APApprover}\nDate: {RejectionDate}\nReason: {RejectionReason}\n\nRequester has been notified via email with rejection reason.\n\nThis ticket is now CLOSED.",
    "isInternal": false
  }
}
```

---

## 6. Power Automate Implementation

### 6.1 Flow: Create Alemba Ticket on Form Submission

```
Flow Name: NHS-Supplier-CreateAlembaTicket
Trigger: When item created in Submissions list (SharePoint)
         OR called from form submission API
```

**Step-by-Step:**

1. **Receive submission data** (from SharePoint trigger or API)

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

4. **Compose ticket body** (see Section 3 for full payload)

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

7. **Update SharePoint/SQL** with AlembaTicketID

8. **Return ticketId**

---

### 6.2 Flow: Update Alemba Ticket

```
Flow Name: NHS-Supplier-UpdateAlembaTicket
```

**Input parameters:**
- ticketId (string)
- updateType: "procurement_standard", "procurement_opw", "procurement_reject", "opw_inside", "opw_outside", "opw_reject", "contract_uploaded"
- decisionData (object)

---

### 6.3 Flow: Close Alemba Ticket

```
Flow Name: NHS-Supplier-CloseAlembaTicket
```

**Input parameters:**
- ticketId (string)
- submissionId (string)
- closeType: "verified" or "rejected"
- completionData (object)

---

## 7. Complete Flow Examples

### 7.1 Standard Path (No OPW)

```
Requester fills form
       │
       ▼
Q2.7 = "Yes" (Procurement engaged)
OR
Q2.7 = "No" → Questionnaire → PBP approves → Certificate uploaded
       │
       ▼
Section 7: Submit Full Form
       │
       ▼
🎫 ALEMBA TICKET CREATED
   Assigned to: Procurement Team
       │
       ▼
Procurement reviews → STANDARD
       │
       ▼
🎫 TICKET UPDATED
   Assigned to: AP Control Team
       │
       ▼
AP Control verifies → VERIFIED
       │
       ▼
🎫 TICKET CLOSED
   Resolution: "Supplier created. Vendor: V12345"
```

### 7.2 OPW Path

```
Requester fills form (Sole Trader)
       │
       ▼
Q2.7 = "No" → Questionnaire → PBP approves
       │
       ▼
Section 7: Submit Full Form
       │
       ▼
🎫 ALEMBA TICKET CREATED
   Assigned to: Procurement Team
       │
       ▼
Procurement reviews → POTENTIAL OPW
       │
       ▼
🎫 TICKET UPDATED
   Assigned to: OPW Panel
       │
       ▼
OPW Panel → Inside/Outside IR35
       │
       ▼
🎫 TICKET UPDATED
   Assigned to: Contract Drafting
       │
       ▼
Contract uploaded
       │
       ▼
🎫 TICKET UPDATED
   Assigned to: AP Control
       │
       ▼
AP Control verifies → VERIFIED
       │
       ▼
🎫 TICKET CLOSED
   Resolution: "Supplier created. Vendor: V12345"
```

---

## 8. Error Handling

### Alemba API Errors

| Error Code | Meaning | Action |
|------------|---------|--------|
| 401 | Unauthorized | Check API key, alert admin |
| 404 | Ticket not found | Log error, continue without Alemba |
| 429 | Rate limited | Wait and retry (use delay action) |
| 500 | Server error | Log error, send email to support |

**Fallback behavior:**
- If Alemba fails, the form workflow should still work
- Log the error to SharePoint AuditLog
- Flag submission for manual ticket creation

---

## 9. Testing

### Test Checklist

#### Ticket Creation
- [ ] Submit a test form (ensure Q2.7 answered correctly)
- [ ] Verify ticket created in Alemba
- [ ] Verify ticket assigned to PROCUREMENT (not PBP)
- [ ] Verify all form data appears in ticket
- [ ] Verify PBP approval details included
- [ ] Verify priority calculated correctly

#### Ticket Updates
- [ ] Procurement Standard → Verify ticket reassigned to AP Control
- [ ] Procurement OPW → Verify ticket reassigned to OPW Panel
- [ ] Procurement Reject → Verify ticket status = Rejected
- [ ] OPW Decision → Verify ticket reassigned to Contract Drafter
- [ ] OPW Reject → Verify ticket status = Rejected
- [ ] Contract Upload → Verify attachment added, routed to AP

#### Ticket Closure
- [ ] AP Verified → Verify ticket status = Resolved
- [ ] AP Rejected → Verify ticket status = Rejected
- [ ] Verify resolution message includes vendor number (if verified)
- [ ] Verify rejection reason included (if rejected)

### Test Scenarios

| Scenario | Path | Expected Alemba State |
|----------|------|----------------------|
| Happy path - Standard | Form → Procurement (Standard) → AP | Created → Updated → Closed |
| OPW path | Form → Procurement (OPW) → OPW → Contract → AP | Created → Updated 3x → Closed |
| Procurement Rejection | Form → Procurement (Reject) | Created → Rejected |
| OPW Rejection | Form → Procurement (OPW) → OPW (Reject) | Created → Updated → Rejected |
| AP Rejection | Form → Procurement → AP (Reject) | Created → Updated → Rejected |

---

## Quick Reference - Workflow Stages in Alemba

| cf_workflow_stage | Meaning | Assigned Team |
|-------------------|---------|---------------|
| `Procurement` | Initial review after form submission | Procurement Team |
| `OPW Review` | IR35 determination needed | OPW Panel |
| `Contract Draft` | Agreement preparation | Contract Drafting |
| `AP Control` | Final verification | AP Control Team |
| `Complete` | Supplier created | (Closed) |
| `Rejected` | Request rejected | (Closed) |

**Note:** There is NO "PBP" stage in Alemba because PBP reviews the questionnaire BEFORE form submission, not after.

---

## Support

If you have issues with Alemba integration:

1. Check the AuditLog in SharePoint for error details
2. Verify API credentials are correct
3. Test API in Postman first
4. Contact Alemba administrator for API access issues

---

*Document Version: 2.0*
*Last Updated: January 2026*
*Critical Update: Corrected workflow - PBP reviews questionnaire pre-submission, not the full form*
