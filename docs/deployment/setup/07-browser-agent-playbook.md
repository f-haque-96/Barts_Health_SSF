# Browser-Agent Playbook — SharePoint & Power Automate Build

**Purpose:** paste-ready task prompts for Claude in the browser (Claude for Chrome)
to execute the build order in `06-hybrid-sharepoint-flows.md`.
**How to use:** sign in to SharePoint/Power Automate yourself first, then give the
agent ONE task at a time, in order. Review what it did before moving to the next task.
Stay at the screen — it may need you to approve permission dialogs.

**Site:** the dedicated private Team site **"Supplier Setup Form"** (ticket 7999685,
created July 2026): `https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS`
The URL is already filled into every task below. The site started **fresh and
empty** — every list, library and group below gets created from scratch, in task
order.

> **Site decision (July 2026):** earlier SSF scaffolding (SupplierSubmissions,
> AuditTrail List, QuestionnaireResponses, SupplierDocuments/SensitiveDocuments)
> exists on the shared legacy hub `/sites/R1H_FIN_Legacy_Procurement`. **Do not
> build there**: site-level access is broad (unacceptable for SensitiveDocuments),
> the hub is a legacy/migration target, and its lists follow the retired Express-era
> schema. Leave the hub artifacts untouched as reference. If real ID documents or
> letterheads already exist in the hub's SensitiveDocuments, move them to the new
> site's library and delete the hub copies.

## Getting set up with Claude in Chrome

1. Install the **Claude for Chrome** extension (claude.ai/chrome) and sign in.
   *NHS-managed browsers sometimes block extension installs — if so, ask IT to allow
   it, or simply follow each task below yourself by hand; they are written to work
   either way.*
2. Open your SharePoint site (or Power Automate for Tasks 4–10) in the tab and sign
   in yourself first — never give the agent your password.
3. Paste the **kickoff prompt** below once per session, then paste ONE task block at
   a time. Run each task's "**You check afterwards**" step yourself before moving on.

**Kickoff prompt (paste first, fill in the site URL):**

> You are helping me build SharePoint lists and Power Automate flows for an NHS
> supplier onboarding workflow. I will paste one task at a time. Rules:
> (1) Work only in this tab, on the site/environment I have opened.
> (2) Follow each task EXACTLY — column names, choice values, flow expressions and
> trigger conditions are case-sensitive identifiers used by application code, so
> copy them character-for-character; never rename, reformat, "improve" or add
> anything that isn't in the task.
> (3) If a screen, menu or option doesn't match what the task describes, STOP and
> describe what you see instead of guessing.
> (4) When a task is finished, list exactly what you created or changed so I can
> verify it before we continue.
> (5) Never enter credentials or secrets yourself — pause and ask me to type them.
> My SharePoint site URL is: https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS. Confirm you're ready and I'll paste
> the first task.

---

## Task 0 — Inventory the existing site (SKIP — not needed on a fresh site)

*Retired July 2026: this task existed to survey the legacy hub's old scaffolding.
The build now happens on the brand-new empty "Supplier Setup Form" site, so there is
nothing to inventory. Start at Task 1. Task order: 1 → 2 → 2b → 2c → 3 on
SharePoint, then 4 → 5 → 6 → 7 → 8 → 9 → 10 in Power Automate.*

---

## Task 1 — Create the SSF-Submissions list

