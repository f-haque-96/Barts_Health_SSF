# Team Standard Operating Procedures — Supplier Setup Form

**Version:** 1.0 | **Date:** July 2026 | **Owner:** Procurement (Fahimul Haque)
One page per team. Every behaviour described here matches the built and tested
application — nothing aspirational.

## Common to all teams

- **How work arrives:** an automatic email to your team's shared mailbox with the
  supplier name, reference number (`SUP-…`), and a direct link to your review page.
  Emails arrive within a few minutes of the previous stage completing (not instantly).
- **Sign-in:** your normal NHS account. Access is controlled by membership of your
  team's SSF group — no separate passwords.
- **Every decision needs your name (digital signature) and, for rejections, a
  written reason.** Decisions are permanent, recorded in the audit trail, and
  visible to later stages.
- **Stuck items:** a summary email lands every Monday 08:00 listing anything waiting
  more than 5 days at your stage.
- **Never send bank details or identity documents by email.** They live only in the
  restricted areas described below.
- **Rejection at any stage is terminal** for that request: the requester is notified
  with your reason, and future attempts to set up the same supplier are automatically
  flagged for heightened scrutiny.

---

## PBP (Procurement Business Partner) panel

**You are the first gate.** Two kinds of items arrive in your queue — check the type
before reviewing:

### 1. Pre-screening questionnaires (reference `QUEST-…`)
Sent by requesters who have **not** yet engaged Procurement. You review the
questionnaire answers (supplier name, goods/services, category, value, rationale).

- **Approve** → the requester automatically receives an **approval certificate by
  email**. They upload it to their form, which unlocks the rest of their submission.
  You don't need to send anything manually — but if a requester says they never got
  it, open the questionnaire record: it shows the stamped decision (who, when) and a
  **Download Approval Certificate** button. Download and email it to them — that's
  the official fallback copy.
- **Reject** (reason required) → the requester's form **locks permanently for that
  supplier**. They are told the supplier is flagged; any fresh attempt to set up the
  same or a similar supplier name is automatically detected (70% similarity) and
  flagged to reviewers.

### 2. Full submissions (reference `SUP-…`)
The complete supplier request. You review the requester's details, justification,
conflict-of-interest declaration and any duplicate-supplier warnings the system
raises. Three decisions:

- **Approve** → goes to the Procurement team for classification. If the requester
  declared a connection to the supplier, a conflict-of-interest alert is raised
  automatically alongside your approval.
- **Request more information** → the requester gets an email with a link to respond.
  Their reply (message + attachments) appears as a conversation thread on your review
  page, and **you get an email when they respond**. This can go back and forth as
  many rounds as needed; approve or reject when satisfied.
- **Reject** (reason required) → terminal, supplier flagged as above.

**Evidence types you may see at question 2.8:** a formal PBP approval certificate,
**or** an email approval trail saved as PDF (requesters who got your approval
directly by email upload the thread). Both are acceptable evidence; the form records
which type was provided.

---

## Procurement team

You receive submissions **after PBP approval**. Your job is classification:

- **Standard supplier** → goes straight to AP Control for bank verification.
- **OPW / IR35** → any engagement involving a worker providing personal service
  (sole traders, personal service companies, intermediaries) → goes to the OPW panel.

On approval you must enter the **Alemba call reference** — the decision cannot be
saved without it. Rejection requires a written reason and is terminal.

---

## OPW panel

You receive submissions classified OPW/IR35. The page tells you the worker
classification automatically (sole trader vs intermediary) based on the form data.

- **Sole trader:** determine **Employed** (→ closed, routed to payroll/ESR — the
  system prevents an Oracle supplier record being created) or **Self-employed**
  (→ onward, with or without a contract requirement — you choose).
- **Intermediary:** determine **Inside IR35** (record SDS issued + date → closed,
  payroll route) or **Outside IR35** (→ onward, with or without a contract
  requirement).
- Every determination requires your **written rationale** and signature — the button
  stays disabled until both are entered. Rejection requires a reason and confirmation.

Where a contract is required, the correct agreement template (Sole Trader Agreement
or Consultancy/Outside-IR35 Agreement) is attached to the record automatically for
the Contract Drafter.

---

## Contract Drafter

You receive submissions where the OPW panel required an agreement. The page shows
the OPW determination and highlights which template applies.

1. **Send:** pick the template, write instructions, send to the supplier. The
   negotiation itself happens **by email with the supplier** (external suppliers
   cannot log into Trust systems); internal exchanges with the requester are
   recorded on the page.
2. **Finalise:** when the signed agreement comes back, upload it (**PDF or Word,
   max 3 MB**), add your signature and comments, and **Submit to AP Control**.

---

## AP Control

You are the final gate before a vendor exists. Submissions arrive after Procurement
(standard) or after contract completion (OPW route).

- **Where the bank details are:** the requester's typed bank details are in the
  restricted **SSF-BankDetails** list (only your team and admins can open it); the
  supplier's **letterhead document** is in the SensitiveDocuments library.
  **Cross-check one against the other — a mismatch is exactly what this design is
  for.** If they disagree, do not verify: reject with the discrepancy as the reason,
  or query the requester.
- Mandatory checks: bank details verified + company details verified (VAT / CIS /
  insurance checks appear when applicable — the form may already show an HMRC
  verification result for the VAT number).
- **Complete:** enter the supplier name and the **Oracle vendor number**, sign, and
  complete — the requester is automatically told their vendor number. A complete
  record PDF (with every stage's sign-off) is generated for filing.
- **Payroll-route items** (employed / inside IR35): the page shows the determination
  and blocks vendor creation — nothing for you to verify.
- **Reject:** written reason + signature; terminal and flagged.

---

## What requesters see (for context when they call you)

Their tracking page shows a live stage tracker and plain-English status ("Under
Review by PBP Panel" → … → "Completed — Vendor #12345"). On rejection they see who
rejected, when, and your reason — so write reasons you'd be comfortable being read
back. On completion they're told to raise POs as normal.
