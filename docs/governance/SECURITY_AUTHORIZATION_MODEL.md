# SSF Security & Authorization Model — audit record and open decisions

**Date:** August 2026 (adversarial code audit) | **Owner:** Fahimul Haque
**Status:** two fixes implemented; one SharePoint permission change PROPOSED
(not applied); one risk decision OPEN for IG/security.

This document records what the code **actually enforces** (verified by
inspection and automated tests against the mock Graph environment), as
distinct from what the design intends. It exists because the June 2026
architecture pivot (Express/SQL → browser→Graph→SharePoint) **moved the
trust boundary**: there is no app server to arbitrate access, so the
effective security boundary is the intersection of (a) the SharePoint
permissions carried by each signed-in user's own delegated token and
(b) the app registration's `Sites.Selected` grant. React/UI checks are UX,
not security.

## 1. The layer model (agreed hierarchy)

1. **SharePoint permissions** — the real authorization boundary.
2. **Filtered Graph queries / provider guards** — least-data retrieval,
   defence in depth (cannot stop a hand-crafted Graph call).
3. **React role/stage checks** — UX protection only.

`Sites.Selected` constrains the **app's** reach (this SPA cannot touch any
other Trust site). It does not create intra-site, per-item authorization.

## 2. Verified good controls (keep; retest at UAT with real accounts)

| Control | Layer | Verified how |
|---|---|---|
| SSF-BankDetails restricted to SSF-APControl + SSF-Admin | SharePoint (layer 1) | Permission screenshots 11 Jul 2026; 403 path exercised in graphsmoke 5b |
| SensitiveDocuments restricted to Contract/APControl/Admin | SharePoint (layer 1) | Permission screenshots 11 Jul 2026 |
| SSF-AuditTrail append-only for reviewer groups (custom "Add Only" level) | SharePoint (layer 1) | Built + verified 11 Jul 2026 → the "tamper-evident audit trail" claim is genuine, **scoped to this list** |
| Bank details never in FormDataJSON; typed values only in SSF-BankDetails | Provider (layer 2) | graphsmoke rules-1 assertions |
| No secrets in the client bundle (flow API keys live in Power Automate; MSAL client ID is a public identifier) | build | env-var sweep Aug 2026 |
| Optimistic concurrency (If-Match, 412 → user-visible conflict) | Provider + pages | graphsmoke conflict tests |
| List versioning ON everywhere | SharePoint | playbook tasks — every edit is historized and attributable |

## 3. Fixes implemented in code (Aug 2026, tested in graphsmoke 20/20)

1. **`getBankDetails(id)`** — the AP page previously read bank fields from
   `formData`, which production deliberately strips → the letterhead
   cross-check would have rendered blank. AP now reads the restricted list
   (the SharePoint permission IS the boundary), with explicit
   denied/missing states. Dev provider mirrors the shape.
2. **Requester ownership guard + `getMySubmissions()`** — sessions with no
   reviewer roles can only retrieve their own submissions through the app,
   and requester views can query by `RequesterEmail eq UPN`. **Honestly
   labelled defence-in-depth (layer 2)** — it narrows what the application
   exposes; it does not constrain a hand-crafted Graph call.

## 4. PROPOSED (not applied): requester "Add Only" permission level

The design doc previously claimed requesters have "no direct list access" —
**impossible under delegated auth**: the requester's own token performs the
submission write. Unresolved, this gets "fixed" at go-live by granting
requesters broad access. Do not do that. Proposal:

- Custom permission level **`SSF-AddOnly`** on SSF-Submissions for all
  authenticated staff: Add Items, View Pages, Open — **without** View Items
  browse/edit/delete. (Same mechanism already used for SSF-AuditTrail.)
- Same approach for SupplierDocuments/SensitiveDocuments uploads (Add
  without browse), or route requester uploads via AddOnly folders.

**Formal Graph test matrix — execute with a real test user holding ONLY the
proposed level, before UAT.** ⚠️ SharePoint "add without view" behaves
subtly with Graph (item creation returns the created item; `$filter` reads
may partially work depending on level flags) — the matrix is the proof,
not the level's name:

| # | Operation (delegated token of test requester) | Required result |
|---|---|---|
| 1 | POST create submission A | ✅ succeeds |
| 2 | GET list items (enumerate SSF-Submissions) | ❌ denied/empty |
| 3 | GET submission B by known Title/ID | ❌ denied |
| 4 | PATCH own submission A after creation | ❌ denied (app-side requester responses are written by… see note) |
| 5 | PATCH submission B | ❌ denied |
| 6 | DELETE A or B | ❌ denied |
| 7 | GET SSF-BankDetails (any) | ❌ denied |
| 8 | GET SensitiveDocuments file of B | ❌ denied |
| 9 | Complete every requester-facing app operation (submit incl. bank row create, upload letterhead/ID, view own /respond page, reply to info request) | ✅ all work |

