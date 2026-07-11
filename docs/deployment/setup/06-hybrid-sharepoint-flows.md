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
| PBPReviewJSON / ProcurementReviewJSON / OPWReviewJSON / ContractReviewJSON / APReviewJSON | Multi-line text (plain) | Per-stage decision payloads **excluding attachment content** (see step-4 rules below) |
| SubmissionType | Choice | `full`, `questionnaire` (default `full`) — Section 2 pre-screening questionnaires are separate items with `QUEST-` reference numbers; F1 routes on this: questionnaire → PBP, full → Procurement (full items are created with Status `approved`) |
| AwaitingParty | Choice | `none`, `requester`, `pbp` (default `none`) — set by the app during info-required conversations; watched by F6 |

**Bank details rule (mandatory):** sort code, account number, IBAN and SWIFT are
**never stored as columns or inside FormDataJSON**.

> Note (July 2026): the form *deliberately* collects typed bank details in Section 6
> **in addition to** the letterhead upload — AP Control uses the typed values to
> cross-check against the letterhead document. This does not change the storage rule
> above; it changes what step 4 (the Graph provider) must do with those fields:
> either strip them before writing FormDataJSON (AP then verifies from the letterhead
> alone — Option A), or write them to the restricted store in Option B. Decide with
> AP Control before building the provider.

**DECIDED (July 2026): Option B.** There have been real cases where the typed bank
details differed from the letterhead — the on-screen cross-check catches
discrepancies, so the typed values must survive into production storage:

- **Option A (not chosen):** bank details only inside the letterhead PDF in
  SensitiveDocuments; simplest DPIA story but loses the cross-check.
- **Option B (chosen):** a separate **`SSF-BankDetails`** list, one item per
  submission, with **unique permissions: SSF-APControl + SSF-Admin only**.
  Columns: Title (= Submission ID), NameOnAccount, SortCode, AccountNumber,
  IBAN, SWIFTCode, BankRouting (all single-line text). Versioning ON, sharing
  links off. The AP review page reads this list to display typed values next to
  the letterhead. The DPIA must describe this list and its restricted access.

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

### F1 — New submission router (UPDATED July 2026: full forms skip PBP)
- **Why the change:** PBP clearance is a Section 2 gate inside the form
  (questionnaire approval / prior procurement engagement evidence at Q2.8) —
  a requester cannot submit without it. Full submissions are therefore
  created with **Status = `approved`** and enter the pipeline at Procurement.
  Only `QUEST-` questionnaire items are created as `pending_review` for PBP.
