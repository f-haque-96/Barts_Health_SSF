# Deployment Readiness Review — NHS SSF Hybrid Architecture

**Date:** 2 July 2026 | **Reviewer:** Claude (automated code + docs review)
**Scope:** repo at commit `d3e6299`, hybrid architecture per
`docs/NHS_SSF_Platform_Decision_Addendum.md` and `docs/deployment/setup/06-hybrid-sharepoint-flows.md`
**Rule respected:** no code changed in this pass. Findings only.

> **UPDATE — remediation pass, 2 July 2026 (same day):** the following findings were
> fixed after review sign-off from the owner:
> - **B1 (partially)**: all review pages, RequesterResponsePage and QuestionnaireModal
>   now read/write submissions via `storage.getSubmission / updateSubmission /
>   saveSubmission`; localStorage summary/audit side-writes are wrapped in
>   `import.meta.env.DEV`. *Still open: the Graph/SharePoint provider itself (needs the
>   App Registration to integration-test) — see B2/B3.*
> - **B4 / S7**: 06 + 07 now use the correct `body/Status/Value` trigger condition
>   with an `empty(LastStatus)` creation guard; F1 initialises `LastStatus`.
> - **B5 / S8**: contract deep link corrected to `/contract-drafter/`; requester
>   `rejected` / `info_required` emails now carry a `/respond/` link.
> - **B6**: decided — Power Automate HTTP-trigger flow proxy (owner holds a Premium
>   licence). `companiesHouse.js` calls `VITE_CRN_FLOW_URL` (CORS-safe GET), degrades
>   to manual verification if unset; build instructions added as playbook **Task 8**;
>   addendum §2.3 premium-connector claim corrected.
> - **B7**: `staticwebapp.config.json` added (SPA navigation fallback + headers).
> - **D3**: `.env.production` renamed to `.env.production.example` and git-ignored.
> - **S9**: CI backend steps marked `continue-on-error` (frozen code no longer blocks
>   frontend releases).
> Verified: `npm run lint` (0 errors) and `npm run build` pass after all changes.
> Still open: B2/B3 (Graph provider + MSAL — gated on IT), B8 (demo build flag —
> owner deciding), D1 (bundle splitting), S1–S6, S10.

---

## 1. UNDERSTAND — architecture and deployment path (in my own words)

The SSF is a React 19 SPA (Vite, Zod 4 validation, Zustand store, react-hook-form) that
takes a requester through a 7-section supplier setup form, then routes the submission
through a five-stage human review pipeline: PBP → Procurement → (optionally OPW/IR35 →
Contract Drafter) → AP Control, with terminal outcomes `completed` (Oracle vendor),
`completed_payroll` / `inside_ir35_sds_issued` (ESR route, no supplier record), and
`rejected`. The canonical status vocabulary lives in `src/utils/workflowStatus.js` and
is deliberately mirrored 1:1 by the SharePoint Status/CurrentStage choice columns and
the Power Automate F2 switch.

The original plan (Solution Overview, May 2026) was a custom Express/SQL backend. The
June 2026 addendum retires that stack before it ever ships: the `supplier-form-api/`
folder is frozen in-repo, and production becomes **React SPA on Azure Static Web Apps →
Microsoft Graph (delegated, ideally `Sites.Selected`) → two SharePoint lists
(SSF-Submissions, SSF-AuditTrail) + two document libraries**, with five Power Automate
flows (F1 new-submission, F2 status router, F3 sensitive-doc deletion, F4 weekly
digest, F5 optional audit reconciliation) doing notifications and lifecycle actions.
RBAC moves from AD security groups to six SharePoint groups. The single stated
remaining IT dependency is one SPA App Registration so staff can sign in and the app
can call Graph on their behalf.

Today the app runs fully only in **dev/demo mode**: mock auth (`devAuth.js`),
submissions and review decisions in browser localStorage. The bridge to production is
delivery-plan step 4 — "add a Graph/SharePoint storage provider" — plus the SharePoint/
flow build (steps 1–2, doable now) and the App Registration (step 3, IT).

That understanding drives the findings below: **the front-end form is genuinely done;
the storage/auth seam between the SPA and SharePoint is not, and it is wider than the
addendum implies.**

---

## 2. FAULT-FIND

### BLOCKERS

