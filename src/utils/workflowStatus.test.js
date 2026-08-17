/**
 * Unit tests for the canonical workflow model — the state machine that the
 * whole application (and Power Automate F2) is built on. Run: npm test
 */
import { describe, it, expect } from 'vitest';
import {
  STATUS,
  STAGE,
  STAGE_QUEUE_STATUSES,
  TERMINAL_STATUSES,
  ALLOWED_TRANSITIONS,
  isTerminalStatus,
  isLegalTransition,
} from './workflowStatus';

describe('terminal statuses', () => {
  it('identifies the four terminal states', () => {
    expect(isTerminalStatus(STATUS.COMPLETED)).toBe(true);
    expect(isTerminalStatus(STATUS.COMPLETED_PAYROLL)).toBe(true);
    expect(isTerminalStatus(STATUS.INSIDE_IR35_SDS_ISSUED)).toBe(true);
    expect(isTerminalStatus(STATUS.REJECTED)).toBe(true);
  });
  it('does not treat in-flight states as terminal', () => {
    expect(isTerminalStatus(STATUS.PBP_APPROVED)).toBe(false);
    expect(isTerminalStatus(STATUS.PENDING_AP_CONTROL)).toBe(false);
  });
  it('terminal states have no outgoing transitions', () => {
    for (const t of TERMINAL_STATUSES) {
      expect(ALLOWED_TRANSITIONS[t]).toEqual([]);
    }
  });
});

describe('isLegalTransition — legal happy-path edges', () => {
  const legal = [
    [STATUS.PENDING_REVIEW, STATUS.PBP_APPROVED],
    [STATUS.PENDING_REVIEW, STATUS.INFO_REQUIRED],
    [STATUS.PBP_APPROVED, STATUS.PENDING_AP_CONTROL],
    [STATUS.PBP_APPROVED, STATUS.PROCUREMENT_APPROVED_OPW],
    [STATUS.PROCUREMENT_APPROVED_OPW, STATUS.PENDING_CONTRACT],
    [STATUS.PROCUREMENT_APPROVED_OPW, STATUS.COMPLETED_PAYROLL],
    [STATUS.PROCUREMENT_APPROVED_OPW, STATUS.INSIDE_IR35_SDS_ISSUED],
    [STATUS.PENDING_CONTRACT, STATUS.CONTRACT_UPLOADED],
    [STATUS.CONTRACT_UPLOADED, STATUS.COMPLETED],
    [STATUS.PENDING_AP_CONTROL, STATUS.COMPLETED],
  ];
  it.each(legal)('%s → %s is legal', (from, to) => {
    expect(isLegalTransition(from, to)).toBe(true);
  });
  it('every non-terminal status may be rejected', () => {
    for (const s of Object.values(STATUS)) {
      if (!isTerminalStatus(s)) expect(isLegalTransition(s, STATUS.REJECTED)).toBe(true);
    }
  });
});

describe('isLegalTransition — illegal edges (the forged-PATCH threat)', () => {
  const illegal = [
    // the exact example from the security audit: jump straight to completed
    [STATUS.PENDING_CONTRACT, STATUS.COMPLETED],
    [STATUS.PBP_APPROVED, STATUS.COMPLETED],
    [STATUS.PENDING_REVIEW, STATUS.COMPLETED],
    // skipping OPW
    [STATUS.PBP_APPROVED, STATUS.PENDING_CONTRACT],
    // resurrecting a terminal item
    [STATUS.COMPLETED, STATUS.PENDING_AP_CONTROL],
    [STATUS.REJECTED, STATUS.PBP_APPROVED],
    // backwards
    [STATUS.CONTRACT_UPLOADED, STATUS.PENDING_CONTRACT],
  ];
  it.each(illegal)('%s → %s is REJECTED as illegal', (from, to) => {
    expect(isLegalTransition(from, to)).toBe(false);
  });
  it('an unknown source status is illegal', () => {
    expect(isLegalTransition('made_up_status', STATUS.COMPLETED)).toBe(false);
  });
});

describe('isLegalTransition — edge cases', () => {
  it('missing "from" (creation event) is legal', () => {
    expect(isLegalTransition(null, STATUS.PBP_APPROVED)).toBe(true);
    expect(isLegalTransition('', STATUS.PENDING_REVIEW)).toBe(true);
  });
  it('same status (echo / no-op) is legal', () => {
    expect(isLegalTransition(STATUS.PENDING_AP_CONTROL, STATUS.PENDING_AP_CONTROL)).toBe(true);
  });
});

describe('model integrity', () => {
  it('every ALLOWED_TRANSITIONS key and target is a real STATUS', () => {
    const valid = new Set(Object.values(STATUS));
    for (const [from, tos] of Object.entries(ALLOWED_TRANSITIONS)) {
      expect(valid.has(from)).toBe(true);
      for (const to of tos) expect(valid.has(to)).toBe(true);
    }
  });
  it('every STATUS appears in ALLOWED_TRANSITIONS (no orphan states)', () => {
    for (const s of Object.values(STATUS)) {
      expect(ALLOWED_TRANSITIONS[s]).toBeDefined();
    }
  });
  it('every queue status is a real STATUS and every stage is real', () => {
    const validStatus = new Set(Object.values(STATUS));
    const validStage = new Set(Object.values(STAGE));
    for (const [stage, statuses] of Object.entries(STAGE_QUEUE_STATUSES)) {
      expect(validStage.has(stage)).toBe(true);
      for (const s of statuses) expect(validStatus.has(s)).toBe(true);
    }
  });
});