- **Trigger:** SSF-Submissions — *When an item is created*.
- **Actions:** **Condition on SubmissionType**:
  - `questionnaire` → email PBP mailbox ("New pre-screening questionnaire
    {Title} — {CompanyName}", link `/pbp-review/{Title}`), split
    clinical/non-clinical per ServiceCategory (Task 12);
  - `full` → email **Procurement** mailbox ("New supplier request {Title} —
    {CompanyName} — classification needed", link `/procurement-review/{Title}`).
- Then (outside the Condition): add SSF-AuditTrail item (`SUBMISSION_CREATED`,
  NewStatus = the item's **Status value from the trigger**); **Update item**:
  `LastStatus = Status value from the trigger` (⚠️ NOT hardcoded
  `pending_review` — full items are created as `approved`; a hardcoded value
  would defeat the F2 loop guard and double-email Procurement),
  `StatusChangedAt = utcNow()`.

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
| `approved` | **Condition on SubmissionType:** `questionnaire` → Requester, **attaching the approval certificate** from `SupplierDocuments/<QUEST-id>/`; `full` → Procurement mailbox (defensive only — since July 2026 full items are *created* as `approved`, so F1 owns that notification and this branch should never fire for them) | Questionnaire: your pre-screening is approved — upload the attached certificate at Q2.8 to continue. Full: PBP approved — classify supplier |
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

### F6 — Requester responded (closes the info_required dead spot)
- **Why:** a requester's reply to an information request does not change Status,
  so F2 never fires — without F6, PBP would only learn of the response from the
  Monday digest (verified at runtime, July 2026).
- **Trigger:** *When an item is created or modified*, condition
  `Status = info_required AND AwaitingParty = pbp`.
- **Actions:** update item `AwaitingParty = none` (loop guard, FIRST action) →
  email PBP mailbox with the `/pbp-review/` link → audit entry (`REQUESTER_RESPONDED`).
- **App side (step 4):** the Graph provider sets `AwaitingParty = requester` on a
  PBP info request and `pbp` on a requester response (the app already tracks this
  as `pbpReview.currentStatus` `awaiting_requester`/`awaiting_pbp`).

### F5 — Audit completeness (optional, after F1–F4 are stable)
F2 already writes audit entries on every status change; F5 adds a nightly
reconciliation that flags Submissions items whose Modified date has no matching
audit entry that day. Skip initially if effort is constrained.

---

## 4b. Step-4 (Graph provider) requirements — learned from runtime verification

Rules the Graph/SharePoint storage provider MUST implement when it replaces the
dev localStorage provider. Each traces to a verified behaviour of the current app:

1. **Strip bank details from FormDataJSON and write them to SSF-BankDetails**
   (Option B — decided July 2026, see §2.1). The typed Section 6 values exist so AP
   Control can cross-check against the letterhead; past cases have caught real
   discrepancies. The provider writes one SSF-BankDetails item per submission and
   never puts these fields in FormDataJSON or any other column.
2. **Strip attachment content from exchange payloads.** Info-required and contract
   negotiation messages carry base64 attachments in the dev store. In production the
   provider must upload each attachment to `SupplierDocuments/<SubmissionID>/exchanges/`
   and store only name + link in the ReviewJSON — never base64 (list item size and
   DPIA localStorage claims both depend on this).
3. **Stamp RequesterEmail from the signed-in account (UPN), not the typed Section 1
   email.** Requester access filtering and F2's requester emails key off this column;
   a typo or alias mismatch in the typed field would lock a requester out of their
   own submission.
4. **Set AwaitingParty** (`requester` on PBP info request, `pbp` on requester
   response) so F6 fires — the app already tracks this internally as
   `pbpReview.currentStatus`.
5. **Supplier (external) participation is email-only in production.** The `/respond/`
   portal's supplier role works in dev, but external suppliers cannot sign in to the
   Trust tenant — contract negotiation with the supplier happens via the drafter's
   mailbox (as the Contract Review page already states). Portal access for suppliers
   would require Azure AD guest accounts — out of scope for v1.
6. **Questionnaire approval certificate is automated (decided July 2026):** when PBP
   approve a questionnaire, the provider uploads the generated approval PDF
   (PBPApprovalPDF) to `SupplierDocuments/<QUEST-id>/`; F2's questionnaire branch
   emails it to the requester automatically. The PBP review page keeps its stamped
   decision + certificate download button as the fallback copy if the requester
   loses the email. A **rejected** questionnaire locks that supplier setup (the app
   enforces this at Q2.8/Q2.9) and fresh attempts at the same supplier name are
   fuzzy-flagged (70% threshold) in Section 4 and at PBP approval time — rejected
   QUEST items must therefore keep CompanyName populated (from the questionnaire's
   supplierName) so the flagging net can match them.
7. **Concurrency guard for multi-person teams (added July 2026 — PBP has 4–5
   members):** two protections against duplicate assessment of the same item:
   (a) **Claim banner** — implemented in the app July 2026 (PBPReviewPage): the
   first PBP member to open an unclaimed pending item gets `pbpReview.claim`
   ({name, email, at}) stamped from the signed-in identity; they see an "Assigned
   to you" notice, others see "Being reviewed by {name} since {time}" (soft claim —
   anyone can still take over, it's a coordination signal not a lock; admins
   viewing don't auto-claim). The Graph provider must ALSO mirror the claim to the
   ClaimedBy / ClaimedByName / ClaimedAt columns so flow **F7** (playbook Task 11)
   emails the claimer a confirmation with the deep link. (b) **Stale-write
   guard** — decision writes use SharePoint optimistic concurrency (Graph `PATCH`
   with `If-Match: <etag>` captured at page load); a 412 response means someone
   else decided first — show "This item was already decided by {name}; refresh to
   see the outcome" and discard the second decision. First decision wins; the
   audit trail records only one outcome per stage.

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
- [ ] Build F1, F2 (with LastStatus guard), F3, F4, F6 (AwaitingParty guard); add co-owners
- [ ] Test matrix — one run per branch:
  - [ ] questionnaire: QUEST item pending_review → approved (requester gets certificate email) / rejected
  - [ ] standard full form: created at approved (F1 emails Procurement, F2 silent) → pending_ap_control → completed
  - [ ] OPW sole trader employed: … → procurement_approved_opw → completed_payroll
  - [ ] OPW self-employed + contract: … → pending_contract → contract_uploaded → completed
  - [ ] intermediary inside IR35: … → inside_ir35_sds_issued
  - [ ] intermediary outside IR35, no contract: … → pending_ap_control → completed
  - [ ] rejection at each of PBP / Procurement / OPW / AP
  - [ ] info_required round-trip
  - [ ] F3 deletes ID files on completed and on rejected

---

## 7. Pending designs (July 2026 — agreed with PBP, awaiting inputs)

### 7.1 PBP category routing — IN BUILD (matrix received 10 Jul 2026)

PBP review is delegated by sub-category and (clinical only) by site. The
delegation matrix lives in the **SSF-PBPMatrix** SharePoint list (created
10 Jul 2026: Title = category, ServiceCategory, Site, OwnerName, OwnerEmail,
DeputyEmail, Active). **The list — not the flows and not this doc — is the
single source of truth for who owns what**; the actual names/emails are
deliberately NOT recorded in this public repo.

Status:
1. **App — DONE (10 Jul 2026):** required "Which area does this request fall
   under?" select in both Section 2 questionnaires (`QuestionnaireModal`).
   Option values match SSF-PBPMatrix Titles exactly; site derives from the
   choice; stored as `pbpCategory` + `site` on the QUEST item and shown on
   the PBP review page. ⚠️ **Sync duty:** the PBP_CATEGORIES array in
   `QuestionnaireModal.jsx` and the SSF-PBPMatrix list must change together
   (categories only — owner changes are list-only edits, no code change).
   SSF-Submissions gained PBPCategory + Site columns (production provider
   maps the fields).
2. **Flows:** F1 (questionnaire branch) + F6 subjects gain
   `— [PBPCategory] ([Site])` (playbook Action 3, 10 Jul). A later
   enhancement (post mailbox decision): Get-items lookup on SSF-PBPMatrix to
   CC the owner; optional Teams Flow-bot ping using the same lookup.
3. **Mailboxes:** subject tagging likely means ONE PBP shared mailbox
   suffices; decision deferred (non-clinical model itself is under review —
   Oliver Watling proposes it moves to the catalogue/helpdesk team, needs
   CPO approval; parked July 2026, revisit as a future update).
4. Do NOT encode reviewer names/emails in flows — people change; the list
   changes with them (joiner/mover/leaver = row edits only).

### 7.2 Supplier information pack — triage for supplier-known answers

> **Status (11 Jul 2026):** MS Form created ("Barts Health — Supplier
> Information Pack", 18 questions + closing text; anonymous responses). App
> side DONE: Section 3 shows a helper notice with a persistent per-draft
> `PACK-XXXXXX` reference and a one-click copy of the supplier email
> (renders only when `VITE_SUPPLIER_PACK_FORM_URL` is configured — the URL
> is deliberately NOT committed to this public repo). **F8 + the
> SSF-SupplierPacks list are BUILT and ON (11 Jul).**
>
> **Prefill (same day):** a "Fetch my supplier's answers" button calls a
> lookup flow (`VITE_PACK_FETCH_FLOW_URL`, HTTP trigger — same proxy
> pattern as CRN/VAT) that returns the SSF-SupplierPacks row matching
> `?ref=<PACK-…>&email=<requester>`; the app prefills ~15 fields across
> Sections 3–6 (yes/no radios, employee band mapping, postcode extracted
> from the address). Never auto-filled by design: supplier type, ID
> documents, bank details, insurance free-text (surfaced as a note).
> Prefill never bypasses validation or the CRN/VAT verification.
> The dual key (reference + requester email) means a leaked flow URL alone
> returns nothing useful.

**Problem:** from Section 3 onwards (company details, registration numbers,
insurance, bank details) the answers really come from the supplier. In the
old Excel process the requester just emailed the workbook to the supplier.
Requesters either chase suppliers by email ad hoc (slow back-and-forth) or
guess. External suppliers cannot sign into the Trust tenant, so a supplier
portal is out of scope for v1 (see §4b rule 5).

**Recommended v1 approach — "Supplier Information Pack" via Microsoft Forms:**

1. Create one **Microsoft Form** (anonymous responses allowed — works for
   external suppliers, no licence/auth needed) mirroring the
   supplier-answerable fields of Sections 3–6: company/trading name,
   registered address, CRN/VAT/charity no., contact details, insurance,
   DUNS, CIS, bank details are **deliberately excluded** (bank details must
   arrive on letterhead per the existing control — the form says so and
   tells the supplier to attach/send the letterhead to the requester).
2. First question of the form: **"Reference code (given to you by the Trust
   requester)"** — the requester's draft/QUEST reference ties the response
   back.
3. A small flow (**F8 — Supplier pack received**): trigger "When a new
   response is submitted" → email the structured answers to the requester
   (matched by the requester email captured in the form or simply to the
   requester who is told to include their own email in the reference
   question) → optionally also write a row to a **SSF-SupplierPacks** list
   keyed by reference code.
4. **Requester stays accountable:** they transcribe/verify the pack into the
   real form (v1). The form UI can later prefill from SSF-SupplierPacks by
   reference code (v1.5, via the Graph provider) — same pattern as CRN
   autofill.
5. This kills the email back-and-forth without creating a second source of
   truth: the SSF submission remains the record; the pack is an input aid.
   Fraud controls unchanged — CRN/VAT verification and the AP letterhead
   cross-check still run on whatever the requester submits.

**Rejected alternatives:** Azure AD guest accounts per supplier (heavy IT
dependency, per-supplier onboarding — revisit for v2 contract negotiation);
emailing editable Excel again (no validation, no audit, re-keying errors);
letting requesters share their signed-in session with suppliers (never).
