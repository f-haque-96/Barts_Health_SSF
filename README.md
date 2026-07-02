# NHS Supplier Setup Smart Form (SSF)

[![Status](https://img.shields.io/badge/status-frontend%20complete%20%7C%20deployment%20in%20progress-orange)](https://github.com/f-haque-96/Barts_Health_SSF)
[![React](https://img.shields.io/badge/react-19-blue)](https://reactjs.org/)
[![Architecture](https://img.shields.io/badge/architecture-SharePoint%20%2B%20Power%20Automate-purple)](./docs/NHS_SSF_Platform_Decision_Addendum.md)

> **Barts Health NHS Trust** — supplier onboarding form with automated validation,
> fraud prevention, IR35/OPW determination, and a five-stage approval workflow.

## Architecture (June 2026 decision)

React SPA (Azure Static Web Apps) → Microsoft Graph → **SharePoint lists**
(SSF-Submissions, SSF-AuditTrail) + document libraries, with **Power Automate** flows
for all notifications, and Azure AD SSO with SharePoint-group RBAC.

There is **no application server and no SQL database**. The `supplier-form-api/`
folder is the retired Express/SQL backend, frozen and kept for reference only.
Decision record: [docs/NHS_SSF_Platform_Decision_Addendum.md](./docs/NHS_SSF_Platform_Decision_Addendum.md).

## What the form does

- **7-section supplier form** — requester info, pre-screening (with PBP questionnaire),
  supplier classification, company details, service description, financial info,
  review & submit
- **Companies House CRN verification** — via a Power Automate proxy flow
  ([setup guide](./docs/getting-started/CRN_SETUP_GUIDE.md))
- **Approval pipeline** — PBP → Procurement → (OPW Panel → Contract Drafter) →
  AP Control, with routing driven by the canonical status model in
  [`src/utils/workflowStatus.js`](./src/utils/workflowStatus.js)
- **OPW/IR35 compliance** — employed/self-employed and inside/outside IR35
  determinations, SDS tracking, payroll (ESR) terminal routes
- **Fraud prevention** — duplicate supplier detection, rejected-supplier flagging,
  conflict-of-interest alerts, sole-trader ID verification
- **PDF generation, file uploads, rejection handling** with requester notifications

### Approval pipeline

```
Requester → PBP → Procurement ─┬─ Standard ────────────────────→ AP Control → Completed (Oracle)
                                └─ OPW/IR35 → OPW Panel ─┬─ Self-Employed/Outside IR35 ─┬─ Contract → AP → Completed
                                                          │                              └─ (no contract) → AP → Completed
                                                          ├─ Employed → Completed (Payroll/ESR)
                                                          └─ Inside IR35 → SDS Issued (Payroll/ESR)
```

⚠️ The Status/CurrentStage values in `workflowStatus.js`, the SharePoint choice
columns, and the Power Automate F2 switch **must stay in exact sync** — treat renames
as breaking changes across all three.

## Quick start (demo mode — no backend needed)

```bash
npm install
npm run dev
```

Everything runs in the browser with mock sign-in and localStorage persistence.
Switch test users/roles in `src/config/devAuth.js`. After submitting a form,
dev-only testing buttons walk the submission through every review stage.

Other scripts: `npm run build` (production build), `npm run lint`,
`npm run docs:check-links` (validates doc links, also run by CI).

## Documentation

Start at **[docs/README.md](./docs/README.md)**. Key documents:

| Document | Purpose |
|---|---|
| [Platform Decision Addendum](./docs/NHS_SSF_Platform_Decision_Addendum.md) | Architecture decision + delivery plan |
| [Hybrid SharePoint & flows design](./docs/deployment/setup/06-hybrid-sharepoint-flows.md) | List schema + flow catalogue (F1–F4 + CRN proxy) |
| [Browser-agent playbook](./docs/deployment/setup/07-browser-agent-playbook.md) | Click-by-click build tasks |
| [Deployment readiness review](./docs/deployment/DEPLOYMENT_READINESS_REVIEW.md) | Current status, findings, open items |
| [DPIA / IG checklist](./docs/governance/DPIA_IG_CHECKLIST.md) | Governance sign-off checklist |

## Repository layout

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md). Superseded Express/SQL-era guides
are archived under [docs/archive/express-era/](./docs/archive/express-era/README.md).

---

**Maintainer:** Fahimul Haque, Procurement — fahimul.haque1@nhs.net