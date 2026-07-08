# Documentation Index

**Architecture (June 2026):** React SPA + SharePoint lists + Power Automate + Azure AD.
The Express/SQL backend is retired — decision record:
[NHS_SSF_Platform_Decision_Addendum.md](NHS_SSF_Platform_Decision_Addendum.md).

## Deployment (current path — read in this order)

| Document | Description |
|----------|-------------|
| [NHS_SSF_Platform_Decision_Addendum.md](NHS_SSF_Platform_Decision_Addendum.md) | Architecture decision record and delivery plan |
| [deployment/setup/06-hybrid-sharepoint-flows.md](deployment/setup/06-hybrid-sharepoint-flows.md) | SharePoint list design + Power Automate flow catalogue |
| [deployment/setup/07-browser-agent-playbook.md](deployment/setup/07-browser-agent-playbook.md) | Step-by-step build tasks (lists, groups, flows F1–F4 + CRN proxy) |
| [deployment/DEPLOYMENT_READINESS_REVIEW.md](deployment/DEPLOYMENT_READINESS_REVIEW.md) | Readiness review: findings, fixes applied, open items |
| [deployment/GO_LIVE_CHECKLIST.md](deployment/GO_LIVE_CHECKLIST.md) | **Every value/placeholder to replace before go-live** (flow links, mailboxes, env vars, code) |
| [deployment/IT_REQUEST_EMAIL.md](deployment/IT_REQUEST_EMAIL.md) | IT request tracking (site ✅ created, App Registration + mailboxes pending) |
| [deployment/setup/03-sharepoint.md](deployment/setup/03-sharepoint.md) | ⚠️ Superseded — libraries are now created by playbook Task 2c |

## Governance

| Document | Description |
|----------|-------------|
| [governance/DPIA_IG_CHECKLIST.md](governance/DPIA_IG_CHECKLIST.md) | DPIA & IG checklist (draft for IG review) |

## Getting Started (developers)

| Document | Description |
|----------|-------------|
| [getting-started/START_HERE.md](getting-started/START_HERE.md) | New developer onboarding path |
| [getting-started/DEVELOPMENT_MODE_GUIDE.md](getting-started/DEVELOPMENT_MODE_GUIDE.md) | Running the app locally in demo mode |
| [getting-started/CRN_SETUP_GUIDE.md](getting-started/CRN_SETUP_GUIDE.md) | Companies House (CRN) lookup configuration |

## User Guides

| Document | Description |
|----------|-------------|
| [user-guides/TEAM_SOPS.md](user-guides/TEAM_SOPS.md) | One-page SOP per team (PBP, Procurement, OPW, Contract, AP Control) |
| [user-guides/USER_GUIDE.md](user-guides/USER_GUIDE.md) | Complete user guide for all reviewer roles |
| [user-guides/OPW_PANEL_GUIDE.md](user-guides/OPW_PANEL_GUIDE.md) | OPW panel / IR35 determination guide |
| [user-guides/ALEMBA.md](user-guides/ALEMBA.md) | Alemba service desk integration guide |

## Reference

| Document | Description |
|----------|-------------|
| [reference/ROADMAP.md](reference/ROADMAP.md) | Feature roadmap and release history |
| [reference/OPW_Process_v1.2.pdf](reference/OPW_Process_v1.2.pdf) | Trust OPW process document |
| [reference/OPW_Guidance_Sep2022.docx](reference/OPW_Guidance_Sep2022.docx) | Trust OPW guidance (Sep 2022) |

## Archive (superseded — do not follow)

| Document | Description |
|----------|-------------|
| [archive/express-era/](archive/express-era/README.md) | Retired Express/SQL deployment guides (see banner inside) |
| [archive/PRE_DEPLOYMENT_COMPLETE.md](archive/PRE_DEPLOYMENT_COMPLETE.md) | Pre-deployment verification summary (10 Feb 2026) |
| [archive/CHANGES_IMPLEMENTED.md](archive/CHANGES_IMPLEMENTED.md) | February 2026 security fix log |
| [archive/PRODUCTION_FIXES_2026-02-04.md](archive/PRODUCTION_FIXES_2026-02-04.md) | February 2026 production fix log |
| SSF_Production_Audit_v2.docx / SSF_Project_Analysis.docx | Early project audit/analysis documents |