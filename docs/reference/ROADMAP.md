# NHS Supplier Setup Form — Project Roadmap

**Version:** 3.0 | **Updated:** July 2026 | **Author:** Fahimul Haque
**Architecture:** hybrid M365 (SharePoint lists + Power Automate + Graph SPA) — see
[../NHS_SSF_Platform_Decision_Addendum.md](../NHS_SSF_Platform_Decision_Addendum.md)

## Phase 1 — Application ✅ COMPLETE

7-section form, five-stage review workflow, OPW/IR35 determination, contract
negotiation, rejection handling, PDF generation. **All 14 workflow routes and 18
status transitions verified end-to-end in the browser (July 2026)** — see
[../deployment/DEPLOYMENT_READINESS_REVIEW.md](../deployment/DEPLOYMENT_READINESS_REVIEW.md).
CRN lookup verified against a mock of the production proxy (active, dissolved,
autofill and all failure modes). Questionnaire loop verified end-to-end.

## Phase 2 — SharePoint & flows build 🔄 IN PROGRESS (Fahimul, no IT needed)

Follow [../deployment/setup/07-browser-agent-playbook.md](../deployment/setup/07-browser-agent-playbook.md):

| Task | Status |
|---|---|
| SSF-Submissions + SSF-AuditTrail lists (Tasks 1–2) | ✅ (dummy-item flow tests running against them since 8 Jul) |
| Six SSF-* groups + library permissions (Task 3) | ⏳ (document libraries created) |
| F1 new-submission router (Tasks 4 + 12 + 13) | ✅ 09/07/2026 — SubmissionType routing (full → Procurement), ServiceCategory split, LastStatus from trigger |
| F2 status router (Task 5) | ✅ built — fires correctly (verified via dummy-item emails 09/07) |
| F6 requester-responded (Tasks 9 + 12) | ✅ 09/07/2026 — rebuilt after a stuck-save tab; loop guard first, ServiceCategory split |
| F3 ID-deletion (Task 6) | ✅ audited correct 09/07/2026 |
| F4 digest (Task 7) | ✅ built — set recurrence to 08:00 UK (currently 09:00) |
| F7 claim email + columns (Task 11) | ⚠️ built, but loop-guard Update item hardcodes Status/CurrentStage/SubmissionType/AwaitingParty — **must be fixed before F7 runs against real data** (would revert item status + re-trigger F2) |
| CRN proxy flow — premium (Task 8) | ✅ verified live 08–09/07 (200 valid / 404 with CORS) |
| VAT proxy flow (Task 10) | ⏳ (app side done; HMRC production credentials being re-applied for) |
| Hand-run test matrix (§6 of the design doc) | 🔄 in progress — F1 single-email retest + F6 round-trip next |

## Phase 3 — IT dependency ⏸️ REQUESTED

One ticket ([../deployment/IT_REQUEST_EMAIL.md](../deployment/IT_REQUEST_EMAIL.md)):
App Registration + admin consent + Sites.Selected site grant. Separately: shared
mailboxes. Everything else proceeds in parallel.

## Phase 4 — Remaining code (after IT delivers)

| Task | Notes |
|---|---|
| MSAL sign-in + Graph storage provider | Replaces dev localStorage provider; rules in design doc §4b |
| Bundle code-splitting | Lazy-load PDF renderer + review pages (~2.4 MB → target <1 MB initial) |
| Exact-match role checks in AuthContext | Replace substring matching + SSF-* group resolution |
| Reviewer identity from sign-in | Replace placeholder names/emails in review sign-offs |

## Phase 5 — Deploy & go-live

Azure Static Web Apps deploy (config already in repo) → redirect URI to IT →
end-to-end UAT with real identities → DPIA sign-off → go-live conditions in
[../governance/DPIA_IG_CHECKLIST.md](../governance/DPIA_IG_CHECKLIST.md) §8.

## Future integrations (post-v1) — design notes so v1 stays ready

The pattern for all external checks is already established by the CRN lookup:
**a Power Automate HTTP flow holds the credentials, the SPA calls it via a
`VITE_*_FLOW_URL` config value, and the UI degrades gracefully to manual
verification when the flow is unreachable** (`companiesHouse.js` /
`useCRNVerification.js` are the reference implementation).

| Feature | Route | Dependency to start early |
|---|---|---|
| **VAT number validation** | ✅ **App side implemented July 2026** (`src/utils/vatCheck.js`, Section 6 verified/not-found/unavailable states; HMRC sandbox contract verified). Remaining: build the flow (playbook Task 10) and, for go-live, HMRC production credentials + regenerated secret | HMRC production credential approval |
| **Confirmation of Payee (CoP)** | ⚠️ **Not a public/government API.** CoP is operated via Pay.UK and only accessible through banks or commercial providers — this is a *procurement/contract* dependency (Trust bank or a commercial verification service), not a code task. AP Control's manual letterhead verification remains the control until then | Early conversation with the Trust's bank / a commercial provider |
| Other checks (CIS, charity register, etc.) | Charity Commission has a public API (flow proxy pattern); CIS verification is HMRC-gated similar to VAT | Per-API registration |

Rules for adding any future feature: new fields go through the storage provider
(never direct storage calls); no new workflow Status values without updating the
choice column and F2 together; secrets live in flows, never in the SPA bundle.
