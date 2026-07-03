# Step 6: Hybrid Architecture — SharePoint Lists & Power Automate Flows

**Version:** 1.0 | **Date:** June 2026 | **Author:** Fahimul Haque | **Status:** DRAFT
**Supersedes:** the SQL Server NotificationQueue approach in `04-power-automate.md`
**Companion to:** `docs/NHS_SSF_Platform_Decision_Addendum.md`

---

## 1. Architecture overview

```
Staff browser (NHS network, Azure AD SSO)
        │
        ▼
React SPA (Azure Static Web Apps)
        │  Microsoft Graph (delegated, Sites.Selected)
        ▼
SharePoint site: NHS-Supplier-Forms
  ├── List: SSF-Submissions      ← one item per supplier request
  ├── List: SSF-AuditTrail       ← append-only action log
  ├── Library: SupplierDocuments  (general documents)
  └── Library: SensitiveDocuments (IDs / bank docs — restricted)
        │  "When an item is created / modified" triggers
        ▼
Power Automate flows F1–F5 ──→ Outlook emails to team shared mailboxes
```

The canonical Status / CurrentStage values are defined in
`src/utils/workflowStatus.js` and MUST match the choice columns and trigger
conditions below exactly.

---

## 2. List design

### 2.1 SSF-Submissions

| Column | Type | Notes |
|---|---|---|
| Title | Text | Submission ID, format `SUP-YYYY-XXXXXXXX` (indexed, enforced unique by app) |
| Status | Choice | `pending_review`, `info_required`, `approved`, `procurement_approved_opw`, `pending_contract`, `contract_uploaded`, `pending_ap_control`, `completed`, `completed_payroll`, `inside_ir35_sds_issued`, `rejected` |
| CurrentStage | Choice | `pbp`, `procurement`, `opw`, `contract`, `ap`, `completed`, `completed_payroll`, `sds_issued`, `rejected` |
| LastStatus | Text | Previous Status — written by the app/flow before changing Status (audit + loop guard) |
| StatusChangedAt | Date/Time | Set whenever Status changes (used in trigger conditions and the reminder digest) |
| RequesterName / RequesterEmail / RequesterDept | Text | From Section 1 |
| CompanyName / TradingName | Text | CompanyName indexed (duplicate checks) |
| SupplierType | Choice | `limited_company`, `partnership`, `charity`, `sole_trader`, `public_sector` |
| CRN / VATNumber / CharityNumber | Text | |
| ServiceCategory | Choice | `clinical`, `non-clinical` |
| OutcomeRoute | Choice | `oracle_ap`, `payroll_esr`, blank |
| AlembaReference / VendorNumber | Text | |
| FormDataJSON | Multi-line text (plain) | Full form payload **excluding bank details** |
| PBPReviewJSON / ProcurementReviewJSON / OPWReviewJSON / ContractReviewJSON / APReviewJSON | Multi-line text (plain) | Per-stage decision payloads |

**Bank details rule (mandatory):** sort code, account number, IBAN and SWIFT are
**never stored as columns or inside FormDataJSON**.

> Note (July 2026): the form *deliberately* collects typed bank details in Section 6
> **in addition to** the letterhead upload — AP Control uses the typed values to
> cross-check against the letterhead document. This does not change the storage rule
> above; it changes what step 4 (the Graph provider) must do with those fields:
> either strip them before writing FormDataJSON (AP then verifies from the letterhead
> alone — Option A), or write them to the restricted store in Option B. Decide with
> AP Control before building the provider.

Two options:

- **Option A (recommended):** bank details exist only inside the supplier letterhead
  PDF in **SensitiveDocuments** (AP Control verify from the document, as they do today).
  Zero structured copies; simplest DPIA story.
- **Option B:** a separate `SSF-BankDetails` list with unique permissions (AP Control +
  Admin only), one item per submission. Only choose this if AP Control insists on
  structured data; it doubles the permission surface.

