# Browser-Agent Playbook — SharePoint & Power Automate Build

**Purpose:** paste-ready task prompts for Claude in the browser (Claude for Chrome)
to execute the build order in `06-hybrid-sharepoint-flows.md`.
**How to use:** sign in to SharePoint/Power Automate yourself first, then give the
agent ONE task at a time, in order. Review what it did before moving to the next task.
Stay at the screen — it may need you to approve permission dialogs.

**Site:** a **NEW dedicated private Team site** named `NHS-Supplier-Forms` (have the
URL ready and include it in every prompt).

> **Site decision (July 2026):** earlier SSF scaffolding (SupplierSubmissions,
> AuditTrail List, QuestionnaireResponses, SupplierDocuments/SensitiveDocuments)
> exists on the shared legacy hub `/sites/R1H_FIN_Legacy_Procurement`. **Do not
> build there**: site-level access is broad (unacceptable for SensitiveDocuments),
> the hub is a legacy/migration target, and its lists follow the retired Express-era
> schema. Build everything fresh on the new private site; leave the hub artifacts
> untouched as reference. If real ID documents or letterheads already exist in the
> hub's SensitiveDocuments, move them to the new site's library and delete the hub
> copies. Create the site via SharePoint start page → Create site → Team site →
> Private; if self-service creation is disabled, raise a service-desk request for a
> private Team site named NHS-Supplier-Forms with the SSF owner as site owner.

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
> My SharePoint site URL is: [PASTE SITE URL]. Confirm you're ready and I'll paste
> the first task.

---

## Task 0 — Inventory the EXISTING site first (do this before anything else)

The site already contains structure built earlier (document libraries, questionnaire
response lists, audit lists, …). **Do not create duplicates and do not delete
anything yet.** The app and flows need lists with EXACT names, columns and choice
values — near-matches silently break the workflow. Run this inventory, then compare
the output against Tasks 1, 2 and 2b to decide per item: matches exactly → keep;
close but wrong names/values → we align it; not in the design → leave untouched for
now (decide later whether it stays as legacy reference).

> Go to Site contents on the SharePoint site at [PASTE SITE URL] and produce a
> complete inventory WITHOUT changing anything:
> For every LIST: its exact name, and for each column the exact internal name,
> type, and (for Choice columns) every choice value exactly as spelled.
> For every DOCUMENT LIBRARY: its exact name, its folder structure one level deep,
> and whether it has unique permissions (Settings → Permissions: does it say
> "unique permissions" or "inherits"?).
> Also list the site's groups (Site settings → People and groups) with their
> names and permission levels.
> Present all of this as a structured report. Do not create, rename, delete or
> edit anything in this task.

**You do afterwards:** paste the report back to Claude Code (in VS Code) to get a
keep / align / rebuild decision per item before starting Task 1.

---

## Task 1 — Create the SSF-Submissions list

> On the SharePoint site at [PASTE SITE URL], create a new blank list called
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

> On the SharePoint site at [PASTE SITE URL], create a new blank list called
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

> On the SharePoint site at [PASTE SITE URL], create a new blank list called
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

## Task 3 — Create the six SharePoint groups and set permissions

> On the SharePoint site at [PASTE SITE URL], go to Site settings → Site permissions
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
> Trigger: SharePoint "When an item is created", site [PASTE SITE URL], list
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
> Trigger: SharePoint "When an item is created or modified", site [PASTE SITE URL],
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
> Authentication: Basic, Username: [PASTE COMPANIES HOUSE API KEY], Password: leave blank.
>
> Action 2: **Response** —
> Status code: `@{outputs('HTTP')['statusCode']}`,
> Headers: `Access-Control-Allow-Origin` = `*` and `Content-Type` = `application/json`,
> Body: `@{body('HTTP')}`.
> Then open this Response action's **Configure run after** settings and tick BOTH
> "is successful" AND "has failed" (the HTTP action fails on a 404 company-not-found,
> and the response must still be returned to the app).
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