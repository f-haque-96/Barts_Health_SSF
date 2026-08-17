# End-to-end / integration test harness

Browser-driven tests that exercise the **real application UI** across the full
supplier-onboarding workflow. Playwright-core driving installed Microsoft Edge
(no separate browser download). These run **locally / nightly**, not in the
GitHub CI job, because they need a running dev server plus mock backend
services — the fast browser-free unit tests (`npm test`, Vitest) are what runs
in CI.

## What each script proves

| Script | Coverage |
|---|---|
| `freshrun.js` | Submits a fresh base form through all 7 sections via the real UI; writes `baseid.txt` + `state.json` for the suite to build on |
| `suite.js <stage>` | The 14 workflow routes. Stages: `pbp proc opw opw2 contract contract2 ap` — PBP approve/reject/info round-trip, Procurement standard/OPW/reject, all six OPW determinations, contract send/upload, AP complete (both routes) + reject |
| `requesterview.js` | The `/respond/` page renders correctly for all 12 outcome states (22 assertions) |
| `contractloop.js` | Full contract negotiation loop: send agreement → portal reply → drafter reply → upload → approve (14 assertions) |
| `staleflip.js` | Conditional-field clearing when a controlling answer flips (VAT/DUNS/PL/overseas/connection); Section-7 gating (7 assertions) |
| `apvatprobe.js` | VAT Determination at AP Control — gating, COS suggestion, save, auto no-VAT path (7 assertions) |
| `graphsmoke.js` | The **production `GraphStorageProvider`** against a mock Graph/SharePoint server — bank-detail separation, upload externalisation, UPN stamping, optimistic concurrency (412), **plus the Aug-2026 security assertions**: restricted bank-list 403 handling, foreign-requester denial (20 assertions) |

## Mock services (stand in for external systems, no secrets, no tenant)

- `mock-graph.js` (:3996) — in-memory Graph/SharePoint for `graphsmoke.js`; honours `If-Match` (412 on stale etag), simulates SharePoint 403 on the restricted bank list, `/__setuser` to switch identity, `/__dump` to assert state.
- `mock-ch-flow.js` (:3999) — Companies House proxy stand-in.
- `mock-vat-flow.js` (:3998) — HMRC VAT proxy stand-in.

## Running

```bash
# 1. Install Playwright core in this folder (one-off)
npm install playwright-core

# 2a. Workflow suite — needs the app in dev mode:
#     (repo root) npm run dev
node freshrun.js
node suite.js pbp && node suite.js proc && node suite.js opw
node suite.js opw2 && node suite.js contract && node suite.js contract2 && node suite.js ap2

# 2b. Graph provider + security suite — needs the mock + graphtest mode:
node mock-graph.js &
#     (repo root) npm run dev -- --mode graphtest
node graphsmoke.js
```

Gotchas and full route notes: see `../docs/` and the project memory. Suite
stages share `state.json`; always `freshrun.js` before a full pass. The suite
runs as an admin identity (dev auth), so a green run proves workflow logic,
**not** non-admin authorization — that is verified separately by
`graphsmoke.js` (mock) and, before UAT, by the real-account Graph test matrix
in `../docs/governance/SECURITY_AUTHORIZATION_MODEL.md`.