**Known tension to resolve during the matrix:** rows 4 and 9 conflict —
the info-required round-trip has the requester's token PATCHing their own
item (response + AwaitingParty). Either the level must permit *edit of
own items* (SharePoint: "Add Items + Edit Items" with item-level
"Create items and edit items that were created by the user" list setting —
the likely correct configuration), or requester responses need a flow-based
write path. **The item-level list setting ("Read items that were created by
the user" + "Create and edit items that were created by the user") on
SSF-Submissions is probably the cleanest whole answer for requesters and
should be tested first** — it was previously ruled out for *reviewers*
(who need cross-item access) but was never evaluated for the requester
grant specifically.

## 5. Direct-PATCH / state-machine audit (asked Aug 2026 — honest answers)

Reviewer groups hold standard **Contribute** on SSF-Submissions. Contribute
= view + add + **edit + delete**. Therefore, by their own delegated token,
today a reviewer technically CAN:

| Operation | Possible? | Mitigation in place |
|---|---|---|
| Read items at any stage | ✅ yes | UI-only gating (see §6 decision) |
| PATCH Status directly (jump the state machine) | ✅ yes | Versioning + F2 audit row records Editor + Prev→New status: **detectable and attributable, not preventable** |
| Set VendorNumber / RequesterEmail / another stage's ReviewJSON | ✅ yes | Same: versioned + attributable |
| DELETE a submission | ✅ yes | Recycle bin (93 days) + version history; still undesirable |
| Modify/delete SSF-AuditTrail entries | ❌ no | Add Only level (verified) |
| Read/replace SensitiveDocuments (PBP/Proc/OPW) | ❌ no | Library permissions (verified) |
| Read SSF-BankDetails (non-AP) | ❌ no | List permissions (verified) |

**Do the flows trust a forged transition? Yes.** F2 validates change
(Status ≠ LastStatus after a Get-item refetch) but not transition
*legality*; a direct PATCH to `completed` would email the requester
"vendor created". The flows automate; they do not authorize.

**Recommended hardenings (proposed, not yet applied):**
1. Replace reviewer Contribute with a custom **"Contribute minus Delete"**
   level on SSF-Submissions (removes silent deletion; cheap).
2. Add a transition-legality Condition to F2 (allowed Prev→Next map from
   `workflowStatus.js`); illegal transition → alert SSF-Admin instead of
   routing the case onward. Buildable by the browser agent; modest effort.
3. Keep relying on append-only audit + versioning for attributability —
   with vetted named staff, detection-plus-attribution is a defensible
   posture *if IG agrees* (§6).

## 6. OPEN DECISION for IG / security / data owner — not a developer call

> **Current design:** the five reviewer groups hold list-level Contribute
> across ALL of SSF-Submissions.
> **Application behaviour:** the UI restricts each reviewer to their
> workflow stage.
> **Technical reality:** stage-level isolation is NOT enforced at the
> SharePoint layer; an authenticated reviewer can retrieve or modify items
> outside their stage via direct Graph calls. SSF-Submissions contains
> personal data (requester/contact details), employment-status/IR35
> assessment material, and commercially sensitive information.
> **Decision required:** (a) implement stronger authorization (item-level
> permissions were ruled out for admin overhead at ~700–3,500 items/yr;
> a broker/flow-mediated write model is a v2-scale change), or
> (b) formally accept the residual risk on the basis of vetted named-group
> membership + append-only audit + versioning + the §5 hardenings.
> **This acceptance, if chosen, must be recorded by IG/the data owner in
> the DPIA — not assumed by the project.**

## 7. Language corrections for external claims (CV/DPIA/briefings)

| Instead of… | Say… |
|---|---|
| "tamper-evident audit trail" | "append-only audit list (reviewers can add, not edit/delete) plus full version history" — scoped claim, verified |
| "sensitive data auto-deleted on completion" | "ID documents auto-deleted by flow on closure; deletion failures surface in flow run history + weekly failure digest (manual re-run; no automatic retry); letterheads retained for AP; retention schedule to be agreed with IG" |
| "RBAC" | "role-based UI with SharePoint group/library-level authorization; stage-level isolation is UI-only pending the §6 decision" |
| "zero server infrastructure" | "no dedicated application server or database to provision and maintain" |
| "recorded forever" | "recorded with versioning; retention per Trust policy (to be set with IG)" |

## 8. Pre-UAT blockers arising from this audit

- [ ] Execute the §4 requester permission test matrix with a real test
      account (after App Registration exists)
- [ ] §6 decision recorded by IG/data owner
- [ ] §5 hardening 1 (Contribute-minus-Delete) applied or explicitly declined
- [ ] Re-verify §2 controls with real (non-admin) accounts during UAT
