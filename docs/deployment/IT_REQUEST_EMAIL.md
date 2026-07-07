# IT request tracking

| Request | Reference | Submitted | Status |
|---|---|---|---|
| **SharePoint site** — "Supplier Setup Form" (standalone Team Site, private, permanent, PID declared, no external sharing; full name format `Supplier Setup Form - CW - PROC - GSS`) | **Ticket 7999685** (Microsoft Office 365 Site or Team) | 03/07/2026 17:04 | ✅ **Created 06/07/2026** — fresh/empty; build via playbook Tasks 1→2→2b→2c→3, then flows |
| **Azure AD App Registration** (+ admin consent + Sites.Selected site grant) — email below | — | 03/07/2026 | Awaiting response |
| **Shared mailboxes** (PBP, OPW, AP Control, contract drafter role) | — | 03/07/2026 | Awaiting response — until created, ALL flow emails go to fahimul.haque1@nhs.net |
| **HMRC production credentials** (VAT check API — needed for go-live only; sandbox unaffected) | HMRC Developer Hub, app "Barts Health Supplier setup Form" | — | ❌ **Declined 07/07/2026** — no UK registration evidence. Resubmit with: Barts Health NHS Trust is a statutory body (no Companies House no.), ODS code R1H, CQC provider registration, Trust VAT number (ask finance). Consider moving the app under a finance/Trust HMRC account. Regenerate the client secret at the same time. |

The site is live at
`https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS` — the URL is
filled into the playbook tasks and into item 4 below. Start at playbook Task 1.
**If the App Registration email was already sent with the old placeholder URL,
reply to that thread with the real URL above** so IT grants Sites.Selected on the
right site.

---

# Ready-to-send IT request (copy/paste into an email to the IT Identity team)

**To:** IT Identity / Azure AD team
**Subject:** Azure AD App Registration request — Procurement Supplier Setup Form (SSF)

---

Hi team,

Procurement is replacing the manual supplier setup process with an internal web form
(the Supplier Setup Form, SSF). It stores all data in our existing SharePoint site —
there is no new server, database, or external hosting. We need **one App Registration**
so staff can sign in with their normal NHS accounts. Full details:

**1. App Registration**
- Name: `NHS-SSF-SupplierSetupForm`
- Type: **Single-page application (SPA)** — public client, **no client secret**
- Supported account types: single tenant (Barts Health only)
- Redirect URIs: `http://localhost:5173` (for testing now) — we will send the final
  production URL to add later, once the site is deployed

**2. API permissions (Delegated, Microsoft Graph)**
- `User.Read`
- `Sites.Selected` *(preferred — least privilege)*; if not possible, `Sites.ReadWrite.All`

**3. Admin consent**
- Please grant tenant admin consent for the permissions above.

**4. Site permission grant (needed because of Sites.Selected)**
- Please grant this app **write** access to one specific SharePoint site:
  `https://nhs.sharepoint.com/sites/R1H_SupplierSetupForm-CW-PROC-GSS`
  (done by a SharePoint/Global admin via Graph API or PnP —
  `Grant-PnPAzureADAppSitePermission -Permissions Write`)

**5. What we need back from you**
- The **Application (client) ID**
- The **Directory (tenant) ID**
- Confirmation that admin consent and the site grant (item 4) are done

Governance context: the app is a static front end using Microsoft 365 services already
covered by the Trust's Microsoft DPA and DSPT scope. A DPIA is in preparation with IG.
Architecture decision record available on request
(`NHS_SSF_Platform_Decision_Addendum.md`).

Happy to answer any questions — this is the only IT dependency for the project.

Thanks,
Fahimul Haque, Procurement
fahimul.haque1@nhs.net

---

# Separate, routine request (can go to the service desk instead)

**Subject:** Shared mailbox creation — Supplier Setup Form notifications

Please create (or confirm existing) shared mailboxes for workflow notifications:
- `pbp-panel@…` (PBP panel)
- `opw-panel@…` (OPW panel)
- `ap-control@…` (AP Control)
- one for the contract drafter role (currently a named person — we'd like a role
  mailbox to remove the single-person dependency)

Procurement team members X, Y, Z need send/read access. No other changes required.