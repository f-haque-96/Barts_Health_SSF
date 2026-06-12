/**
 * Canonical Workflow Status Model
 * Single source of truth for submission Status and CurrentStage values.
 *
 * Every writer (review pages, Section 7 submission) and every reader
 * (work-queue filters, status banners, formatters) MUST use these constants.
 * In the hybrid architecture these are also the exact Choice values of the
 * SharePoint "Status" and "CurrentStage" columns, and the values Power
 * Automate trigger conditions match on — do not rename without updating both.
 *
 * Pipeline:
 *   pending_review ─ PBP ─→ approved ─ Procurement ─┬→ pending_ap_control ──────────────┐
 *                                                   └→ procurement_approved_opw ─ OPW ─┬→ completed_payroll (terminal, ESR)
 *                                                                                      ├→ inside_ir35_sds_issued (terminal)
 *                                                                                      ├→ pending_contract ─→ contract_uploaded ─┐
 *                                                                                      └→ pending_ap_control ────────────────────┤
 *                                                                            AP Control ←──────────────────────────────────────┘
 *                                                                                      └→ completed (terminal, Oracle vendor)
 *   Any stage may set: rejected (terminal) or info_required.
 */

export const STATUS = {
  // Awaiting PBP
  PENDING_REVIEW: 'pending_review',
  INFO_REQUIRED: 'info_required',
  // PBP approved → awaiting Procurement.
  // NOTE: 'approved' (not 'pbp_approved') is the established value; the
  // questionnaire flow (Section 2 unlock, RequesterResponsePage) reads it.
  PBP_APPROVED: 'approved',
  // Procurement approved → awaiting OPW Panel
  PROCUREMENT_APPROVED_OPW: 'procurement_approved_opw',
  // Awaiting Contract Drafter
  PENDING_CONTRACT: 'pending_contract',
  // Contract approved → awaiting AP Control
  CONTRACT_UPLOADED: 'contract_uploaded',
  // Awaiting AP Control (direct route, no contract)
  PENDING_AP_CONTROL: 'pending_ap_control',
  // Terminal states
  COMPLETED: 'completed', // Oracle vendor created by AP Control
  COMPLETED_PAYROLL: 'completed_payroll', // Employed → ESR, no supplier record
  INSIDE_IR35_SDS_ISSUED: 'inside_ir35_sds_issued', // Inside IR35 → SDS issued, ESR
  REJECTED: 'rejected',
};

export const STAGE = {
  PBP: 'pbp',
  PROCUREMENT: 'procurement',
  OPW: 'opw',
  CONTRACT: 'contract',
  AP: 'ap',
  COMPLETED: 'completed',
  COMPLETED_PAYROLL: 'completed_payroll',
  SDS_ISSUED: 'sds_issued',
  REJECTED: 'rejected',
};

/**
 * Statuses that place a submission in each role's work queue.
 * Used by StorageProvider.getWorkQueue (dev) and mirrored by the backend
 * stageStatusMap / SharePoint list views (production).
 */
export const STAGE_QUEUE_STATUSES = {
  [STAGE.PBP]: [STATUS.PENDING_REVIEW, STATUS.INFO_REQUIRED],
  [STAGE.PROCUREMENT]: [STATUS.PBP_APPROVED],
  [STAGE.OPW]: [STATUS.PROCUREMENT_APPROVED_OPW],
  [STAGE.CONTRACT]: [STATUS.PENDING_CONTRACT],
  [STAGE.AP]: [STATUS.PENDING_AP_CONTROL, STATUS.CONTRACT_UPLOADED],
};

/** Terminal statuses — no further workflow action possible. */
export const TERMINAL_STATUSES = [
  STATUS.COMPLETED,
  STATUS.COMPLETED_PAYROLL,
  STATUS.INSIDE_IR35_SDS_ISSUED,
  STATUS.REJECTED,
];

export const isTerminalStatus = (status) => TERMINAL_STATUSES.includes(status);