**B1. Review pages bypass StorageProvider entirely — the post-submission workflow is
dev-only.**
`Section7ReviewSubmit` correctly submits via `storage.saveSubmission()` and
`SecureReviewPage` correctly loads via `storage.getSubmission()`. But every **write**
made by a reviewer goes straight to `localStorage`:
- `PBPReviewPage.jsx:639` (and audit trail at :678, summary list at :723)
- `ProcurementReviewPage.jsx:238`
- `OPWReviewPage.jsx:316, :518, :611`
- `ContractDrafterReviewPage.jsx:104, :204`
- `APControlReviewPage.jsx:396, :473`
- `RequesterResponsePage.jsx:895`
- `QuestionnaireModal.jsx:191–214` (both read and write)

In production, a PBP approval would exist only in that reviewer's own browser. Nothing
would reach SharePoint, F2 would never fire, and the next reviewer's deep link would
show "Submission not found". Step 4 of the delivery plan is therefore not just "add a
provider class" — it is **rerouting ~35 direct localStorage call sites through the
provider interface** (and adding `updateSubmission`/`submitReview`-style methods the
pages currently don't call at all). This is the single largest outstanding work item
and should be sized as such. *(Per your instruction, I have not touched the
StorageProvider interface — this needs a design agreement first: one
`updateSubmission(id, patch)` call per decision vs. a per-stage `submitReview`.)*

**B2. The production branch of StorageProvider still targets the retired Express API.**
`StorageProvider.js:357–367`: any production build (`import.meta.env.PROD`)
instantiates `ApiStorageProvider`, whose every method assumes the Express server —
`/api/csrf-token`, `/api/session`, cookie credentials, `/api/reviews/<stage>/queue`,
`/api/companies-house/<crn>`, `/api/vendors/check`. There is no Graph provider yet. A
production build deployed today fails at boot: `getSession()` errors → `AuthContext`
sets `user = null` → every protected route dead-ends. Expected (it's step 4), but worth
stating plainly: **the current build artifact cannot be deployed to production at all.**

**B3. No Azure AD sign-in code exists — "unchanged code" in the addendum overstates.**
There is no `@azure/msal-browser` (or any auth library) in `package.json`; the
`VITE_AZURE_CLIENT_ID/TENANT_ID/REDIRECT_URI` variables in `.env.example` are read by
**nothing** in `src/`. Sign-in, token acquisition, and Graph calls are all net-new
code, not configuration. The addendum's step 4 covers this implicitly, but the
"complete React form is retained (unchanged code)" framing hides that auth is greenfield.

**B4. F2 trigger-condition drift between the two docs — one version causes the
infinite-loop it is meant to prevent.**
`06-hybrid-sharepoint-flows.md` §4/F2 gives
`@not(equals(triggerOutputs()?['body/Status'], triggerOutputs()?['body/LastStatus']))`
but Status is a **Choice** column, so `body/Status` is an object — it never equals the
`LastStatus` string, the condition is always true, and F2's own `LastStatus` update
re-triggers it forever (mass-emailing every mailbox). The playbook
(`07-browser-agent-playbook.md` Task 5) has the correct form, `body/Status/Value`.
Fix 06 to match 07, and note this in 06 §5 "Gotchas" — anyone building from 06 alone
builds the loop.

**B5. Contract Drafter deep link points at a route that doesn't exist.**
The app route is `/contract-drafter/:submissionId` (`App.jsx:263`). But 06 §4 states
links follow `https://<app-url>/<stage>-review/<SubmissionID>` and playbook Task 5 maps
`pending_contract` → link page `contract-review`. The Contract Drafter's email link
will 404 (SPA catch-all "Page Not Found"). Either add a `/contract-review/:id` alias
route or correct both docs to `/contract-drafter/`.

**B6. Companies House CRN verification has no production path in the hybrid
architecture.**
`companiesHouse.js:27–29` calls `${VITE_API_URL}/api/companies-house/<crn>` with a
`http://localhost:3001` fallback. The Express proxy that held the API key is retired,
and the key cannot ship in a public SPA. Options: (a) an HTTP-triggered Power Automate
flow as proxy — but HTTP request trigger is a **premium** connector, contradicting the
addendum's "no premium connectors required" claim (§2.3); (b) an Azure Static Web Apps
managed function (free tier includes managed Functions — probably the cleanest, but is
"a server" in governance terms); (c) degrade gracefully: make CRN lookup optional with
a manual-verification message. A decision is needed before step 4; the docs are silent.

**B7. Azure Static Web Apps SPA fallback config is missing.**
There is no `staticwebapp.config.json` in the repo. Without
`navigationFallback: { rewrite: "/index.html" }`, every deep link that matters —
`/pbp-review/SUP-...`, `/respond/...` — returns SWA's 404 instead of the app. Every
email link in F1/F2 would be broken on day one. One small file fixes it; it must exist
before step 5.

**B8. A deployed demo build is currently impossible (affects Part 3b).**
Provider selection is `isProduction || useApi → ApiStorageProvider`
(`StorageProvider.js:358–363`). `VITE_USE_API` can force the API in dev, but nothing
can force localStorage/demo mode in a **built** bundle. So the "deploy the front end
in demo mode for stakeholder UAT" path fails: any deployed build is PROD and dies per
B2. A one-line env flag (e.g. `VITE_DEMO_MODE=true` keeping `LocalStorageProvider`)
would unlock hosted demos — flagged here rather than changed, since it touches the
StorageProvider selection logic.

### SHOULD-FIX

**S1. AuthContext still assumes AD security groups that the addendum cancelled.**
`AuthContext.jsx:29–36` maps roles to `NHS-SupplierForm-*` AD groups ("must match the
AD security groups created by IT"). The addendum §4 replaces those with SharePoint
groups `SSF-*`. Deeper design gap: **SharePoint group membership does not appear in an
Azure AD token**, so the SPA cannot learn the user's role from sign-in alone — it must
query SharePoint (e.g. `GET /sites/{site}/... currentuser groups` via REST, or probe
list permissions). Neither the addendum nor 06 says how the SPA resolves roles. This
needs a design decision in step 4.

**S2. Substring status matching in access control grants cross-stage access.**
`AuthContext.jsx:124–148` uses `status.includes(...)`:
- `'approved'.includes('ap')` → **true**, so AP Control passes the check for
  PBP-approved submissions;
- `'procurement_approved_opw'.includes('approved')` → Procurement retains access after
  hand-off to OPW.
This is exactly the bug class already fixed in `StorageProvider.matchesStage`
(comment at `StorageProvider.js:79–83`). In the hybrid model all reviewer groups have
Contribute on the whole list, so this front-end check is the *only* stage gating —
replace with exact matches against `STAGE_QUEUE_STATUSES`. Same pattern (harmless but
sloppy) at `App.jsx:59` and `helpers.js:587` (`includes('rejected')`).

**S3. The Section 2 questionnaire loop is absent from the SharePoint design.**
`QuestionnaireModal` creates separate submissions with IDs like `QUEST-<timestamp>`
(`:151`), status `pending_review`, plus a non-canonical `'pending_approval'` on the
form-data copy (`:159`). 06 §2.1 has no questionnaire item type, no column to
distinguish questionnaire vs full submission, and the `QUEST-` format contradicts the
documented `SUP-YYYY-XXXXXXXX` Title format. F1 would email PBP "New supplier request"
for questionnaires too, with a link to `/pbp-review/QUEST-...` — which happens to be the
right page, but nothing in the list schema tells PBP it's a pre-screening
questionnaire. Decide: separate content type/column in SSF-Submissions, or exclude the
questionnaire from the hybrid scope for v1.

**S4. Requester responses never change the canonical Status — the info_required
round-trip stalls in the hybrid model.**
`RequesterResponsePage.jsx:867–903` records a response inside `pbpReview.exchanges` /
`contractDrafter.exchanges` (sub-statuses `'awaiting_pbp'`, `'negotiating'`,
`'contract_negotiating'` — none canonical) but leaves top-level `status` untouched. F2
only reacts to Status changes, so **no one is notified when a requester responds**;
the item sits until the Monday F4 digest. Options: introduce a canonical
`info_provided` status (breaking change — all three places per 06 §5), or have F2's
info_required case CC the PBP mailbox on item-modified events where exchanges grew.
Needs a decision before flows are built. *(Not fixed per your instruction — touches the
status model.)*

**S5. DPIA claim about localStorage is overstated by three code paths.**
DPIA §5 / risk 5: "bank details and document content are excluded from localStorage
persistence (code control in `src/stores/formStore.js`)". True for the draft store
(`partialize` strips them properly, `formStore.js:983–1038`) — but:
- `QuestionnaireModal.jsx:191–202` persists questionnaire uploads **including base64**
  (CEST forms, approval docs) to `questionnaireSubmission` and `submission_QUEST-*`;
- `RequesterResponsePage.jsx:840–895` persists response attachments **including
  base64** into the submission record;
- `LocalStorageProvider.uploadDocument` (`StorageProvider.js:86–105`) stores documents
  — including passports/licences — as base64 in localStorage.
The third is dev-only by design, but the first two run in any build. Either guard/strip
them, or soften the DPIA wording before IG reads it — an inaccurate control claim is
worse than a disclosed limitation.

**S6. Stale deployment docs and a committed stale `.env.production` contradict the
addendum.**
- `docs/deployment/DEPLOYMENT.md` (v4.0) and `PRODUCTION_DEPLOYMENT_CHECKLIST.md`
  still walk through Express on App Service, SQL Server, `SP_CLIENT_SECRET` (the
  retired ACS auth), and VerseOne hosting — with no superseded banner. The addendum
  §7 only names `02-sql-server.md` and Solution Overview §3/§7.
- `.env.production` is committed with `VITE_API_URL=https://your-app-service...` and
  VerseOne URLs. **Vite auto-loads `.env.production` for every `vite build`**, so these
  placeholders get baked into any production bundle (see D3).
- The addendum's base document `NHS_SSF_Solution_Overview.md` does not exist anywhere
  in the repo — the decision record's foundation is unreviewable. Add it or fix the
  reference.
Recommend a superseded-banner sweep: DEPLOYMENT.md, PRODUCTION_DEPLOYMENT_CHECKLIST.md,
01-environment.md, 03-sharepoint.md, 05-data-export.md (04 already carries one via 06's
header).

**S7. F2 trigger scope differs between 06 ("item modified") and 07 ("created or
modified").**
The playbook version fires on creation (Status `pending_review` ≠ empty LastStatus),
producing a duplicate audit entry alongside F1's `SUBMISSION_CREATED` and a pointless
LastStatus write. Align both on "modified", or drop F1 and let F2 handle creation with
a `pending_review` switch case.

**S8. `info_required` and `rejected` emails give the requester no way back in.**
Playbook Task 5 marks requester-facing cases "(no link)". In production the requester's
only re-entry point is `/respond/<SubmissionID>` (`App.jsx:215`); localStorage-based
rejection banners (`App.jsx:51–121`) won't exist on their machine. Add the `/respond/`
link at least to the `info_required` and `rejected` cases.

**S9. CI hard-couples the frozen backend to frontend deployability.**
`ci.yml:57–88` still `npm ci` + lint + `npm audit --audit-level=high` on
`supplier-form-api/`. A new CVE in the frozen, never-deployed Express stack will block
frontend releases — this already bit you (commit `d3e6299` "Fix CI: resolve
high-severity npm audit failures"). Make the backend steps a separate non-blocking job,
or drop them.

**S10. Placeholder identity values in review-page writes.**
E.g. `PBPReviewPage.jsx:597` `fromEmail: 'pbp@nhs.net' // In production, get from auth`,
and OPW/AP equivalents (`'OPW Panel Member'`, reviewer names from free-text signature
fields). Step-4 work must source these from the signed-in user, or the SharePoint
audit trail will attribute decisions to placeholders.

### NICE-TO-HAVE

**N1.** `LocalStorageProvider` lacks `submitReview`, `checkCompaniesHouse`,
`checkDuplicateVendor` — the two providers don't share an interface; any future call to
those in dev crashes. Define the provider interface once (also settles B1's design).
**N2.** F4's OData `startswith(Status,'pending')` against a Choice column — verify in
the target tenant; Choice columns sometimes reject `startswith`. Fallback: enumerate
with `or Status eq ...`.
**N3.** Blocking `alert()`/`window.confirm()` dialogs carry dev-mode text ("In
production, an email will be sent automatically") — replace before UAT screenshots end
up in front of IG.
**N4.** `QuestionnaireModal` fakes latency (`setTimeout` 1000ms "Simulate API
submission") — harmless, but remove with B1.
**N5.** Playbook F4 sends one combined digest to procurement only (06 wants per-team) —
already acknowledged in the playbook as a deliberate simplification; fine.
**N6.** Base64 uploads in demo mode can hit the ~5 MB localStorage quota with a couple
of large PDFs; the error surfaces as a generic submission failure. Acceptable for demo,
worth a friendlier message.

### Status-model sync check (the thing you asked me to verify exactly)

`workflowStatus.js` STATUS values ↔ 06 §2.1 Status choices ↔ 07 Task 1 ↔ F2 switch:
**all four match exactly** (11 values; F2 intentionally has no `pending_review` case —
F1 covers creation). STAGE values ↔ CurrentStage choices: **match exactly** (9 values).
`STAGE_QUEUE_STATUSES` ↔ F2 routing (AP gets both `pending_ap_control` and
`contract_uploaded`): **consistent**. The canonical model itself is clean — the faults
are all in the code *around* it (B1, S2, S3, S4), not in it. Do not rename anything.

---

## 3. DEPLOY WITHOUT IT — an honest assessment

### (a) What you can build and test with zero IT involvement

Everything in playbook Tasks 1–7, genuinely:
- **SSF-Submissions / SSF-AuditTrail lists, columns, versioning** — you own the site.
- **The six SSF-* SharePoint groups and library permissions** (Task 3) — site-owner
  powers suffice; membership population is yours.
- **Flows F1–F4** — standard connectors only, built under your account. You can run the
  entire §6 test matrix *today* by hand-creating a list item and walking its Status
  through every branch — this validates triggers, switch routing, the loop guard, F3
  deletion, and audit writes **without any app existing**. This is the highest-value
  IT-free work available and I'd do it first (after fixing B4 in the doc).
- **Local demo-mode UAT** (`npm run dev`) with reviewers at your desk or on a Teams
  call — the full pipeline works in one browser today.
- **All front-end remediation**: B1 (provider rerouting), S2, code-splitting (D1),
  `staticwebapp.config.json` (B7), the doc fixes — none need IT.
- **DPIA/IG submission** — after S5 is resolved so the claims are accurate.
- Writing the Graph provider *code* against mocked responses.

Two caveats inside "zero IT": the **shared mailboxes** (pbp-panel@, opw-panel@,
ap-control@) are an Exchange admin request — 06 already flags the named-person risk for
the contract drafter; realistically this is a second IT dependency, just a routine one.
And **flow-connection service accounts** (06 §5) are also an IT ask, deferred to
pre-go-live.

### (b) Can the front end be deployed/demoed without the App Registration?

- **Demoed: yes, today — locally.** Dev mode is fully self-contained (mock users,
  localStorage). That covers stakeholder walkthroughs and process UAT.
- **Deployed to a URL: not with the current code.** Any built bundle takes the PROD
  branch of StorageProvider and dies against the missing API (B2/B8). A hosted demo
  needs the small demo-mode build flag described in B8 — a deliberate, ~5-line change
  I'd make with your sign-off. Even then, creating the Static Web App requires an
  **Azure subscription** — check whether you can create resources in the Trust tenant
  or whether that's actually an eighth IT dependency hiding in delivery-plan step 5.
  If Azure access is blocked, a hosted demo could live anywhere static (even a
  SharePoint page embed), because demo mode needs no server.
- **Deployed for real use: no.** Without sign-in there is no identity, no RBAC, and no
  Graph access. There is no fragile workaround worth building here — anything that
  faked identity would undermine the audit trail that justifies the whole design.
  **Waiting for IT is the correct call for the production deployment.**

### (c) What genuinely cannot happen until IT delivers — and it's more than one item

The addendum says one dependency; the honest count is one **critical path** with four
sub-items, plus two routine asks:
1. **The App Registration itself** (SPA, redirect URI, delegated scopes).
2. **Admin consent** for `Sites.Selected` (or `Sites.ReadWrite.All`) — a Global/App
   admin action distinct from creating the registration.
3. **If `Sites.Selected` (the preferred, least-privilege option): a per-site grant.**
   Someone with `Sites.FullControl.All` or SharePoint admin rights must explicitly
   grant the app write access to the NHS-Supplier-Forms site via Graph. This is an
   *extra* admin step the addendum doesn't mention — put it in the IT request now so
   it doesn't surface as a surprise second ticket.
4. **Redirect URI update** after the Static Web App URL exists (chicken-and-egg with
   step 5; request a placeholder + localhost URI so dev-tenant testing can start
   immediately on delivery).
Plus routine: shared mailboxes (Exchange), and the flow service account before go-live.

Until 1–3 land: no real sign-in, no Graph integration testing, no end-to-end UAT with
real identities, no go-live. Everything else — which is most of the remaining work —
can proceed in parallel.

---

## 4. DEPLOYMENT SAFETY — what will fail or misbehave, with fixes

**D1. The 2.4 MB bundle — confirmed by build.**
`vite build` today: `index-D1ynTOAo.js` **2,421.37 kB** (750.17 kB gzip), single chunk,
446 modules. On hospital networks/thin clients that's a slow first paint, and one byte
changed anywhere invalidates the whole cached bundle. Two concrete fixes, biggest
first:
- **Lazy-load the PDF layer.** `@react-pdf/renderer` is statically imported by
  `Section7ReviewSubmit` and five review pages (`PDFDownloadLink`). Wrap PDF generation
  in `await import('@react-pdf/renderer')` at click time (Section7 already uses the
  imperative `pdf()` API, so this is natural) — this alone should remove roughly a
  third to a half of the bundle for the common path.
- **`React.lazy` the six review pages + RequesterResponsePage in `App.jsx`.**
  Requesters (the overwhelming majority of users) never need that code.
- Optionally add `build.rollupOptions.output.manualChunks` for a stable vendor chunk.
Target: main chunk under ~500 kB gzip-total for the requester path.

**D2. Missing SWA routing config** — see B7. Without `staticwebapp.config.json` every
emailed deep link 404s. Must exist before step 5.

**D3. The committed `.env.production` silently poisons every production build.**
Vite loads it automatically on `vite build`; today it bakes
`https://your-app-service.azurewebsites.net/api` into `ApiStorageProvider` and
`companiesHouse.js`. Even after the Graph provider lands, a stale committed env file is
a footgun — real config should come from CI/SWA build settings, and `.env.production`
should be deleted from the repo (it's also listed nowhere in `.gitignore`).

**D4. Hardcoded/dead URLs and env vars.**
`companiesHouse.js:27` falls back to `http://localhost:3001` (B6). The eight
`VITE_API_SUBMIT_*` flow-URL variables and `VITE_AZURE_*` in `.env.example` are read by
no code — prune them when step 4 defines the real config surface, so the deployment
checklist doesn't send someone hunting for values that do nothing.

**D5. Auth assumptions.**
Front-end-only RBAC with substring matching (S2) + all reviewer groups having
Contribute on the full list means: in production, any reviewer who obtains a
submission URL can open any submission — SharePoint won't stop them, and the front-end
check is leaky. Fix S2, and accept (document in the DPIA) that stage-gating is
advisory-UI, not a security boundary — the security boundary is site membership.

**D6. Untested happy path.**
Nothing has ever executed end-to-end against SharePoint: no Graph call, no flow fired
by the app, no list item created by code. The §6 test matrix run by hand (3a) de-risks
the flow half now; the app half can only be integration-tested post-App-Registration —
schedule UAT accordingly and don't let the two be tested for the first time together.

**D7. CI gaps.** The pipeline lints and builds but runs **zero tests** (none exist) and
deploys nothing. Before go-live: add the SWA deploy step (official
`Azure/static-web-apps-deploy` action), and at minimum a smoke test that the canonical
status values in `workflowStatus.js` match a checked-in copy of the choice-column list
— cheap insurance for the three-way sync rule in 06 §5. Also decouple the frozen
backend (S9).

---

## 5. Suggested order of attack

| # | Action | Depends on |
|---|---|---|
| 1 | Fix docs: B4 (F2 condition in 06), B5 (contract link), S6/S7 banners, addendum IT-request wording per 3(c) | nothing |
| 2 | Submit the *complete* IT request: app reg + admin consent + Sites.Selected site grant + placeholder redirect URI; separately request shared mailboxes | nothing |
| 3 | Build lists/groups/flows (playbook Tasks 1–7) and run the §6 matrix by hand | 1 |
| 4 | Agree StorageProvider interface (B1/N1) and status handling for requester responses (S4) — **needs your decision**, then reroute review-page writes | nothing |
| 5 | D1 code-splitting, B7 SWA config, S2 exact-match auth, D3 env cleanup | nothing |
| 6 | Graph provider + MSAL sign-in (B2/B3), CRN decision (B6) | 2 delivered |
| 7 | Fix S5, then submit DPIA | 4 |
| 8 | Deploy to SWA, redirect URI final, end-to-end UAT, go-live | all above |

Items 1, 3, 4, 5 are pure Fahimul-time. The critical path to go-live runs through
item 2 — submit it this week with the expanded scope so it only round-trips IT once.