> On the SharePoint site at https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS, create a new blank list called
> **SSF-Submissions**. Then add these columns exactly (the default Title column stays
> and will hold the Submission ID):
>
> 1. **Status** — Choice column, choices (one per line, exact lowercase):
>    `pending_review`, `info_required`, `approved`, `procurement_approved_opw`,
>    `pending_contract`, `contract_uploaded`, `pending_ap_control`, `completed`,
>    `completed_payroll`, `inside_ir35_sds_issued`, `rejected`.
>    Default value: pending_review. Do NOT allow fill-in choices.
> 2. **CurrentStage** — Choice column, choices: `pbp`, `procurement`, `opw`,
>    `contract`, `ap`, `completed`, `completed_payroll`, `sds_issued`, `rejected`.
>    Default: pbp. No fill-in.
> 3. **LastStatus** — Single line of text.
> 4. **StatusChangedAt** — Date and time (include time).
> 5. **RequesterName**, **RequesterEmail**, **RequesterDept** — Single line of text.
> 6. **CompanyName**, **TradingName** — Single line of text.
> 7. **SupplierType** — Choice: `limited_company`, `partnership`, `charity`,
>    `sole_trader`, `public_sector`. No fill-in.
> 8. **CRN**, **VATNumber**, **CharityNumber** — Single line of text.
> 9. **ServiceCategory** — Choice: `clinical`, `non-clinical`. No fill-in.
> 10. **OutcomeRoute** — Choice: `oracle_ap`, `payroll_esr`. No default. No fill-in.
> 11. **AlembaReference**, **VendorNumber** — Single line of text.
> 12. **FormDataJSON**, **PBPReviewJSON**, **ProcurementReviewJSON**, **OPWReviewJSON**,
>     **ContractReviewJSON**, **APReviewJSON** — Multiple lines of text, PLAIN text
>     (not rich text), 6 lines for editing is fine.
> 13. **SubmissionType** — Choice: `full`, `questionnaire`. Default `full`. No fill-in.
>     (Section 2 pre-screening questionnaires arrive as their own items with
>     QUEST- reference numbers.)
> 14. **AwaitingParty** — Choice: `none`, `requester`, `pbp`. Default `none`.
>     No fill-in. (Set by the app during info-required conversations; flow F6
>     watches it so PBP get an email when the requester responds.)
>
> Then in List settings: turn versioning ON, turn attachments OFF, and add an index
> on the CompanyName column. Confirm each column name matches exactly — they are
> case-sensitive identifiers used by code and flows.

**You check afterwards:** column names spelled exactly as above; Status choices are
lowercase with underscores; FormDataJSON is plain text not rich text.

---

## Task 2 — Create the SSF-AuditTrail list

> On the SharePoint site at https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS, create a new blank list called
> **SSF-AuditTrail**. The Title column will hold the Submission ID. Add columns:
>
> 1. **ActionType** — Single line of text.
> 2. **PerformedBy** — Single line of text.
> 3. **PreviousStatus** — Single line of text.
> 4. **NewStatus** — Single line of text.
> 5. **Details** — Multiple lines of text, plain text.
>
> Turn versioning ON and attachments OFF in List settings.

(Restricting edit/delete to SSF-Admin happens in Task 3, after the groups exist.)

---

## Task 2b — Create the SSF-BankDetails list (Option B, decided July 2026)

Typed bank details from Section 6 live here — and ONLY here — so AP Control can
cross-check them against the letterhead (past discrepancies have caught errors).

> On the SharePoint site at https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS, create a new blank list called
> **SSF-BankDetails**. The Title column will hold the Submission ID. Add columns,
> all Single line of text: **NameOnAccount**, **SortCode**, **AccountNumber**,
> **IBAN**, **SWIFTCode**, **BankRouting**.
>
> Turn versioning ON and attachments OFF.

