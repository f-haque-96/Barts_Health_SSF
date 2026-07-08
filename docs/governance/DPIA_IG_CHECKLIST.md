# DPIA & Information Governance Checklist
## NHS Supplier Setup Smart Form (SSF) — Hybrid Architecture

**Version:** 1.0 | **Date:** June 2026 | **Author:** Fahimul Haque (Procurement)
**Status:** DRAFT FOR IG REVIEW
**Architecture under assessment:** React SPA (Azure Static Web Apps) + SharePoint
lists/libraries (Barts Health M365 UK tenancy) + Power Automate + Azure AD SSO.
See `docs/NHS_SSF_Platform_Decision_Addendum.md`.

---

## 1. Screening — is a full DPIA required?

| Question | Answer | Note |
|---|---|---|
| Patient or clinical data processed? | **No** | Procurement workflow only |
| Special category data (Art. 9)? | **No** | |
| Identity documents processed? | **Yes** | Sole traders' passport / driving licence images |
| Financial data of identifiable individuals? | **Yes** | Sole traders' personal bank details |
| Systematic evaluation / scoring? | Partial | Fuzzy-match flagging of previously rejected suppliers |
| Large scale? | No | 100–300 records/year |

**Conclusion:** identity documents + personal financial data of sole traders mean a
**full DPIA is recommended** even though no ICO mandatory criterion is decisively met.
- [ ] IG team confirms DPIA scope

## 2. Data inventory

| Category | Examples | Classification | Location | Retention | Access |
|---|---|---|---|---|---|
| Requester (staff) details | Name, job title, dept, NHS email, phone | OFFICIAL | SSF-Submissions list | 7 yrs (Trust RM policy) | SSF review groups |
| Supplier company data | Company name, CRN, VAT, address | OFFICIAL (largely public) | SSF-Submissions list | 7 yrs | SSF review groups |
| Supplier contact persons | Name, email, phone | OFFICIAL | SSF-Submissions list | 7 yrs | SSF review groups |
| Conflict-of-interest declarations | Connection details free text | OFFICIAL-SENSITIVE | SSF-Submissions list | 7 yrs | SSF review groups |
| **Bank details** | Sort code, account no., IBAN (letterhead + typed values) | OFFICIAL-SENSITIVE | SensitiveDocuments library (letterhead) **+ SSF-BankDetails list with unique permissions** (typed values for AP cross-check — Option B, decided July 2026) — never in the main submissions list | 7 yrs | AP Control, Admin (list); AP Control, Contract, Admin (library) |
| **Identity documents** | Passport / driving licence images (sole traders) | OFFICIAL-SENSITIVE | SensitiveDocuments library | **Deleted on completion/rejection** (automated flow F3) | AP Control, Contract, Admin |
| IR35/CEST documents | CEST PDF, SDS records | OFFICIAL | SensitiveDocuments | 7 yrs | OPW, Contract, AP, Admin |
| Workflow decisions & audit | Approvals, rejections, who/when | OFFICIAL | SSF-Submissions + SSF-AuditTrail | 7 yrs | SSF review groups (audit list append-only) |

- [ ] Retention periods confirmed against Trust Records Management Policy
- [ ] Confirm 7-year retention does not apply to ID images (deleted at completion)

## 3. Lawful basis & necessity

- [ ] Confirm lawful basis: **Art. 6(1)(e) public task** (Trust procurement function)
      — preferred over legitimate interest for an NHS body; IG to confirm.
- [ ] Necessity: ID documents are collected **only** for sole traders not registered
      with Companies House (fraud prevention for individual payees). Confirm IG accepts
      this justification and the explicit consent checkbox wording in Section 3.
- [ ] Proportionality: bank details collected once, seen only by AP Control; duplicate
      / rejected-supplier flagging is limited to procurement-fraud prevention.
- [ ] Privacy notice: add a supplier-facing privacy paragraph to the form footer and
      the requester guidance (what is collected, why, retention, rights, DPO contact).

## 4. Data subject rights (suppliers / sole traders are data subjects)

