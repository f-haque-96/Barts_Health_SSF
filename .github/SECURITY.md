# Security Policy

## Reporting Security Vulnerabilities

**NHS Barts Health Trust takes security seriously.**

If you discover a security vulnerability in the NHS Supplier Setup Smart Form, please report it responsibly:

### 🔒 How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead:
1. **Email:** Contact the development team directly at your NHS IT security contact
2. **Subject:** Use "SECURITY: NHS Supplier Form Vulnerability"
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### ⚡ Response Time

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 5 business days
- **Fix Timeline:** Depends on severity (critical issues prioritized)

### 🛡️ Supported Versions

| Version | Supported |
|---------|-----------|
| 2.0.x (Current) | ✅ Yes |
| 1.0.x | ❌ No longer supported |

### 🔐 Security model — CURRENT architecture (React SPA → Graph → SharePoint)

> ⚠️ Rewritten August 2026. The previous version of this file described the
> **retired Express/SQL backend** (parameterised SQL, CSRF tokens, HttpOnly
> cookie sessions, server-side validation) — none of those controls exist in
> the current architecture and describing them would be misleading. The June
> 2026 pivot removed the application server; the security model changed with
> it. Authoritative detail and the open decisions:
> [docs/governance/SECURITY_AUTHORIZATION_MODEL.md](../docs/governance/SECURITY_AUTHORIZATION_MODEL.md).

**Trust boundary:** there is no application server to arbitrate access. The
effective authorization boundary is the intersection of (a) the SharePoint
permissions carried by each signed-in user's own **delegated** Graph token and
(b) the app registration's `Sites.Selected` grant. React role/stage checks are
**UX, not a security boundary**.

**Implemented controls (verified):**
- ✅ **Entra ID / MSAL authentication** — OIDC redirect flow, `sessionStorage`
  tokens, silent renewal with interactive fallback. Public SPA client — **no
  client secret** in the bundle.
- ✅ **`Sites.Selected` least-privilege app scope** — the app can reach only the
  one Supplier Setup Form site, nothing else in the tenant.
- ✅ **No secrets client-side** — Companies House / HMRC credentials live inside
  Power Automate flows; only public flow URLs and the public client ID ship.
- ✅ **Sensitive-data segregation at the data layer** — typed bank details go to
  a separate `SSF-BankDetails` list, ID documents to `SensitiveDocuments`, each
  restricted at the SharePoint permission level (AP/Contract/Admin as
  appropriate).
- ✅ **Append-only audit list** — reviewer groups can add but not edit/delete
  `SSF-AuditTrail` entries (custom "Add Only" permission level) + full list
  versioning.
- ✅ **Optimistic concurrency** — `If-Match` etag on decision writes; a 412
  surfaces as a user-visible conflict rather than a silent overwrite.
- ✅ **Workflow transition legality** — a canonical allowed-transitions map
  (`src/utils/workflowStatus.js`), unit-tested, with a client-side pre-check;
  the authoritative gate is the F2 flow's transition Condition.
- ✅ **Security headers** — `staticwebapp.config.json` sets `nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`.

**Known open items before go-live (tracked in the governance doc):**
- ⏳ Requester **Add-without-Read** permission on `SSF-Submissions`,
  `SSF-BankDetails` and `SensitiveDocuments` — proven with a real delegated
  Graph account (test matrices in the governance doc §4).
- ⏳ **Reviewer Delete removed** (Contribute-minus-Delete) and **F2 transition
  legality** enforced in the flow.
- ⏳ **Cross-stage reviewer read access** — an explicit IG / data-owner
  risk-acceptance decision (reviewer groups currently hold list-wide access;
  stage isolation is UI-only).

### 📋 Pre-deployment security checklist

- [ ] Build configuration (env vars) set — no secrets in the SPA bundle;
      `VITE_VAT_SANDBOX`/`VITE_DEMO_MODE` absent in production
- [ ] SharePoint groups (SSF-*) created and populated
- [ ] Requester Add-only permission model proven via the real-account Graph
      test matrices (governance doc §4)
- [ ] Reviewer Delete removed; F2 transition legality enforced
- [ ] Cross-stage reviewer access decision recorded by IG / data owner
- [ ] SensitiveDocuments + SSF-BankDetails restrictions re-verified with
      non-admin accounts during UAT
- [ ] Audit logs monitored (SSF-AuditTrail + M365 unified audit log)

---

**Last Updated:** August 2026 (security model rewritten for the current
Graph/SharePoint architecture)
**Security Contact:** NHS Barts Health IT Security Team