**You do afterwards (needs Task 3's groups to exist):** open the list → Settings →
Permissions for this list → Stop inheriting permissions → remove everything except
**SSF-APControl** (Contribute) and **SSF-Admin** (Full control). Nobody else — not
even the other reviewer groups — should appear.

---

## Task 2c — Create the two document libraries

The fresh site has no libraries yet; Task 3 sets permissions on them, so this must
run first. **Do not pre-create any folders** — the app and flows create one folder
per submission (`SupplierDocuments/SUP-…/`, `SensitiveDocuments/SUP-…/`) at upload
time. (The per-document-type folder scheme in the old `03-sharepoint.md` guide is
retired — do not follow it.)

> On the SharePoint site at https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS, create two new document libraries:
>
> 1. **SupplierDocuments** — description: `Business documents, one folder per
>    submission - certificates, contracts, insurance, exchange attachments`.
> 2. **SensitiveDocuments** — description: `RESTRICTED - ID documents and bank
>    letterheads, one folder per submission. Never create sharing links.`
>
> On **SensitiveDocuments** only, add one column: **DocumentType** — Single line of
> text. (A flow filters on this column to auto-delete ID documents when a request
> closes; the app fills it in when uploading.)
>
> In each library's settings turn versioning ON. Create no folders and change no
> permissions in this task — permissions are Task 3.

**You check afterwards:** both libraries appear in Site contents with those exact
names (no space in `SupplierDocuments`/`SensitiveDocuments`); DocumentType exists on
SensitiveDocuments; no folders inside either.

---

## Task 3 — Create the six SharePoint groups and set permissions

> On the SharePoint site at https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS, go to Site settings → Site permissions
> → Advanced permissions settings, and create six SharePoint groups:
> **SSF-PBP**, **SSF-Procurement**, **SSF-OPW**, **SSF-Contract**, **SSF-APControl**,
> **SSF-Admin**. For each group: owner = SSF-Admin (create SSF-Admin first),
> "Who can view membership" = Group Members, "Who can edit membership" = Group Owner.
> Grant SSF-Admin **Full Control** on the site. Grant the other five groups
> **Contribute** on the site.
>
> Then on the **SSF-AuditTrail** list: stop inheriting permissions, and change the
> five non-admin groups' permission so they can ADD items but not edit or delete
> them (use the Contribute level minus edit/delete — if a custom permission level is
> needed, create one called "Add Only" with: Add Items, View Items, View Pages,
> Open). SSF-Admin keeps Full Control.
>
> Then on the **SensitiveDocuments** library: stop inheriting permissions and remove
> all groups except **SSF-Contract**, **SSF-APControl** (Contribute) and **SSF-Admin**
> (Full Control). On BOTH document libraries (SupplierDocuments and
> SensitiveDocuments), disable "Anyone" and company-wide sharing links if the
> library settings allow it.

**You do afterwards (agent can't decide this):** add the actual people to each group.
Members list is in §3 of `06-hybrid-sharepoint-flows.md`.

---

## Task 4 — Flow F1: new submission notifies PBP

> In Power Automate (make.powerautomate.com), create a new Automated cloud flow
> named **SSF F1 - New submission to PBP**.
>
> Trigger: SharePoint "When an item is created", site https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS, list
> SSF-Submissions.
>
> Action 1: Outlook "Send an email (V2)" to **pbp-panel@nhs.net**.
> Subject: `New supplier request [Title] — [CompanyName]` (use dynamic content for
> Title and CompanyName). Body: requester name (RequesterName dynamic content),
> company name, and this review link with the Title appended:
> `https://APP-URL-TBC/pbp-review/[Title]`. Do not include any other form data.
>
> Action 2: SharePoint "Create item" on list SSF-AuditTrail:
> Title = Title from trigger, ActionType = `SUBMISSION_CREATED`,
> PerformedBy = RequesterEmail from trigger, NewStatus = `pending_review`.
>
> Action 3: SharePoint "Update item" on the triggering SSF-Submissions item, setting
> ONLY these two fields: LastStatus = `pending_review`, StatusChangedAt = utcNow().
> (This initialises the loop guard that flow F2 relies on.)
>
> Save and leave the flow ON.

---

## Task 5 — Flow F2: status router (the important one)

> In Power Automate, create an Automated cloud flow named **SSF F2 - Status router**.
>
> Trigger: SharePoint "When an item is created or modified", site https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS,
> list SSF-Submissions. Open the trigger's Settings and add this Trigger Condition
> exactly, on one line (the `/Value` suffix and the empty() check are both mandatory —
> Status is a Choice column and F1 owns the creation event):
> `@and(not(empty(triggerOutputs()?['body/LastStatus'])), not(equals(triggerOutputs()?['body/Status/Value'], triggerOutputs()?['body/LastStatus'])))`
>
> Action 1 (MUST be first — it prevents infinite loops): Initialize variable
> **PrevStatus** (String) = the LastStatus field from the trigger.
> Action 2: SharePoint "Update item" on the triggering item, setting
> LastStatus = the current Status value and StatusChangedAt = utcNow().
> Leave every other field untouched (only fill those two).
>
> Action 3: a **Switch** on the Status value with these cases — each case sends one
> Outlook "Send an email (V2)" containing the Submission ID (Title), CompanyName,
> RequesterName and a link `https://APP-URL-TBC/<page>/[Title]`, and nothing else:
>
> | Status equals | Send to | Subject | link page |
> |---|---|---|---|
> | approved | see NOTE below — Condition on SubmissionType | PBP approved | procurement-review |
> | procurement_approved_opw | opw-panel@nhs.net | OPW / IR35 determination required | opw-review |
> | pending_ap_control | ap-control@nhs.net | Verify bank details and create vendor | ap-review |
> | pending_contract | peter.persaud@nhs.net | Agreement required | contract-drafter |
> | contract_uploaded | ap-control@nhs.net | Contract uploaded — final verification | ap-review |
> | completed | RequesterEmail (dynamic) | Supplier set up — vendor [VendorNumber] created | (no link needed) |
> | completed_payroll | RequesterEmail | Outcome: payroll/ESR route — no supplier record | (no link) |
> | inside_ir35_sds_issued | RequesterEmail | Inside IR35 — SDS issued | (no link) |
> | rejected | RequesterEmail | Supplier request rejected | respond |
> | info_required | RequesterEmail | More information needed — respond via the link | respond |
>
> NOTE on link pages: these must match the React routes exactly. The contract page is
> `/contract-drafter/` (NOT `contract-review`), and requester-facing emails use
> `/respond/[Title]` so the requester can view the decision and reply.
>
> NOTE on the `approved` case: inside it, add a **Condition** on SubmissionType.
> If `full` → email procurement@nhs.net ("PBP approved — classification needed",
> link procurement-review). If `questionnaire` → email the RequesterEmail instead:
> "Your pre-screening questionnaire is approved — upload the attached certificate
> at question 2.8 to continue your supplier form", attaching the approval
> certificate file from `SupplierDocuments/[Title]/` (Get file content). The
> `rejected` case needs no split — it already emails the requester, which is
> correct for both types.
>
> Final action (after the Switch, runs always): SharePoint "Create item" on
> SSF-AuditTrail: Title = Title, ActionType = `STATUS_CHANGED`,
> PreviousStatus = the PrevStatus variable, NewStatus = current Status,
> PerformedBy = Editor email from the trigger.
>
> Save and leave ON.

**You check afterwards:** the trigger condition is present (open trigger → Settings),
and the Update-item action is the first thing that runs. Without both, this flow
emails everyone in an infinite loop.

---

## Task 6 — Flow F3: auto-delete ID documents

> In Power Automate, create an Automated cloud flow named
> **SSF F3 - Delete ID documents on completion**.
>
> Trigger: SharePoint "When an item is created or modified" on SSF-Submissions,
> with Trigger Condition:
> `@and(not(equals(triggerOutputs()?['body/Status/Value'], triggerOutputs()?['body/LastStatus'])), or(equals(triggerOutputs()?['body/Status/Value'], 'completed'), equals(triggerOutputs()?['body/Status/Value'], 'completed_payroll'), equals(triggerOutputs()?['body/Status/Value'], 'inside_ir35_sds_issued'), equals(triggerOutputs()?['body/Status/Value'], 'rejected')))`
>
> Action 1: SharePoint "Get files (properties only)" on the **SensitiveDocuments**
> library, folder = the submission's folder (path `SensitiveDocuments/[Title]`),
> filtering to files whose DocumentType is passport, licence-front or licence-back
> (if no DocumentType column exists, filter filenames containing `passport` or
> `licence`).
> Action 2: Apply to each file → SharePoint "Delete file".
> Action 3: Create item on SSF-AuditTrail: Title = Title,
> ActionType = `ID_DOCUMENTS_DELETED`, PerformedBy = `flow:F3`,
> Details = number of files deleted.
>
> Save and leave ON.

---

## Task 7 — Flow F4: Monday stuck-items digest

> In Power Automate, create a Scheduled cloud flow named
> **SSF F4 - Weekly stuck items digest**, recurrence every Monday 08:00 UK time.
>
> Action 1: SharePoint "Get items" on SSF-Submissions with OData filter:
> `(startswith(Status, 'pending') or Status eq 'approved' or Status eq 'procurement_approved_opw' or Status eq 'info_required') and StatusChangedAt lt '@{addDays(utcNow(), -5)}'`
> Action 2: Create an HTML table from the results (Title, CompanyName, Status,
> StatusChangedAt).
> Action 3: Send one email containing the table to procurement@nhs.net with the
> subject `SSF weekly digest — items waiting more than 5 days`, CC the SSF-Admin
> members.
>
> Save and leave ON. (Per-team grouped emails can be added later — one combined
> digest is fine to start.)

---

## Task 8 — CRN proxy flow: Companies House lookup (PREMIUM connector)

Uses the premium "When an HTTP request is received" trigger — the flow must be owned
by the account holding the Power Automate Premium licence. The Companies House API
key stays inside the flow and never ships in the browser app.

Get a free API key first at https://developer.company-information.service.gov.uk
(register an application, type "REST", note the key).

> In Power Automate, create an Instant cloud flow named
> **SSF CRN - Companies House proxy** with the trigger
> **"When an HTTP request is received"**.
>
> On the trigger: set **Method = GET**, and "Who can trigger the flow" = Anyone.
> No request body schema is needed (the CRN arrives as a query parameter).
>
> Action 1: **HTTP** —
> Method: GET,
> URI: `https://api.company-information.service.gov.uk/company/@{triggerOutputs()['queries']['crn']}`,
> Authentication (under advanced options): **None**. Instead add a Header:
> key `Authorization`, value = this expression (fx button):
> `concat('Basic ', base64('[PASTE COMPANIES HOUSE API KEY]:'))`
> — keep the trailing colon inside the quotes; it encodes the required empty
> password. (Do NOT use the built-in Basic authentication: Companies House wants
> a blank password and Power Automate refuses to save one — the flow then fails
> validation at runtime and every call returns 502 NoResponse. Fixed 8 Jul 2026.)
>
> Action 2: **Response** —
> Status code: `@{outputs('HTTP')['statusCode']}`,
> Headers: `Access-Control-Allow-Origin` = `*` and `Content-Type` = `application/json`,
> Body: `@{body('HTTP')}`.
> Then open this Response action's **Configure run after** settings and tick BOTH
> "is successful" AND "has failed" (the HTTP action fails on a 404 company-not-found,
> and the response must still be returned to the app). Use the CHECKBOXES only —
> then verify in code view that runAfter reads exactly `["Succeeded","Failed"]`;
> a hand-written `"FAILED"` is silently ignored and the Response gets Skipped,
> which surfaces as 502 NoResponse to the caller (hit 8 Jul 2026).
>
> Save, then copy the generated **HTTP GET URL** from the trigger.

**You do afterwards:** paste the copied URL into the app's build configuration as
`VITE_CRN_FLOW_URL` (Azure Static Web Apps → Configuration, or `.env.local` for local
testing). Treat the URL as semi-secret — it contains its own access signature — but
note only public Companies House register data passes through it. If the URL is ever
abused, regenerate it on the trigger and update the app config.

**Test:** paste the URL into a browser with `&crn=00000006` appended — you should get
company JSON back. Try a nonsense CRN and confirm you get a 404.

---

## Task 9 — Flow F6: notify PBP when a requester responds

Without this flow, an info-required conversation stalls silently: the requester's
reply does not change Status, so F2 never fires and PBP only find out via the
Monday digest.

> In Power Automate, create an Automated cloud flow named **SSF F6 - Requester
> responded** with trigger SharePoint "When an item is created or modified" on
> SSF-Submissions, and this Trigger Condition (one line):
> `@and(equals(triggerOutputs()?['body/Status/Value'], 'info_required'), equals(triggerOutputs()?['body/AwaitingParty/Value'], 'pbp'))`
>
> Action 1 (loop guard, MUST be first): SharePoint "Update item" on the triggering
> item setting ONLY AwaitingParty = `none`.
> Action 2: Send an email (V2) to pbp-panel@nhs.net — subject
> "Requester has responded - [Title]", body containing Title, CompanyName,
> RequesterName and the link `https://APP-URL-TBC/pbp-review/[Title]`.
> Action 3: SharePoint "Create item" on SSF-AuditTrail: Title = Title,
> ActionType = `REQUESTER_RESPONDED`, PerformedBy = RequesterEmail.
>
> Save and leave ON.

The app sets AwaitingParty = `requester` when PBP request information and
`pbp` when the requester submits a response (Graph provider, delivery-plan
step 4).

---

## Task 10 — VAT proxy flow: HMRC "Check a UK VAT number" (PREMIUM connector)

Same pattern as Task 8: the flow holds the HMRC credentials; the app only knows the
flow URL (`VITE_VAT_FLOW_URL`). The HMRC client secret must NEVER go into the app,
the repo, or an email. Contract verified against the HMRC sandbox (July 2026):
lookups take a **9 or 12 digit** VRN (no GB prefix — the app strips it).

> In Power Automate, create an Instant cloud flow named
> **SSF VAT - HMRC check proxy** with the trigger
> **"When an HTTP request is received"**: Method = GET, Who can trigger = Anyone.
>
> Action 1: **HTTP** — Method: POST,
> URI: `https://test-api.service.hmrc.gov.uk/oauth/token`,
> Headers: `Content-Type` = `application/x-www-form-urlencoded`,
> Body: `grant_type=client_credentials&client_id=[HMRC CLIENT ID]&client_secret=[HMRC CLIENT SECRET]`
>
> Action 2: **HTTP 2** — Method: GET,
> URI: `https://test-api.service.hmrc.gov.uk/organisations/vat/check-vat-number/lookup/@{triggerOutputs()['queries']['vrn']}`,
> Headers: `Authorization` = `Bearer @{body('HTTP')?['access_token']}` and
> `Accept` = `application/vnd.hmrc.2.0+json`
>
> Action 3: **Response** —
> Status code: `@{outputs('HTTP_2')['statusCode']}`,
> Headers: `Access-Control-Allow-Origin` = `*` and `Content-Type` = `application/json`,
> Body: `@{body('HTTP_2')}`.
> Open Configure run after on this Response action and tick BOTH "is successful"
> AND "has failed" (a 404 not-found fails the HTTP 2 action but must still reach
> the app).
>
> Save, then copy the generated **HTTP GET URL** from the trigger.

**You do afterwards:** paste the URL into the app configuration as
`VITE_VAT_FLOW_URL`. **Test** in a browser with `&vrn=553557881` appended — the
sandbox returns "Credite Sberger Donal Inc."; a nonsense VRN returns 404.

**Before production go-live:** (1) regenerate the client secret on the HMRC
developer hub (sandbox secrets that have been shared around should not carry over),
(2) request production credentials for the application there, and (3) change both
URIs from `test-api.service.hmrc.gov.uk` to `api.service.hmrc.gov.uk`.

---

## Task 11 — Claim columns + Flow F7: review-assignment email

Supports the PBP claim feature (added July 2026 — PBP has 4–5 members): the first
PBP member to open a pending item gets it assigned (the app stamps the claim), other
members see a "Being reviewed by…" banner, and this flow emails the claimer a
confirmation with the direct link so the item sits in their personal inbox as their
to-do.

> On the SharePoint site at
> https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS, add four
> columns to the existing **SSF-Submissions** list (do not touch any other column):
>
> 1. **ClaimedBy** — Single line of text. (Will hold the claimer's email.)
> 2. **ClaimedByName** — Single line of text.
> 3. **ClaimedAt** — Date and time (include time).
> 4. **ClaimNotified** — Single line of text. (Loop guard for the flow below.)
>
> Then in Power Automate, create an Automated cloud flow named
> **SSF F7 - Review assigned** with trigger SharePoint "When an item is created or
> modified" on SSF-Submissions, and this Trigger Condition (one line):
> `@and(not(empty(triggerOutputs()?['body/ClaimedBy'])), not(equals(triggerOutputs()?['body/ClaimedBy'], triggerOutputs()?['body/ClaimNotified'])))`
>
> Action 1 (loop guard, MUST be first): SharePoint "Update item" on the triggering
> item setting ONLY ClaimNotified = the ClaimedBy value from the trigger.
> Action 2: Send an email (V2) with To = ClaimedBy (dynamic content), subject
> `Assigned to you: [Title] — [CompanyName]`, body: "You opened this item first, so
> it is assigned to you. Review it here:" followed by the link
> `https://APP-URL-TBC/pbp-review/[Title]` (dynamic Title). Nothing else in the body.
>
> Save and leave ON.

**Note:** the app only writes ClaimedBy/ClaimedAt in production (via the Graph
provider) — in dev/demo mode claims stay in the browser, so this flow will not fire
until the app is connected to SharePoint. Build it now anyway so it's ready.

---

## Task 12 — Split PBP routing by service category (decided July 2026)

Clinical and non-clinical questionnaires are reviewed by different PBP people, so
the two flows that email PBP (F1 new-submission and F6 requester-responded) each
get a Condition on ServiceCategory. All addresses stay as the test address until
go-live — see the mailbox swap table below.

> In Power Automate, open **SSF F1 - New submission to PBP** and edit it:
> Add a **Condition** action immediately after the trigger, before the existing
> "Send an email (V2)" action. Condition: the **ServiceCategory Value** dynamic
> content from the trigger **is equal to** `clinical` (lowercase, exact).
> Move the existing "Send an email (V2)" action into the **If yes** branch.
> In the **If no** branch, add a new "Send an email (V2)" with the identical
> To, Subject and Body (same dynamic content).
> Leave the existing "Create item" (audit) and "Update item" (LastStatus) actions
> AFTER the Condition block, outside both branches, unchanged.
> Save.
>
> Then open **SSF F6 - Requester responded** and make the same change: add the
> same ServiceCategory-equals-clinical Condition before its email, move the
> existing email into If yes, duplicate it into If no, leave the loop-guard
> Update item as the FIRST action and the audit Create item outside the
> Condition. Save both flows and leave them ON.

**You check afterwards:** in both flows the audit/update actions sit outside the
Condition (they must run for every category), and in F6 the AwaitingParty
loop-guard Update item is still the first action.

---

## Go-live mailbox swap table

During testing every fixed recipient is **fahimul.haque1@nhs.net**. At go-live,
swap them per this table (one pass through each flow; dynamic recipients like
RequesterEmail and ClaimedBy never change):

| Flow | Branch / case | Final recipient |
|---|---|---|
| F1 | Condition If yes (clinical) | PBP clinical shared mailbox *(requested, TBC)* |
| F1 | Condition If no (non-clinical) | PBP non-clinical shared mailbox *(requested, TBC)* |
| F2 | approved + SubmissionType=full | `barts.procurement@nhs.net` |
| F2 | procurement_approved_opw | `bartshealth.opwpanelbarts@nhs.net` |
| F2 | pending_ap_control, contract_uploaded | `apcontrol.bartshealth@nhs.net` |
| F2 | pending_contract | Contract drafter mailbox *(requested, TBC — interim: named drafter)* |
| F4 | digest email | `barts.procurement@nhs.net`, CC SSF admins |
| F6 | If yes / If no | PBP clinical / non-clinical mailboxes (as F1) |
| F7 | assignment email | no change — dynamic ClaimedBy |

Note: `barts.procurement@nhs.net` is the Alemba-linked procurement helpdesk —
emails to it may raise service-desk tickets. Decide before go-live whether the
Monday F4 digest should raise a weekly ticket (may be useful for tracking, may be
noise); if noise, request a plain shared mailbox for the digest instead.

---

## After all tasks: add co-owners

> In Power Automate, open each of the five SSF flows, and under Edit owners add
> [SECOND PERSON'S NAME/EMAIL] as a co-owner. (Anyone editing or co-owning the
> Task 8 CRN flow also needs a Premium licence.)

A flow owned by one personal account stops working if that account is disabled —
this is risk #4 in the DPIA.

---

## Test before relying on it

Run the test matrix in §6 of `06-hybrid-sharepoint-flows.md`: create one dummy item
in SSF-Submissions by hand, then change its Status through each branch and confirm
the right mailbox gets the right email, the audit list grows, and F3 deletes a dummy
file from SensitiveDocuments. List triggers poll every 1–5 minutes — wait before
assuming a flow failed.