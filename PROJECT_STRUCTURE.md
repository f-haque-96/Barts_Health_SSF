# Project Structure

- `src/` — the application (React 19 + Vite). This is the only code on the deployment path.
- `public/templates/` — contract agreement templates served by the app.
- `docs/` — documentation; start at [docs/README.md](./docs/README.md).
- `supplier-form-api/` — **FROZEN** retired Express/SQL backend, kept for reference only
  (see [docs/NHS_SSF_Platform_Decision_Addendum.md](./docs/NHS_SSF_Platform_Decision_Addendum.md)).
- `scripts/` — repo utilities (markdown link checker used by CI).
- `staticwebapp.config.json` — Azure Static Web Apps routing/headers config.

<!-- Updated: Jul 2026 - hybrid architecture -->