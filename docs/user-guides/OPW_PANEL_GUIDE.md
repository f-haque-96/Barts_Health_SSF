# OPW Panel Guide: Off-Payroll Working Review in the Supplier Setup System

**Document Version:** 1.0
**Last Updated:** February 2026
**Author:** Fahimul Haque - Systems & Data
**Audience:** OPW Panel Members, HR/Payroll Team, Contract Drafters, System Administrators

---

## Table of Contents

1. [Overview](#1-overview)
2. [When Does the OPW Stage Activate?](#2-when-does-the-opw-stage-activate)
3. [Complete Workflow Flowchart](#3-complete-workflow-flowchart)
4. [Step 1: Worker Classification](#4-step-1-worker-classification)
5. [Path A: Sole Trader Determination](#5-path-a-sole-trader-determination)
6. [Path B: Intermediary IR35 Determination](#6-path-b-intermediary-ir35-determination)
7. [SDS Issuance and Tracking](#7-sds-issuance-and-tracking)
8. [Contract Required Decision](#8-contract-required-decision)
9. [Signing and Submitting Your Determination](#9-signing-and-submitting-your-determination)
10. [What Happens After Your Determination](#10-what-happens-after-your-determination)
11. [Audit Trail and Record-Keeping](#11-audit-trail-and-record-keeping)
12. [Email Notifications](#12-email-notifications)
13. [Database Schema Reference](#13-database-schema-reference)
14. [Downstream Stage Visibility](#14-downstream-stage-visibility)
15. [PDF Record](#15-pdf-record)
16. [Key Reference Information](#16-key-reference-information)
17. [FAQs](#17-faqs)

---

## 1. Overview

The OPW (Off-Payroll Working) Panel Review is a critical stage in the NHS Barts Health Supplier Setup Form. When Procurement identifies a submission as a **personal service provider** (sole trader, contractor, or intermediary), the submission is routed to the OPW Panel for employment status or IR35 determination.

**Your role as an OPW Panel member is to:**
- Classify the worker as either a **Sole Trader** or an **Intermediary**
- Determine their employment/IR35 status
- Track SDS issuance for Inside IR35 cases
- Decide whether a contract agreement is required
- Digitally sign your determination

**Every action you take is fully audited** — the system records who made the determination, when, what was decided, and the complete rationale. This creates a defensible audit trail for HMRC compliance.

---

## 2. When Does the OPW Stage Activate?

The OPW Panel stage is **not triggered for every supplier**. It only activates when:

```
Requester submits form
       |
       v
PBP Review (if required)
       |
       v
Procurement Review
       |
       v
Procurement classifies as "Personal Service Provider"
       |
       v
  OPW PANEL ACTIVATED
```

**Procurement routes to OPW when the supplier:**
- Is a sole trader or individual contractor
- Operates through a limited company where the worker holds >5% interest
- Operates through a partnership where the worker holds >60% interest
- Provides personal services rather than business-to-business services

**Procurement does NOT route to OPW when the supplier:**
- Is a standard limited company (no personal service element)
- Is a charity, public sector body, or large enterprise
- Has already been through IR35 assessment recently

---

## 3. Complete Workflow Flowchart

```
+==============================================================================+
|                    NHS BARTS HEALTH - OPW WORKFLOW ROUTING                    |
|                    (Off-Payroll Working Panel Review)                         |
+==============================================================================+

                         +---------------------+
                         |  PROCUREMENT REVIEW  |
                         |  classifies as:      |
                         |  "Personal Service"  |
                         +---------+-----------+
                                   |
                                   v
                   +-------------------------------+
                   |       OPW PANEL REVIEW         |
                   |                                |
                   |  Step 1: Determine Worker      |
                   |          Classification        |
                   +---------------+---------------+
                                   |
                    +--------------+--------------+
                    v                              v
         +-------------------+          +-----------------------+
         |    SOLE TRADER    |          |     INTERMEDIARY      |
         |   (Individual)    |          |  (Ltd Co >5% interest |
         |                   |          |   or Partnership >60%)|
         +--------+----------+          +----------+------------+
                  |                                |
                  v                                v
     +---------------------+          +---------------------+
     |  Step 2: Employment |          |  Step 2: IR35       |
     |  Status Assessment  |          |  Determination      |
     +----------+----------+          +----------+----------+
                |                                |
       +--------+--------+             +--------+--------+
       v                 v             v                 v
+--------------+  +--------------+ +--------------+ +--------------+
|   EMPLOYED   |  |SELF-EMPLOYED | | INSIDE IR35  | | OUTSIDE IR35 |
|              |  |              | |              | |              |
|  Worker is   |  |  Worker runs | |  Worker acts | |  Worker is   |
|  effectively |  |  their own   | |  like an     | |  genuinely   |
|  an employee |  |  business    | |  employee    | |  self-employed|
|  for tax     |  |              | |  via company | |  via company |
+--------------+  +------+-------+ +------+-------+ +------+-------+
       |                 |                |                 |
       v                 |                v                 |
 +=============+         |     +------------------+         |
 | TERMINAL    |         |     |  SDS ISSUED TO   |         |
 | STATE       |         |     |  INTERMEDIARY    |         |
 |             |         |     |                  |         |
 | > Payroll   |         |     | * 14-day window  |         |
 |   (ESR)     |         |     |   to respond     |         |
 |             |         |     | * If disagree:   |         |
 | NO Oracle   |         |     |   45-day review  |         |
 | supplier    |         |     +--------+---------+         |
 | record      |         |              |                   |
 +=============+         |              v                   |
                         |     +===============+            |
                         |     |   TERMINAL    |            |
                         |     |    STATE      |            |
                         |     |               |            |
                         |     | > Payroll     |            |
                         |     |   (ESR+PAYE)  |            |
                         |     |               |            |
                         |     | NO Oracle     |            |
                         |     | supplier      |            |
                         |     | record        |            |
                         |     +===============+            |
                         |                                  |
                         v                                  v
              +---------------------+            +---------------------+
              | Contract Required?  |            | Contract Required?  |
              +---------+-----------+            +---------+-----------+
                   +----+----+                        +----+----+
                   v         v                        v         v
                 YES        NO                      YES        NO
                   |         |                        |         |
                   v         |                        v         |
          +-----------------+|              +-----------------+ |
          |CONTRACT DRAFTER ||              |CONTRACT DRAFTER | |
          |                 ||              |                 | |
          | Sole Trader     ||              | Barts           | |
          | Agreement v22   ||              | Consultancy     | |
          |                 ||              | Agreement v1.2  | |
          | * Send template ||              |                 | |
          | * Negotiate     ||              | * Send template | |
          | * Get signature ||              | * Negotiate     | |
          | * Approve       ||              | * Get signature | |
          +--------+--------+|              | * Approve       | |
                   |         |              +--------+--------+ |
                   v         v                       v          v
                   +----+----+                       +----+-----+
                        |                                 |
                        +----------------+----------------+
                                         v
                            +------------------------+
                            |       AP CONTROL       |
                            |                        |
                            | * Verify bank details  |
                            | * Check letterhead     |
                            | * Validate supplier    |
                            | * Create Oracle record |
                            +-----------+------------+
                                        |
                                        v
                            +=========================+
                            |    VENDOR CREATED       |
                            |  (Oracle/AP Complete)   |
                            +=========================+
```

### Summary Table: All Possible Outcomes

| Worker Type | Determination | Terminal? | Next Stage | Agreement Type | Oracle Record? |
|-------------|--------------|-----------|------------|----------------|----------------|
| Sole Trader | **Employed** | YES | Payroll/ESR | None | NO |
| Sole Trader | **Self-Employed** (no contract) | No | AP Control | None | YES |
| Sole Trader | **Self-Employed** (contract required) | No | Contract Drafter | Sole Trader Agreement v22 | YES (after contract) |
| Intermediary | **Inside IR35** | YES | Payroll/ESR + SDS | None | NO |
| Intermediary | **Outside IR35** (no contract) | No | AP Control | None | YES |
| Intermediary | **Outside IR35** (contract required) | No | Contract Drafter | Barts Consultancy Agreement v1.2 | YES (after contract) |

---

## 4. Step 1: Worker Classification

When you open a submission for OPW review, your **first decision** is classifying the worker.

### Sole Trader
Select **Sole Trader** when:
- The worker is an individual providing personal services directly
- They do not operate through a limited company or partnership
- They are a freelancer, contractor, or self-employed individual
- The supplier type on the form is "Sole Trader"

### Intermediary
Select **Intermediary** when:
- The worker operates through a **limited company** and holds **more than 5% of the shares**
- The worker operates through a **partnership** and holds **more than 60% of the profit share**
- The worker is the sole or majority shareholder of their company
- This is a "Personal Service Company" (PSC) scenario

**Why does this matter?** The classification determines which assessment you perform next:
- Sole Traders get an **Employment Status** assessment (Employed vs Self-Employed)
- Intermediaries get an **IR35 Determination** (Inside vs Outside IR35)

---

## 5. Path A: Sole Trader Determination

If you classified the worker as a **Sole Trader**, you must determine their employment status.

### Employed
Select **Employed** when the worker:
- Is controlled by the client (told what to do, how to do it, when to do it)
- Cannot send a substitute — they must do the work personally
- Has mutuality of obligation — ongoing expectation of work and payment
- Is integrated into the organisation's operations
- Does not bear financial risk

**What happens:** This is a **terminal state**. The submission is marked complete. No Oracle supplier record is created. The worker must be engaged via NHS Payroll (ESR) through standard Trust recruitment processes (Fixed Term contract, Bank, or Agency).

### Self-Employed
Select **Self-Employed** when the worker:
- Controls how, when, and where they work
- Can send a suitably qualified substitute
- Bears financial risk (e.g., correcting defects at own cost)
- Provides their own equipment
- Works for other clients
- Is in business on their own account

**What happens:** The submission continues through the supplier setup process. You will then decide if a contract is required (see Section 8).

---

## 6. Path B: Intermediary IR35 Determination

If you classified the worker as an **Intermediary**, you must determine whether the engagement falls inside or outside IR35.

### Inside IR35
Select **Inside IR35** when:
- If the intermediary were removed, the worker would be an employee
- The client has control over how work is done
- The worker must perform the work personally (no right of substitution)
- There is mutuality of obligation
- The worker is part and parcel of the client's organisation
- CEST tool result indicates "employed for tax purposes"

**What happens:** This is a **terminal state**. The system:
1. Marks the submission as `inside_ir35_sds_issued`
2. Records SDS tracking data (see Section 7)
3. Sends formal SDS email to the intermediary
4. Sends notification to the hiring manager
5. Closes the Alemba ticket (if applicable)
6. No Oracle supplier record is created
7. The worker must be engaged via NHS Payroll (ESR) with PAYE deductions

### Outside IR35
Select **Outside IR35** when:
- The worker operates a genuine business
- They have the right of substitution
- They bear financial risk
- They are not controlled by the client in how they deliver the work
- There is no mutuality of obligation
- CEST tool result indicates "self-employed for tax purposes"

**What happens:** The submission continues through the supplier setup process. You will then decide if a contract is required (see Section 8).

---

## 7. SDS Issuance and Tracking

### What is an SDS?

A **Status Determination Statement (SDS)** is a formal document required by HMRC legislation when an engagement is determined to fall **Inside IR35**. The client (Barts Health) must issue this to the intermediary, informing them of the determination and their right to dispute it.

### How to Issue an SDS in the System

When you select **Inside IR35** for an intermediary, the system displays SDS tracking fields:

```
+---------------------------------------------------------------+
|  Status Determination Statement (SDS) Tracking                 |
|                                                                |
|  [ ] SDS has been issued to the intermediary                   |
|                                                                |
|  SDS Issued Date: [____/____/________]                         |
|                                                                |
|  [ ] Response received from intermediary                       |
|                                                                |
|  Response Date: [____/____/________]                           |
|                                                                |
|  Days since SDS issued: 5 days                                 |
|  (Warning appears after 14 days if no response)                |
+---------------------------------------------------------------+
```

**Step-by-step:**

1. **Tick** "SDS has been issued to the intermediary"
2. **Enter the date** the SDS was issued (or select today's date)
3. If the intermediary has already responded:
   - **Tick** "Response received from intermediary"
   - **Enter the response date**
4. The system automatically calculates days elapsed and flags overdue responses

### SDS Response Timeline

```
Day 0:  SDS issued to intermediary
        |
        | (Intermediary has 14 days to respond)
        |
Day 14: Response deadline
        |
        +--- If intermediary AGREES: No further action needed
        |
        +--- If intermediary DISAGREES: Must provide reasons in writing
             |
             | (OPW Panel has 45 days to reconsider)
             |
        Day 59: Final deadline for reconsideration
```

### What the System Records

When you submit an Inside IR35 determination with SDS tracking, the system stores:

```json
{
  "opwReview": {
    "workerClassification": "intermediary",
    "ir35Status": "inside",
    "rationale": "Your written rationale...",
    "decision": "approved",
    "signature": "Your Name",
    "date": "2026-03-15",
    "reviewedBy": "OPW Panel Member",
    "reviewedAt": "2026-03-15T10:30:00Z",
    "sdsTracking": {
      "sdsIssued": true,
      "sdsIssuedDate": "2026-03-15",
      "sdsResponseReceived": false,
      "sdsResponseDate": null,
      "daysSinceIssued": 0
    }
  },
  "status": "inside_ir35_sds_issued",
  "currentStage": "sds_issued",
  "outcomeRoute": "payroll_esr"
}
```

### SDS Email Sent Automatically

When you submit your determination, the system **automatically sends a formal SDS email** to the intermediary containing:

- The determination result (Inside IR35)
- Engagement details (submission ID, worker name, reviewer)
- SDS issue date and 14-day response deadline
- Your rationale for the determination
- Explanation of what Inside IR35 means
- The intermediary's right to respond/disagree
- Contact email: `bartshealth.opwpanelbarts@nhs.net`

A separate notification is sent to the hiring manager explaining the outcome and next steps (payroll/ESR route).

An internal alert is also sent to the OPW panel email tracking the SDS deadline.

---

## 8. Contract Required Decision

For **non-terminal** outcomes (Self-Employed sole traders and Outside IR35 intermediaries), you must indicate whether a contract agreement is required.

### When to Select "Yes - Contract Required"

- **Self-Employed Sole Traders:** When a Sole Trader Agreement is needed to formalise the engagement terms
- **Outside IR35 Intermediaries:** When a Barts Consultancy Agreement is needed to formalise the engagement

### When to Select "No - Contract Not Required"

- The engagement already has appropriate contractual terms in place
- The supplier has an existing framework agreement
- The procurement team has confirmed no additional contract is needed

### What Happens Based on Your Decision

| Contract Required? | Self-Employed | Outside IR35 |
|-------------------|---------------|--------------|
| **Yes** | Routes to Contract Drafter (Sole Trader Agreement v22) | Routes to Contract Drafter (Barts Consultancy Agreement v1.2) |
| **No** | Routes directly to AP Control | Routes directly to AP Control |

---

## 9. Signing and Submitting Your Determination

Before submitting, you must:

1. **Write your rationale** — Explain why you made this determination. This is a mandatory field and forms part of the audit trail. Be thorough — this may be reviewed by HMRC.

2. **Provide your digital signature** — Type your full name. This acts as your formal digital signature on the determination.

3. **Confirm the date** — The system pre-fills today's date but you can adjust if the actual determination was made on a different date.

4. **Review all fields** — Check your worker classification, determination, SDS tracking (if applicable), and contract decision before clicking "Submit Determination".

**Once submitted, the determination cannot be changed.** If an error was made, a new submission would need to be created.

---

## 10. What Happens After Your Determination

### Terminal States (Employed / Inside IR35)

```
Your Determination
       |
       v
+------------------+     +------------------+     +------------------+
| Submission       |     | Emails sent:     |     | Alemba ticket    |
| marked complete  | --> | * SDS to supplier| --> | closed with      |
| Status:          |     | * Notification   |     | resolution       |
| inside_ir35_     |     |   to requester   |     | summary          |
| sds_issued       |     | * Alert to OPW   |     |                  |
+------------------+     +------------------+     +------------------+
       |
       v
AP Control page shows:
"DO NOT SET UP SUPPLIER - Inside IR35 (Payroll Route)"
(Prevents accidental Oracle supplier creation)
```

### Non-Terminal States (Self-Employed / Outside IR35)

```
Your Determination
       |
       +--- Contract Required = YES ---+
       |                               v
       |                   +------------------------+
       |                   | CONTRACT DRAFTER STAGE |
       |                   | * Sends agreement      |
       |                   | * Negotiates terms     |
       |                   | * Gets signature       |
       |                   | * Approves contract    |
       |                   +----------+-------------+
       |                              |
       +--- Contract Required = NO ---+
       |                              |
       v                              v
+------------------------------------------+
|            AP CONTROL STAGE              |
| * Verifies bank details on letterhead   |
| * Validates supplier information        |
| * Creates Oracle supplier record        |
| * Issues vendor number                  |
+------------------------------------------+
       |
       v
+===================+
|  VENDOR CREATED   |
+===================+
```

---

## 11. Audit Trail and Record-Keeping

### What Gets Recorded

Every OPW determination creates an audit trail entry in the `AuditTrail` database table:

| Field | What's Recorded | Example |
|-------|----------------|---------|
| `SubmissionID` | The submission being reviewed | `SUP-2026-00042` |
| `ActionType` | The type of action | `OPW_APPROVED` or `OPW_REJECTED` |
| `PreviousStatus` | Status before your review | `pending_opw_review` |
| `NewStatus` | Status after your review | `inside_ir35_sds_issued`, `Pending_Contract`, `Pending_AP` |
| `PerformedBy` | Your name (from signature) | `Jane Doe` |
| `PerformedByEmail` | Your NHS email | `jane.doe@nhs.net` |
| `IPAddress` | Your IP address | `10.200.x.x` |
| `UserAgent` | Your browser details | `Chrome 121 / Windows 11` |
| `PerformedAt` | Exact timestamp | `2026-03-15 10:30:45.123` |
| `ActionDetails` | Full JSON of your determination | See below |

### ActionDetails JSON (Stored in Full)

```json
{
  "workerClassification": "intermediary",
  "ir35Status": "inside",
  "rationale": "Based on CEST assessment and review of working arrangements...",
  "contractRequired": "no",
  "sdsTracking": {
    "sdsIssued": true,
    "sdsIssuedDate": "2026-03-15",
    "sdsResponseReceived": false,
    "sdsResponseDate": null,
    "daysSinceIssued": 0
  },
  "signature": "Jane Doe",
  "date": "2026-03-15"
}
```

### Why This Matters

- **HMRC Compliance:** If HMRC queries an IR35 determination, the full decision-making record is available
- **Legal Protection:** Your rationale, the CEST result, and the formal SDS issuance are all time-stamped
- **Accountability:** Every determination is attributable to a named individual
- **Tamper-Proof:** Audit records cannot be edited or deleted through the application

---

## 12. Email Notifications

### Emails Sent Per Determination Outcome

| Outcome | Email 1 | Email 2 | Email 3 |
|---------|---------|---------|---------|
| **Employed** (Sole Trader) | Requester: "Determination complete - Employed - Payroll route" | OPW Panel: Internal notification | Alemba: Ticket closure |
| **Self-Employed** (Sole Trader) | Requester: "Self-Employed - proceeding to [Contract/AP]" | Contract Drafter or AP Control: New submission | OPW Panel: Internal notification |
| **Inside IR35** (Intermediary) | **Intermediary: Formal SDS** (14-day response window) | Requester: "Inside IR35 - Payroll route" | OPW Panel: "[SDS ISSUED] tracking alert" |
| **Outside IR35** (Intermediary) | Requester: "Outside IR35 - proceeding to [Contract/AP]" | Contract Drafter or AP Control: New submission | OPW Panel: Internal notification |

### SDS Email to Intermediary (Full Content)

When Inside IR35 is determined, the intermediary receives:

```
Subject: Status Determination Statement - Inside IR35 - [Supplier Name] - [Submission ID]

Dear [Supplier Name],

STATUS DETERMINATION STATEMENT (SDS)

The OPW Panel at Barts Health NHS Trust has made an IR35 determination regarding
the engagement described below.

DETERMINATION: INSIDE IR35

ENGAGEMENT DETAILS:
- Submission ID: SUP-2026-XXXXX
- Worker/Intermediary: [Supplier Name]
- Determined By: [Your Name]
- SDS Issued: [Date]
- Response Deadline: [Date + 14 days]

RATIONALE:
[Your written rationale appears here]

WHAT THIS MEANS:
This engagement has been determined to fall inside IR35. The worker must be
treated as an employee for tax purposes and engaged via NHS Payroll (ESR).
No Oracle supplier record will be created.

YOUR RIGHT TO RESPOND:
You have 14 days from the date of this SDS to respond.
- If you AGREE with this determination, no further action is needed.
- If you DISAGREE, you must provide your reasons in writing within 14 days.

If you disagree, the OPW Panel has 45 days to reconsider the determination.

Please send any correspondence to: bartshealth.opwpanelbarts@nhs.net

Regards,
Barts Health NHS Trust
OPW Panel
```

---

## 13. Database Schema Reference

### Submissions Table - OPW Columns

| Column | Type | Description |
|--------|------|-------------|
| `OPWReviewData` | NVARCHAR(MAX) | Full OPW review JSON including sdsTracking |
| `OPWDecision` | NVARCHAR(50) | 'approved' or 'rejected' |
| `OPWApprovedBy` | NVARCHAR(255) | Name of OPW panel reviewer |
| `OPWDate` | DATETIME | Date of determination |
| `IR35Determination` | NVARCHAR(50) | 'inside', 'outside', or NULL |
| `OutcomeRoute` | NVARCHAR(50) | 'oracle_ap', 'payroll_esr', or NULL |
| `Status` | NVARCHAR(50) | 'inside_ir35_sds_issued', 'Completed_Payroll', 'Pending_Contract', 'Pending_AP' |
| `CurrentStage` | NVARCHAR(50) | 'sds_issued', 'completed_payroll', 'contract', 'ap' |

### OPWReviewData JSON Structure

The `OPWReviewData` column stores the complete review as a JSON string:

**Sole Trader - Employed:**
```json
{
  "workerClassification": "sole_trader",
  "employmentStatus": "employed",
  "rationale": "Worker is controlled by the client...",
  "decision": "approved",
  "signature": "Jane Doe",
  "date": "2026-03-15",
  "reviewedBy": "OPW Panel Member",
  "reviewedAt": "2026-03-15T10:30:00Z"
}
```

**Sole Trader - Self-Employed:**
```json
{
  "workerClassification": "sole_trader",
  "employmentStatus": "self_employed",
  "rationale": "Worker operates their own business...",
  "contractRequired": "yes",
  "decision": "approved",
  "signature": "Jane Doe",
  "date": "2026-03-15",
  "reviewedBy": "OPW Panel Member",
  "reviewedAt": "2026-03-15T10:30:00Z"
}
```

**Intermediary - Inside IR35 (with SDS):**
```json
{
  "workerClassification": "intermediary",
  "ir35Status": "inside",
  "rationale": "CEST determination and manual review indicate...",
  "contractRequired": "no",
  "decision": "approved",
  "signature": "Jane Doe",
  "date": "2026-03-15",
  "reviewedBy": "OPW Panel Member",
  "reviewedAt": "2026-03-15T10:30:00Z",
  "sdsTracking": {
    "sdsIssued": true,
    "sdsIssuedDate": "2026-03-15",
    "sdsResponseReceived": false,
    "sdsResponseDate": null,
    "daysSinceIssued": 0
  }
}
```

**Intermediary - Outside IR35:**
```json
{
  "workerClassification": "intermediary",
  "ir35Status": "outside",
  "rationale": "Worker operates a genuine business...",
  "contractRequired": "yes",
  "decision": "approved",
  "signature": "Jane Doe",
  "date": "2026-03-15",
  "reviewedBy": "OPW Panel Member",
  "reviewedAt": "2026-03-15T10:30:00Z"
}
```

### AuditTrail Table

| Column | Type | Description |
|--------|------|-------------|
| `AuditID` | INT (auto) | Unique audit record ID |
| `SubmissionID` | NVARCHAR(50) | Links to the submission |
| `ActionType` | NVARCHAR(100) | 'OPW_APPROVED' or 'OPW_REJECTED' |
| `ActionDetails` | NVARCHAR(MAX) | Full JSON of determination details |
| `PreviousStatus` | NVARCHAR(50) | Status before review |
| `NewStatus` | NVARCHAR(50) | Status after review |
| `PerformedBy` | NVARCHAR(255) | Reviewer's name |
| `PerformedByEmail` | NVARCHAR(255) | Reviewer's email |
| `IPAddress` | NVARCHAR(50) | Client IP address |
| `UserAgent` | NVARCHAR(500) | Browser information |
| `PerformedAt` | DATETIME | Exact timestamp |

---

## 14. Downstream Stage Visibility

Your OPW determination is visible to all subsequent review stages:

### Contract Drafter Page
- Sees your **worker classification** (Sole Trader / Intermediary)
- Sees your **determination** (Self-Employed / Outside IR35)
- Sees your **rationale**
- Sees whether **contract is required** and which template to use
- **Does not see Inside IR35 or Employed submissions** (those are terminal)

### AP Control Page
- Sees your full OPW determination in the "Previous Authorisations" section
- For terminal states (Employed / Inside IR35), a **red blocking banner** is displayed:
  - "DO NOT SET UP SUPPLIER - Employed (Payroll Route)" or
  - "DO NOT SET UP SUPPLIER - Inside IR35 (Payroll Route)"
- Includes full SDS tracking information for Inside IR35 cases
- AP verification checklist is **hidden** for terminal states (preventing accidental supplier creation)

### Requester Response Page
- Shows high-level workflow progress (which stages are complete)
- For terminal states, shows the submission is complete
- Detailed SDS tracking is **not shown** to the requester (they receive the details via email instead)

---

## 15. PDF Record

When a PDF is generated for any submission that went through OPW review, the PDF includes:

### OPW Panel Section (Authorisation Use Only)
- Worker classification (Sole Trader / Intermediary)
- Employment status or IR35 determination with colour-coded badge
- Full rationale text
- Contract required (Yes/No)
- Digital signature and date

### SDS Tracking (Inside IR35 Only)
- SDS Issued date
- Response Received (Yes/No + date)
- Days elapsed and overdue status
- Warning text: "PAYROLL ROUTE: Inside IR35 determination. Must be paid via NHS payroll (ESR). No Oracle supplier record created."

### Contract Drafter Section (If Applicable)
- Worker classification context from OPW review
- Agreement type used
- Final signed document reference
- Contract drafter's signature and date

This PDF serves as the **permanent record** of the full supplier setup process and all authorisations.

---

## 16. Key Reference Information

### OPW Panel Contact
- **Email:** bartshealth.opwpanelbarts@nhs.net
- **Azure AD Group:** NHS-SupplierForm-OPW

### Agreement Templates
| Template | Used For | Version |
|----------|----------|---------|
| Barts Consultancy Agreement | Outside IR35 intermediaries | v1.2 |
| Sole Trader Agreement | Self-employed sole traders | v22 |

### Status Values Reference

| Status Code | Meaning | Terminal? |
|------------|---------|-----------|
| `Completed_Payroll` | Employed - routed to payroll | YES |
| `inside_ir35_sds_issued` | Inside IR35 - SDS issued | YES |
| `Pending_Contract` | Awaiting contract negotiation | No |
| `Pending_AP` | Awaiting AP Control verification | No |

### Stage Values Reference

| Stage Code | Meaning |
|-----------|---------|
| `sds_issued` | Inside IR35 terminal (SDS sent) |
| `completed_payroll` | Employed terminal (payroll route) |
| `contract` | Contract Drafter active |
| `ap` | AP Control active |

### Outcome Route Values

| Route | Meaning | Oracle Record? |
|-------|---------|----------------|
| `payroll_esr` | Worker goes to NHS Payroll (ESR) | NO |
| `oracle_ap` | Worker set up as Oracle supplier | YES |

---

## 17. FAQs

### General Questions

**Q: Can I change my determination after submitting?**
A: No. Once submitted, the determination is final and recorded in the audit trail. If a correction is needed, contact the system administrator. A new submission may need to be raised.

**Q: What if I'm unsure about the IR35 determination?**
A: Use the HMRC CEST (Check Employment Status for Tax) tool at https://www.gov.uk/guidance/check-employment-status-for-tax. The CEST result should be uploaded with the submission. If still uncertain, discuss with the OPW Panel before submitting.

**Q: Do I need to send the SDS email separately?**
A: No. When you submit an Inside IR35 determination with SDS tracking enabled, the system **automatically sends** the formal SDS email to the intermediary. You do not need to send it manually. However, any follow-up correspondence regarding disagreements should go through the panel email: bartshealth.opwpanelbarts@nhs.net

**Q: What happens if the intermediary disagrees with the SDS?**
A: They must submit their reasons in writing within 14 days. The OPW Panel then has 45 days to reconsider. This correspondence currently happens via email (bartshealth.opwpanelbarts@nhs.net). The system tracks the response deadline and flags overdue responses.

**Q: Can I see submissions assigned to other OPW panel members?**
A: All members of the `NHS-SupplierForm-OPW` Azure AD group can view and review any submission routed to OPW. Access is role-based, not individually assigned.

### SDS Questions

**Q: Is the SDS tracking mandatory for Inside IR35?**
A: The SDS tracking fields appear when you select Inside IR35. While technically you can submit without ticking "SDS issued", you **should always** tick this and provide the issued date, as the SDS is a legal requirement for Inside IR35 determinations.

**Q: What if the intermediary hasn't responded after 14 days?**
A: The system will flag the SDS as **OVERDUE** in red. The determination still stands. The intermediary's failure to respond within 14 days means the Inside IR35 determination is final. However, you should document the non-response.

**Q: Where is the SDS document stored?**
A: The SDS content is generated as the email body and stored in the `NotificationQueue` table. The full determination details (including SDS tracking) are stored in the `OPWReviewData` JSON column and in the `AuditTrail` table. The PDF also captures a summary of the SDS tracking.

### Workflow Questions

**Q: Why does "Employed" skip straight to completion?**
A: An employed worker is not a supplier. They must be engaged through NHS Payroll (ESR), not through Oracle Accounts Payable. Creating an Oracle supplier record for an employed worker would be incorrect from both a tax and procurement perspective.

**Q: When should I select "Contract Required"?**
A: Select "Yes" when the engagement needs a formal agreement. For Outside IR35 intermediaries, a Barts Consultancy Agreement is typically required. For Self-Employed sole traders, a Sole Trader Agreement may be needed. Consult with the Contract Drafter (peter.persaud@nhs.net) if unsure.

**Q: What if Procurement incorrectly routed a standard supplier to OPW?**
A: You can reject the submission with an explanation that OPW review is not required. The submission will be returned to Procurement for re-routing.

---

## Appendix A: Quick Reference Card

```
+================================================================+
|                    OPW PANEL QUICK REFERENCE                    |
+================================================================+
|                                                                 |
|  SOLE TRADER:                                                   |
|    Employed    --> PAYROLL (Terminal - NO Oracle record)         |
|    Self-Employed --> Contract or AP Control --> Oracle           |
|                                                                 |
|  INTERMEDIARY:                                                  |
|    Inside IR35 --> SDS ISSUED --> PAYROLL (Terminal)             |
|    Outside IR35 --> Contract or AP Control --> Oracle            |
|                                                                 |
|  SDS TIMELINE:                                                  |
|    Day 0:  SDS issued                                           |
|    Day 14: Intermediary response deadline                       |
|    Day 59: OPW reconsideration deadline (if disagreement)       |
|                                                                 |
|  CONTRACT TEMPLATES:                                            |
|    Self-Employed:  Sole Trader Agreement v22                    |
|    Outside IR35:   Barts Consultancy Agreement v1.2             |
|                                                                 |
|  OPW PANEL EMAIL: bartshealth.opwpanelbarts@nhs.net             |
|  CONTRACT DRAFTER: peter.persaud@nhs.net                        |
+================================================================+
```

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | February 2026 | Fahimul Haque | Initial release |

---

**End of Document**
