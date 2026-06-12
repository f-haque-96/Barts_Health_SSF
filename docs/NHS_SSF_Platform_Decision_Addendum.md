# Addendum: Platform Decision — Hybrid Architecture
## NHS Supplier Setup Smart Form (SSF) — Barts Health NHS Trust

**Author:** Fahimul Haque, Procurement Team (fahimul.haque1@nhs.net)
**Date:** June 2026 | **Version:** 1.0 | **Status:** For sign-off
**Supplements:** NHS_SSF_Solution_Overview.md (May 2026)

---

## 1. Decision

The SSF will adopt a **hybrid architecture**: the completed React front end is retained,
and the custom Express.js server and SQL Server database described in the Solution
Overview are **retired before deployment**, replaced by Microsoft 365 services the
Trust already operates.

| Layer | Solution Overview (May 2026) | This addendum (June 2026) |
|---|---|---|
| Front end | React SPA on Azure App Service / IIS | React SPA on **Azure Static Web Apps** (unchanged code) |
| Application server | Node.js / Express, PM2, port 3001 | **None** — removed |
| Database | Microsoft SQL Server | **SharePoint lists** (SSF-Submissions, SSF-AuditTrail) |
| Documents | SharePoint libraries | SharePoint libraries (unchanged) |
| Notifications / workflow | Power Automate (triggered by API) | **Power Automate** (triggered directly by list changes) |
| Authentication | Azure AD via custom API + Graph | Azure AD (single App Registration; RBAC via SharePoint groups) |

## 2. Rationale

1. **Removes five of the six critical IT dependencies.** No hosting server, no DNS/SSL
   request, no outbound firewall rules, no SQL Server database, no DBA involvement.
   The Solution Overview §12 listed eleven outstanding IT actions; this reduces them to
   **one** (Azure AD App Registration, §4 below).
2. **Removes the custom-server governance burden.** There is no internally hosted
   Node.js service to vet, patch, monitor, or hand over. The data platform (M365) is
   already covered by the Trust's Microsoft Data Processing Agreement and DSPT scope.
3. **Right-sizes the solution.** At 100–300 submissions/year (~15 MB/yr of structured
   data), SQL Server and a dedicated server are over-provisioned. SharePoint lists and
   standard Power Automate connectors handle this volume comfortably within existing
   NHS M365 licensing (no premium connectors required once SQL Server is removed).
4. **Reduces the single-maintainer risk.** Flows and lists can be co-owned and
   maintained by any Power-user; a custom Express/SQL stack cannot.
5. **Unblocks a technical dead end.** The existing SharePoint integration code uses
   Azure ACS app-only authentication (@pnp/sp v2 + client secret), which Microsoft
   retired for SharePoint Online in April 2026. A rewrite was mandatory in any case;
   the hybrid path replaces it with supported Graph/Power Automate access.

## 3. What is retained

- The complete React form (Sections 1–7), validation (Zod 4), CRN verification via
  Companies House, PDF generation, rejection handling, and all review-page UI.
- The document governance model: SensitiveDocuments library (IDs, bank-detail
  documents) restricted to AP Control/Contract/Admin and never synced to Alemba.
- The canonical workflow status model (now codified in `src/utils/workflowStatus.js`),
  which becomes the SharePoint Status column choices and Power Automate trigger values.
- The audit-trail requirement — implemented as an append-only SharePoint list plus
  list versioning, instead of a SQL table.

## 4. Remaining IT dependency (the only one)

**One Azure AD App Registration** for the React SPA (single-page application, single
tenant) so staff sign in with existing NHS credentials and the app can call Microsoft
Graph to read/write the SharePoint lists on the signed-in user's behalf:

| Item | Value |
|---|---|
| Type | SPA (public client) — no client secret to manage |
| Delegated permissions | `User.Read`, `Sites.ReadWrite.All` *(or `Sites.Selected` scoped to the SSF site — preferred)* |
| Admin consent | Required once for `Sites.Selected`/`Sites.ReadWrite.All` |
| Redirect URI | The Static Web App URL (provided after deployment) |

Role-based access is enforced with **SharePoint groups** (SSF-PBP, SSF-Procurement,
SSF-OPW, SSF-Contract, SSF-APControl, SSF-Admin), which the Procurement team can
administer directly — the six AD security groups previously requested from IT are no
longer needed.

## 5. Governance posture

- **DPIA:** required regardless of platform (sole-trader ID documents + bank details).
  Checklist prepared: `docs/governance/DPIA_IG_CHECKLIST.md`. To be agreed with IG
  before go-live.
- **Software vetting:** scope shrinks to a static front end + standard M365
  configuration; no internally hosted service.
- **Data residency:** unchanged — all data remains in the Trust's M365 UK tenancy.
- **Business continuity:** unchanged — the manual email process remains the fallback.

## 6. Delivery plan

| # | Step | Owner | Dependency |
|---|---|---|---|
| 1 | Create SSF-Submissions / SSF-AuditTrail lists + SharePoint groups (design: `docs/deployment/setup/06-hybrid-sharepoint-flows.md`) | Fahimul Haque | None |
| 2 | Build Power Automate flows F1–F5 | Fahimul Haque | Step 1 |
| 3 | Request SPA App Registration (§4) | IT Identity team | None — request submitted with this addendum |
| 4 | Add Graph/SharePoint storage provider to the React app (replaces Express API calls) | Fahimul Haque | Steps 1, 3 |
| 5 | Deploy front end to Azure Static Web Apps | Fahimul Haque | Step 4 |
| 6 | DPIA/IG sign-off | IG team | Checklist submitted |
| 7 | UAT (one test case per pipeline branch) → go-live | Fahimul Haque + reviewers | Steps 2, 5, 6 |

**Estimated effort:** 3–4 weeks elapsed, dominated by step 4 and IT/IG response times.

## 7. Consequences for the existing codebase

- `supplier-form-api/` (Express server, SQL schema, migrations) is **frozen** — kept in
  the repository for reference but no longer on the deployment path.
- `docs/deployment/setup/02-sql-server.md` and the server-hosting sections of the
  Solution Overview (§7) are superseded by this addendum.
- The Solution Overview remains accurate for scope (§2), users (§4), data (§5), and
  workflow; its architecture sections (§3, §7) are superseded.
