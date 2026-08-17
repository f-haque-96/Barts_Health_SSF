// Verifies what the REQUESTER sees on /respond/<id> for every workflow
// outcome (July 2026 straight-to-Procurement model).
// Run with the dev server up: node requesterview.js
const { BASE, launch } = require('./helpers');
const fs = require('fs');

const baseId = fs.readFileSync(__dirname + '/baseid.txt', 'utf8').trim();
const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  PASS' : '! FAIL'} ${name}${detail ? ' | ' + detail : ''}`);
}

async function seed(page, id, patch) {
  await page.evaluate(({ baseId, id, patch }) => {
    const base = JSON.parse(localStorage.getItem(`submission_${baseId}`));
    const sub = {
      ...base, id, submissionId: id,
      pbpReview: base.pbpReview, procurementReview: null, opwReview: null,
      contractDrafter: null, apReview: null, apControlReview: null,
      // clear terminal-state leftovers the base may carry from suite runs
      vendorNumber: null, completedAt: null, finalStatus: null,
      requiresOPW: null, outcomeRoute: null, alembaReference: null,
      ...patch,
      formData: { ...base.formData, ...(patch.formData || {}) },
    };
    localStorage.setItem(`submission_${id}`, JSON.stringify(sub));
  }, { baseId, id, patch });
}

