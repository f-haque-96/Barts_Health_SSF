# Development Mode Guide

## Demo mode (the default — and the only mode until Graph integration lands)

```bash
npm install
npm run dev
```

Everything runs in the browser: mock sign-in (`src/config/devAuth.js` — switch test
users there to try different reviewer roles), submissions stored in browser
localStorage, and dev testing buttons on Section 7 after submitting a form.

## Production mode

Production uses Azure AD sign-in + Microsoft Graph + SharePoint lists — no local
backend. See the hybrid architecture docs:

- [../NHS_SSF_Platform_Decision_Addendum.md](../NHS_SSF_Platform_Decision_Addendum.md)
- [../deployment/setup/06-hybrid-sharepoint-flows.md](../deployment/setup/06-hybrid-sharepoint-flows.md)

The Express backend (`supplier-form-api/`) is **frozen** — reference only. Its
Express-era setup guides live in [../archive/express-era/](../archive/express-era/README.md).

<!-- Updated: Jul 2026 - hybrid architecture -->