| Right | How honoured |
|---|---|
| Access (SAR) | Search SSF-Submissions + libraries by company/contact name; export item + documents |
| Rectification | Edit list item (versioned); audit entry records change |
| Erasure | Delete item + documents; note Art. 17(3) — financial/audit records may be retained under public-task basis; IG to advise standard response |
| Objection | Route via Procurement helpdesk to IG |

- [ ] SAR handling route agreed with IG (who searches, who approves release)

## 5. Security measures (hybrid architecture)

- [ ] All data in Trust M365 UK tenancy; no third-party processors beyond the existing
      Microsoft DPA; Companies House receives only the public CRN
- [ ] Azure AD SSO + Trust MFA/conditional access applies automatically
- [ ] RBAC via SharePoint groups (SSF-PBP/Procurement/OPW/Contract/APControl/Admin)
- [ ] SensitiveDocuments library: unique permissions (Contract/AP/Admin only),
      sharing links disabled, Alemba sync excluded
- [ ] Bank details never stored in the main submissions list; typed values live only
      in the restricted SSF-BankDetails list (AP Control + Admin), kept for
      cross-checking against the letterhead — discrepancies between the two have
      caught errors/fraud in the past (Option B in `06-hybrid-sharepoint-flows.md`,
      decided July 2026)
- [ ] Encryption at rest/in transit: Microsoft 365 default (BitLocker/TLS)
- [ ] Audit: SSF-AuditTrail append-only list + SharePoint versioning + M365 audit log
- [ ] Browser-side: bank details and document content are excluded from the
      **draft** localStorage persistence (code control in
      `src/stores/formStore.js`); drafts contain form text only.
      **Disclosed limitation:** attachments added during info-required /
      contract exchanges and questionnaire uploads pass through the storage
      layer as base64; in production the Graph provider uploads these to the
      document libraries and stores only name + link (rule 2 in
      `06-hybrid-sharepoint-flows.md` §4b) — this rule is a go-live
      precondition, not yet implemented while the app runs in dev/demo mode
- [ ] Automated deletion of ID documents on completion/rejection (flow F3) — tested

## 6. Risks & mitigations

| # | Risk | L×I | Mitigation | Residual |
|---|---|---|---|---|
| 1 | ID document images retained longer than needed | M×H | Flow F3 auto-deletes on terminal status; quarterly spot-check by Admin | Low |
| 2 | Bank details exposed to non-AP staff | M×H | Restricted SensitiveDocuments library + SSF-BankDetails list with unique permissions (AP Control/Admin only); nothing in the main list (Option B) | Low |
| 3 | SharePoint oversharing via links | M×M | Sharing links disabled on both libraries; site-level access review every 6 months | Low |
| 4 | Power Automate flows owned by one personal account | H×M | Co-owners (SSF-Admin), service account for connections before go-live | Low |
| 5 | Shared NHS workstation: draft form data in browser localStorage | M×M | Bank details + document content excluded from persistence; session guidance in form | Low |
| 6 | Rejected-supplier flagging produces false positives affecting legitimate suppliers | L×M | Flag is advisory; human reviewer makes the decision; reason recorded in audit | Low |
| 7 | Requester sees another requester's submission | L×M | SPA filters by signed-in UPN; requesters have no direct list access | Low |

- [ ] IG to confirm risk scoring and residual acceptance

## 7. DSPT / DTAC applicability

- **DSPT:** applies (staff and supplier personal data in Trust systems). This system
  inherits the Trust's M365 DSPT controls; no new infrastructure to declare.
- **DTAC:** primarily for patient-facing/clinical digital health technologies —
  **expected N/A** (no patient data, internal workflow tool). IG to confirm and
  record the exemption rationale.
- [ ] DSPT inheritance confirmed
- [ ] DTAC exemption recorded

## 8. Sign-off

| Role | Name | Date | Outcome |
|---|---|---|---|
| Information Asset Owner (Procurement) | | | |
| IG Lead | | | |
| Data Protection Officer | | | |
| SIRO (if escalated) | | | |
| Caldicott Guardian | — | — | Expected N/A (no patient data) — confirm |

**Go-live condition:** sections 1, 3, 5 and 8 complete; risk register (section 6)
accepted by the IAO and IG Lead.
