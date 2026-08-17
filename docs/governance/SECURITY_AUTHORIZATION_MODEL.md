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

### 4a. SSF-BankDetails — requester needs Add-WITHOUT-Read (found Aug 2026)

Same contradiction as §4, on the restricted bank list. `saveSubmission()` has
the **requester's own delegated token** POST a row into `SSF-BankDetails`
*before* creating the main item — but that list is restricted to AP + Admin,
so a plain restriction makes **production submission fail at that line**. The
requester needs Add-only there too, and it must be Graph-tested:

| # | Operation (requester delegated token) | Required |
|---|---|---|
| 1 | POST own SSF-BankDetails row | ✅ succeeds |
| 2 | GET SSF-BankDetails collection (enumerate) | ❌ denied |
| 3 | GET own bank row after creation | ❌ denied |
| 4 | GET another submission's bank row | ❌ denied |
| 5 | PATCH / DELETE any bank row | ❌ denied |
| 6 | AP Control token: GET the row | ✅ succeeds |

Add-only + no item-level "read own" is the intended shape — the requester
writes their bank details in once and can never read them back. Verify the
POST actually succeeds under that level (SharePoint "Add Items" without "View
Items" is the mechanism; prove it with Graph, don't trust the label).

### 4b. SensitiveDocuments — requester needs upload-WITHOUT-browse (found Aug 2026)

The requester's token uploads passport/licence images into
`SensitiveDocuments`, which is restricted to Contract/AP/Admin. Same problem:
the upload would fail. Define the minimum requester **upload-only** grant:

| # | Operation (requester delegated token) | Required |
|---|---|---|
| 1 | PUT own ID document into SensitiveDocuments/<id>/ | ✅ succeeds |
| 2 | GET/list SensitiveDocuments (browse) | ❌ denied |
| 3 | GET another submission's restricted file | ❌ denied |
| 4 | Ideally: GET own file back after upload | ❌ denied (unless the process needs it) |
| 5 | Contract/AP token: GET where required | ✅ succeeds |

Preferred mechanism: per-submission upload folders with Add/Contribute-upload
but no browse at library root, OR a scoped "drop" folder. Test the actual
Graph PUT + subsequent GET behaviour with a real requester account.

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

**Hardenings:**
1. **[PRE-GO-LIVE CONTROL]** Add a transition-legality Condition to F2, driven
   by `ALLOWED_TRANSITIONS` in `src/utils/workflowStatus.js` (now defined and
   unit-tested; `isLegalTransition(from,to)`). A change whose
   (LastStatus → Status) pair is not a legal edge must **not** route
   downstream — alert SSF-Admin instead. **Elevated from "recommended" to a
   blocker (Aug 2026):** detection-only is insufficient because the flows
   *act* on a forged transition before it's detected — a direct PATCH to
   `completed` emails the requester "vendor created", drops the item out of
   every queue, and marks the supplier live. The audit row the next day
   cannot un-send that. For a state machine the transition IS the
   security-sensitive action and must be gated where the user cannot bypass
   it. A client-side pre-check now exists in `GraphStorageProvider`
   (`ILLEGAL_TRANSITION`), but that only stops the honest app — F2 is the
   authoritative gate against a hand-crafted Graph PATCH.
   *Build spec for the browser agent:* in F2, after the Get-item refetch, add
   a Condition comparing (LastStatus, Status) against the allowed-edge list
   below; on no-match, Terminate + email SSF-Admin, do not run the Switch.
2. **[PRE-GO-LIVE CONTROL]** Replace reviewer Contribute with a custom
   **"Contribute minus Delete"** level on SSF-Submissions (stops silent
   deletion). Separate control from #1.
3. Append-only audit + versioning remain for attributability of anything the
   above don't prevent (e.g. a reviewer editing a same-stage field) — with
   vetted named staff that is a defensible residual posture *if IG agrees*
   (§6).

**Legal transition edges (mirror into F2 — authoritative source is
`ALLOWED_TRANSITIONS`):**
```
pending_review            → approved | info_required | rejected
info_required             → approved | pending_review | rejected
approved                  → pending_ap_control | procurement_approved_opw | rejected
procurement_approved_opw  → pending_contract | pending_ap_control |
                            completed_payroll | inside_ir35_sds_issued | rejected
pending_contract          → contract_uploaded | rejected
contract_uploaded         → completed | rejected
pending_ap_control        → completed | rejected
(completed | completed_payroll | inside_ir35_sds_issued | rejected = terminal)
```

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

## 8. Pre-UAT security checklist (five mandatory controls + one IG decision)

Nothing goes to UAT with real Trust data until all five are proven with a real
delegated Graph account (needs the App Registration first), and the IG
decision is recorded.

1. [ ] **Requester permission model proven** — creates own submission; edits
       own item where the info-required round-trip requires; CANNOT
       enumerate / read-other / edit-other / delete (§4 matrix).
2. [ ] **Bank list Add-only proven** — requester can POST their bank row,
       cannot subsequently read/browse/edit/delete it; AP can read (§4a).
3. [ ] **SensitiveDocuments upload-only proven** — requester can upload
       required ID, cannot browse/retrieve unrelated restricted files;
       appropriate reviewers can access (§4b).
4. [ ] **Reviewer Delete removed** — Contribute-minus-Delete on
       SSF-Submissions (§5.2).
5. [ ] **F2 transition-legality enforced** — impossible transitions never
       route (§5.1).

Then, separately:
- [ ] **IG / data-owner decision on cross-stage reviewer read access** (§6) —
      a risk-acceptance decision, not a programming bug.

Plus re-verify the §2 good controls with real (non-admin) accounts during UAT.