**List settings:** versioning ON; item-level "Read items that were created by the user"
is **not** used (reviewers need cross-item access) — access is via SharePoint groups
(§3); attachments OFF (documents go to the libraries).

### 2.2 SSF-AuditTrail (append-only)

| Column | Type |
|---|---|
| Title | Submission ID |
| ActionType | Text (e.g. `SUBMISSION_CREATED`, `PROCUREMENT_REVIEW_APPROVED`) |
| PerformedBy | Text (email) |
| PreviousStatus / NewStatus | Text |
| Details | Multi-line text |

Permissions: everyone in the SSF groups can **add**; only SSF-Admin can edit/delete
(set via list permission levels). Versioning ON.

---

## 3. Permissions model

SharePoint groups replace the previously requested AD security groups:

| Group | Members (≈) | Access |
|---|---|---|
| SSF-PBP | 3–5 | Contribute on SSF-Submissions, SupplierDocuments |
| SSF-Procurement | 3–5 | Contribute on SSF-Submissions, SupplierDocuments |
| SSF-OPW | 3–5 | Contribute on SSF-Submissions, SupplierDocuments |
| SSF-Contract | 2–3 | Contribute + SensitiveDocuments read/write |
| SSF-APControl | 3–5 | Contribute + SensitiveDocuments read/write (+ SSF-BankDetails if Option B) |
| SSF-Admin | 1–2 | Full control |
| All staff (requesters) | Trust-wide | **No direct list access** — the SPA writes on their behalf and shows them only their own items (Graph filter on RequesterEmail = signed-in UPN) |

Notes: at ~300 items/year the 5,000-unique-permissions threshold is irrelevant, but do
not assign per-item permissions anyway — group + library level only. Disable
"Anyone/Company-wide" sharing links on both libraries.

---

## 4. Flow catalogue

All mail goes to **shared mailboxes** (to be confirmed with each team):
PBP `pbp-panel@nhs.net` · Procurement `procurement@nhs.net` · OPW `opw-panel@nhs.net`
· AP `ap-control@nhs.net` · Contract Drafter `peter.persaud@nhs.net` *(named-person
risk — request a shared mailbox)*.

Every email contains: Submission ID, supplier name, requester name, a deep link to the
stage's review page — and **no bank details or personal data beyond names**. Link paths
must match the React routes in `src/App.jsx` exactly:
`/pbp-review/`, `/procurement-review/`, `/opw-review/`, `/ap-review/`,
**`/contract-drafter/`** (note: the contract page does *not* follow the
`<stage>-review` pattern), and `/respond/` for requester-facing emails.

### F1 — New submission → PBP
- **Trigger:** SSF-Submissions — *When an item is created*.
- **Actions:** send email to PBP mailbox ("New supplier request {Title} — {CompanyName}");
  add SSF-AuditTrail item (`SUBMISSION_CREATED`); **Update item** on the triggering item:
  `LastStatus = pending_review`, `StatusChangedAt = utcNow()`. This initialises the F2
  loop guard — without it, F2's empty-LastStatus check suppresses the first transition.

### F2 — Status router (single flow, Switch on Status)
- **Trigger:** *When an item is created or modified* (the SharePoint connector has no
  modified-only trigger), with trigger condition (loop guard):

```
@and(not(empty(triggerOutputs()?['body/LastStatus'])), not(equals(triggerOutputs()?['body/Status/Value'], triggerOutputs()?['body/LastStatus'])))
```

> ⚠️ `Status` is a **Choice** column, so `triggerOutputs()?['body/Status']` returns an
> object — comparing it to the `LastStatus` text column is *always* unequal, which
> defeats the guard and produces an infinite email loop. The `/Value` suffix is
> mandatory. The `empty(LastStatus)` check stops F2 double-firing on item creation
> (F1 owns the creation event and initialises LastStatus).

- **First action:** update item `LastStatus = Status` (prevents re-trigger loops), then **Switch** on `Status`:

