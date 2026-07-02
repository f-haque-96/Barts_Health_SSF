# CRN Setup Guide

Companies House (CRN) verification is proxied by a Power Automate HTTP-trigger flow —
the API key never ships in the browser app.

- **Build the flow:** follow Task 8 in
  [../deployment/setup/07-browser-agent-playbook.md](../deployment/setup/07-browser-agent-playbook.md)
  (requires a Power Automate Premium licence on the flow owner's account).
- **Configure the app:** set `VITE_CRN_FLOW_URL` to the flow's HTTP GET URL
  (Azure Static Web Apps configuration for production, `.env.local` for local testing).
- **Not configured?** The form degrades gracefully: CRN format is still validated and
  users are told to verify the company manually on the Companies House website.
- **Dev only:** if the frozen Express API happens to be running locally, `VITE_API_URL`
  is used as a fallback proxy.

Implementation: `src/utils/companiesHouse.js` and `src/hooks/useCRNVerification.js`.

<!-- Updated: Jul 2026 - hybrid architecture -->