async function view(page, id) {
  await page.goto(`${BASE}/respond/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  return page.evaluate(() => document.body.innerText);
}

const PROC_OK = { classification: 'standard', supplierClassification: 'standard', decision: 'approved', comments: 'ok', alembaReference: '3153684', signature: 'Proc Reviewer', date: '2026-07-08' };
const PROC_OPW = { ...PROC_OK, classification: 'opw_ir35', supplierClassification: 'opw_ir35' };

(async () => {
  const { browser, page } = await launch(true);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  try {
    // 1. Fresh full submission -> at Procurement, PBP shown approved, NO questionnaire banner
    // (seeded from base: same shape as a just-submitted form)
    await seed(page, 'SUP-2026-RVFRESH1', { status: 'approved', currentStage: 'procurement' });
    let t = await view(page, 'SUP-2026-RVFRESH1');
    record('fresh full form: badge "Under Review by Procurement Team"', /Under Review by Procurement Team/.test(t));
    record('fresh full form: PBP timeline step Approved', /PBP Review/.test(t) && /Approved/.test(t));
    record('fresh full form: NO "Questionnaire Approved" banner', !/Questionnaire Approved/.test(t));

    // 2. At OPW
    await seed(page, 'SUP-2026-RVOPW001', { status: 'procurement_approved_opw', currentStage: 'opw', procurementReview: PROC_OPW });
    t = await view(page, 'SUP-2026-RVOPW001');
    record('at OPW: badge "Under Assessment by OPW Panel"', /Under Assessment by OPW Panel/.test(t));

    // 3. At Contract
    await seed(page, 'SUP-2026-RVCON001', { status: 'pending_contract', currentStage: 'contract', procurementReview: PROC_OPW, opwReview: { workerClassification: 'sole_trader', employmentStatus: 'self_employed', decision: 'approved' } });
    t = await view(page, 'SUP-2026-RVCON001');
    record('at Contract: badge "Contract Under Review"', /Contract Under Review/.test(t));
    record('at Contract: OPW step shows Self-Employed', /Self-Employed/.test(t));

    // 4. At AP
    await seed(page, 'SUP-2026-RVAP0001', { status: 'pending_ap_control', currentStage: 'ap', procurementReview: PROC_OK });
    t = await view(page, 'SUP-2026-RVAP0001');
    record('at AP: badge "Bank Details Verification in Progress"', /Bank Details Verification in Progress/.test(t));
    record('at AP (standard): OPW/Contract hidden or Not Required', !/Under Assessment by OPW/.test(t));

    // 5. Completed with vendor
    await seed(page, 'SUP-2026-RVDONE01', { status: 'completed', currentStage: 'completed', procurementReview: PROC_OK, apControlReview: { verified: true, decision: 'approved' }, vendorNumber: 'VND-100042', completedAt: new Date().toISOString() });
    t = await view(page, 'SUP-2026-RVDONE01');
    record('completed: "Supplier Setup Complete" notice', /Supplier Setup Complete/.test(t));
    record('completed: vendor number shown', /VND-100042/.test(t));

    // 6. Sole trader EMPLOYED -> payroll terminal
    await seed(page, 'SUP-2026-RVPAY001', { status: 'completed_payroll', currentStage: 'completed_payroll', procurementReview: PROC_OPW, opwReview: { workerClassification: 'sole_trader', employmentStatus: 'employed', decision: 'approved', reviewedAt: new Date().toISOString() }, outcomeRoute: 'payroll_esr', completedAt: new Date().toISOString(), formData: { supplierType: 'sole_trader' } });
    t = await view(page, 'SUP-2026-RVPAY001');
    record('payroll: badge "Payroll/ESR Route (No Supplier Record)"', /Payroll\/ESR Route \(No Supplier Record\)/.test(t));
    record('payroll: outcome notice present', /Outcome: Payroll \/ ESR Route/.test(t));
    record('payroll: OPW step "Employed — Payroll Route"', /Employed — Payroll Route/.test(t));
    record('payroll: Contract/AP steps Not Required', /Not Required/.test(t));
    record('payroll: final step no vendor record', /No Vendor Record/.test(t));

    // 7. Intermediary INSIDE IR35 -> SDS terminal
    await seed(page, 'SUP-2026-RVSDS001', { status: 'inside_ir35_sds_issued', currentStage: 'sds_issued', procurementReview: PROC_OPW, opwReview: { workerClassification: 'intermediary', ir35Status: 'inside', decision: 'approved', sdsTracking: { issued: true } }, outcomeRoute: 'payroll_esr' });
    t = await view(page, 'SUP-2026-RVSDS001');
    record('SDS: badge "Inside IR35 - SDS Issued"', /Inside IR35 - SDS Issued/.test(t));
    record('SDS: outcome notice present', /Outcome: Inside IR35 — SDS Issued/.test(t));

    // 8-10. Rejections at each stage
    await seed(page, 'SUP-2026-RVREJP01', { status: 'rejected', currentStage: 'rejected', procurementReview: { decision: 'rejected', comments: 'Duplicate vendor exists.' } });
    t = await view(page, 'SUP-2026-RVREJP01');
    record('rejected@Procurement: notice + team + reason', /Supplier Request Rejected/.test(t) && /Procurement/.test(t) && /Duplicate vendor exists/.test(t));

    await seed(page, 'SUP-2026-RVREJO01', { status: 'rejected', currentStage: 'rejected', procurementReview: PROC_OPW, opwReview: { decision: 'rejected', rejectionReason: 'Fails IR35 assessment.' } });
    t = await view(page, 'SUP-2026-RVREJO01');
    record('rejected@OPW: notice + team + reason', /Supplier Request Rejected/.test(t) && /OPW Panel/.test(t) && /Fails IR35 assessment/.test(t));

    await seed(page, 'SUP-2026-RVREJA01', { status: 'rejected', currentStage: 'rejected', procurementReview: PROC_OK, apReview: { decision: 'rejected', rejectionReason: 'Bank details do not match letterhead.' } });
    t = await view(page, 'SUP-2026-RVREJA01');
    record('rejected@AP: notice + team + reason', /Supplier Request Rejected/.test(t) && /AP Control/.test(t) && /Bank details do not match/.test(t));

    // 11-12. Questionnaire outcomes keep their own messaging
    await page.evaluate(() => {
      const mk = (id, status, extra) => {
        const sub = { id, submissionId: id, status, currentStage: 'pbp', type: 'questionnaire', isQuestionnaire: true, questionnaireType: 'nonClinical', submissionDate: new Date().toISOString(), submittedBy: 'test.requester@nhs.net', formData: { companyName: 'Quest View Ltd', supplierName: 'Quest View Ltd', serviceCategory: 'non-clinical', nhsEmail: 'test.requester@nhs.net', nonClinicalQuestionnaire: { supplierName: 'Quest View Ltd' } }, pbpReview: { decision: status, finalComments: 'Quest decision comment.', signature: 'PBP Reviewer', date: '2026-07-08', exchanges: [], ...extra } };
        localStorage.setItem(`submission_${id}`, JSON.stringify(sub));
      };
      mk('QUEST-RV-APPROVED', 'approved');
      mk('QUEST-RV-REJECTED', 'rejected');
    });
    t = await view(page, 'QUEST-RV-APPROVED');
    record('questionnaire approved: banner + certificate button', /Questionnaire Approved/.test(t) && /Download Approval Certificate/.test(t));
    t = await view(page, 'QUEST-RV-REJECTED');
    record('questionnaire rejected: banner', /Questionnaire Rejected/.test(t));

  } finally {
    const fails = results.filter((r) => !r.ok);
    console.log(`\n${results.length - fails.length}/${results.length} passed`);
    fs.appendFileSync(__dirname + '/results.jsonl', results.map((r) => JSON.stringify({ probe: 'requesterview', ...r })).join('\n') + '\n');
    await browser.close();
    process.exit(fails.length ? 1 : 0);
  }
})().catch((e) => { console.error('PROBE FAILED:', e.message); process.exit(1); });
