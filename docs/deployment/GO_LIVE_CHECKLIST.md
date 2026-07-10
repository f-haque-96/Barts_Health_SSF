# Go-Live Checklist — every value to replace before production

**Updated:** 8 July 2026 | **Owner:** Fahimul Haque
**Rule:** nothing on this page is optional. Work through it top to bottom in the
final week before go-live; tick items only when verified, not when requested.

During testing, ALL fixed email recipients are `fahimul.haque1@nhs.net` and all
flow links use the `https://APP-URL-TBC/...` placeholder — both get swapped here.

---

## 1. Power Automate flows

### 1.1 Replace `APP-URL-TBC` links (once the Static Web App URL exists)

| Flow | Where the link appears | Link path (must match React routes exactly) |
|---|---|---|
| F1 — New submission router | questionnaire branches (clinical / non-clinical) | `/pbp-review/[Title]` |
| F1 | full-submission branch (Task 13) | `/procurement-review/[Title]` |
| F2 — Status router | approved (full) | `/procurement-review/[Title]` |
| F2 | procurement_approved_opw | `/opw-review/[Title]` |
| F2 | pending_ap_control, contract_uploaded | `/ap-review/[Title]` |
| F2 | pending_contract | `/contract-drafter/[Title]` ⚠️ NOT `contract-review` |
| F2 | rejected, info_required | `/respond/[Title]` |
| F6 — Requester responded | both Condition branches | `/pbp-review/[Title]` |
| F7 — Review assigned | assignment email | `/pbp-review/[Title]` |

### 1.2 Mailbox swap (from fahimul.haque1@nhs.net)

| Flow | Branch / case | Final recipient |
|---|---|---|
| F1 | questionnaire + clinical | PBP clinical shared mailbox *(requested, TBC)* |
| F1 | questionnaire + non-clinical | PBP non-clinical shared mailbox *(requested, TBC)* |
| F1 | full submission (Task 13 branch) | `barts.procurement@nhs.net` |
| F2 | approved + SubmissionType=full | `barts.procurement@nhs.net` |
| F2 | procurement_approved_opw | `bartshealth.opwpanelbarts@nhs.net` |
| F2 | pending_ap_control, contract_uploaded | `apcontrol.bartshealth@nhs.net` |
| F2 | pending_contract | Contract drafter mailbox *(requested, TBC — interim: named drafter)* |
| F4 | weekly digest | `barts.procurement@nhs.net`, CC SSF admins — ⚠️ decide first whether the Alemba-linked helpdesk raising a weekly ticket is signal or noise; if noise, request a plain mailbox |
| F6 | If yes / If no | same PBP clinical / non-clinical mailboxes as F1 |
| F7 | — | no change (dynamic ClaimedBy) |

Dynamic recipients (`RequesterEmail`, `ClaimedBy`) never change.

> **Pending (may change this table):** PBP are producing a category delegation
> matrix (Soft FM / Hard FM / Corporate / clinical specialties). Subject-line
> category tagging may replace the two PBP mailboxes with one — see design
> `setup/06-hybrid-sharepoint-flows.md` §7.1 before requesting/swapping PBP
> mailboxes.

### 1.3 VAT flow (Task 10) production variant

- [ ] HMRC production credentials approved (application was **declined 07/07/2026**
      — resubmit with: statutory body / no Companies House number, ODS code R1H,
      CQC registration, Trust VAT number from finance)
- [ ] Regenerate the HMRC client secret (sandbox secret has been shared around)
- [ ] Change BOTH URIs in the flow: `test-api.service.hmrc.gov.uk` → `api.service.hmrc.gov.uk`

### 1.4 Flow ownership

- [ ] Add a second co-owner to every flow (F1–F4, F6, F7, CRN, VAT) — DPIA risk 4
- [ ] Service account for the flow connections (IT request) so flows survive staff changes
- [ ] Anyone co-owning the CRN/VAT flows needs a Power Automate Premium licence

## 2. App configuration (Azure Static Web Apps → Configuration, not committed files)

| Variable | Value | Source |
|---|---|---|
| `VITE_CRN_FLOW_URL` | HTTP GET URL of the CRN proxy flow | already built (Task 8) — copy from the flow trigger |
| `VITE_VAT_FLOW_URL` | HTTP GET URL of the VAT proxy flow | after Task 10 + §1.3 |
| `VITE_AZURE_CLIENT_ID` | App Registration client ID | IT (see IT_REQUEST_EMAIL.md) |
| `VITE_AZURE_TENANT_ID` | Barts Health tenant ID | IT |
| `VITE_AZURE_REDIRECT_URI` | the deployed app URL | must also be added to the App Registration by IT |
| `VITE_ALEMBA_CALL_URL` | `https://servicedeskbartshealth.alembacloud.com/production/Core.aspx?MMA&CORE_ENTITY=1&ENTITY_REF={ref}` | confirmed July 2026 |
| `VITE_SUPPLIER_PACK_FORM_URL` | MS Forms share URL of the Supplier Information Pack | in `.env.local` (not committed); Section 3 helper hides if unset |

## 3. Code (Phase 4 — must exist before go-live)

- [ ] **MSAL sign-in + Graph storage provider** replacing the dev localStorage
      provider — implement ALL SEVEN rules in `setup/06-hybrid-sharepoint-flows.md`
      §4b (bank details → SSF-BankDetails; base64 stripped from exchanges;
      RequesterEmail from UPN; AwaitingParty writes **(F6 will never fire
      without this)**; ClaimedBy column mirroring **(F7 likewise)**;
      questionnaire certificate upload; etag concurrency guard)
- [ ] `src/utils/constants.js` → `CONTRACT_DRAFTER_EMAIL`: swap the named
      drafter for the role mailbox when IT create it
- [ ] Role resolution: production must populate `session.user.groups` with the
      user's **SSF-\*** SharePoint group names (AuthContext expects exactly
      `SSF-PBP`, `SSF-Procurement`, `SSF-OPW`, `SSF-Contract`, `SSF-APControl`,
      `SSF-Admin`)
- [ ] Remove/replace dev-mode alert texts ("In production, an email will be
      sent automatically") once flows send the real emails
- [ ] `src/config/devAuth.js` must not load in production (guard exists — verify
      the built bundle doesn't include it)

## 4. Pre-go-live verifications

- [ ] Hand-run flow test matrix (§6 of `setup/06-hybrid-sharepoint-flows.md`):
      every F2 branch, F3 deletion on completed AND rejected, F6 round-trip,
      F7 claim email
- [ ] End-to-end UAT with real identities (each SSF-* group, not just admins)
- [ ] DPIA sign-off (`../governance/DPIA_IG_CHECKLIST.md`) — including the
      §5 disclosed limitation being CLOSED by the provider's base64 rule
- [ ] Emailed deep links resolve on the deployed URL (staticwebapp.config.json
      SPA fallback is in the repo — verify after first deploy)
- [ ] SharePoint group membership populated (real people, not just you)
- [ ] SSF-BankDetails list permissions verified: AP Control + Admin ONLY

## 5. Reference — things already done (don't redo)

- CRN proxy flow built + verified live incl. 404/CORS path (8 Jul 2026)
- SharePoint site created (ticket 7999685); mailboxes for OPW / AP / Procurement exist
- `staticwebapp.config.json` (SPA fallback) committed
- Status model in `src/utils/workflowStatus.js` ↔ SharePoint choice columns ↔ F2
  switch verified in exact sync — renames are breaking changes across all three