| Status | Notify | Email intent |
|---|---|---|
| `approved` | Procurement mailbox | PBP approved — classify supplier |
| `procurement_approved_opw` | OPW mailbox | OPW/IR35 determination required |
| `pending_ap_control` | AP mailbox | Verify bank details & create vendor |
| `pending_contract` | Contract Drafter | Agreement required (template in OPWReviewJSON) |
| `contract_uploaded` | AP mailbox | Contract done — final verification |
| `completed` | Requester | Vendor {VendorNumber} created — raise POs as normal |
| `completed_payroll` | Requester + Payroll guidance | Worker is employed — ESR route, no supplier record |
| `inside_ir35_sds_issued` | Requester | Inside IR35 — SDS issued, payroll route |
| `rejected` | Requester | Rejected at {CurrentStage}: reason from the stage's ReviewJSON |
| `info_required` | Requester | PBP needs more information — respond via link |

- **Last action:** append SSF-AuditTrail item (PreviousStatus = LastStatus captured at start).

### F3 — Sensitive document auto-deletion
- **Trigger:** same as F2, condition `Status` ∈ {`completed`, `completed_payroll`, `inside_ir35_sds_issued`, `rejected`}.
- **Actions:** *Get files* in `SensitiveDocuments/{SubmissionID}/` where DocumentType ∈
  {passport, licence-front, licence-back} → delete each → audit entry
  (`ID_DOCUMENTS_DELETED`). This implements the "ID deleted on completion" promise in
  Section 3 of the form and the DPIA.

### F4 — Stuck-item weekly digest
- **Trigger:** Recurrence, Mondays 08:00.
- **Actions:** *Get items* where Status begins with `pending_` or equals
  `approved`/`procurement_approved_opw`/`info_required` AND
  `StatusChangedAt lt addDays(utcNow(), -5)` → group by CurrentStage → one summary
  email per team mailbox + copy to SSF-Admin.

### F5 — Audit completeness (optional, after F1–F4 are stable)
F2 already writes audit entries on every status change; F5 adds a nightly
reconciliation that flags Submissions items whose Modified date has no matching
audit entry that day. Skip initially if effort is constrained.

---

## 5. Gotchas

- **Trigger latency:** list triggers poll (1–5 min). Acceptable for this process; do
  not promise instant emails.
- **Flow ownership:** flows owned by a personal account die with that account. Add
  SSF-Admin members as co-owners; request a service account for connections before
  go-live.
- **Run history:** 28 days only — the SSF-AuditTrail list is the durable record, which
  is why F2 writes it on every transition.
- **Infinite loops:** any flow that updates the triggering item re-fires "modified"
  triggers — the `LastStatus` guard in F2 is mandatory; keep it as the FIRST action.
- **Choice column drift:** if a Status value is renamed, update *all three* places:
  `workflowStatus.js`, the choice column, the F2 Switch. Treat as a breaking change.

---

## 6. Build order

- [ ] Create SSF-Submissions list (columns §2.1, versioning on, sharing links off)
- [ ] Create SSF-AuditTrail list (§2.2, restricted edit)
- [ ] Decide bank-details Option A/B with AP Control (recommend A)
- [ ] Create the six SharePoint groups; populate members (§3)
- [ ] Set library permissions (SensitiveDocuments → Contract/AP/Admin only)
- [ ] Build F1, F2 (with LastStatus guard), F3, F4; add co-owners
- [ ] Test matrix — one run per branch:
  - [ ] standard: pending_review → approved → pending_ap_control → completed
  - [ ] OPW sole trader employed: … → procurement_approved_opw → completed_payroll
  - [ ] OPW self-employed + contract: … → pending_contract → contract_uploaded → completed
  - [ ] intermediary inside IR35: … → inside_ir35_sds_issued
  - [ ] intermediary outside IR35, no contract: … → pending_ap_control → completed
  - [ ] rejection at each of PBP / Procurement / OPW / AP
  - [ ] info_required round-trip
  - [ ] F3 deletes ID files on completed and on rejected
