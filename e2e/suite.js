// Full workflow-route suite. Run: node suite.js [stage]
const { BASE, launch, shot, status } = require('./helpers');
const { dump, PDF } = require('./fillform');
const fs = require('fs');

const baseId = fs.readFileSync(__dirname + '/baseid.txt', 'utf8').trim();
const results = [];
function record(route, step, expected, actual) {
  const ok = JSON.stringify(expected) === JSON.stringify(actual);
  results.push({ route, step, expected, actual, ok });
  console.log(`${ok ? '  PASS' : '! FAIL'} [${route}] ${step} -> ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

async function clone(page, newId, patch = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ baseId, newId, patch }) => {
    const base = JSON.parse(localStorage.getItem(`submission_${baseId}`));
    const sub = {
      ...base, id: newId, submissionId: newId,
      // July 2026 model: full SUP- forms enter the pipeline at Procurement
      status: patch.status || 'approved',
      currentStage: patch.currentStage || 'procurement',
      pbpReview: patch.pbpReview || null, procurementReview: null, opwReview: null,
      contractDrafter: null, apReview: null, apControlReview: null,
      formData: { ...base.formData, ...(patch.formData || {}) },
    };
    localStorage.setItem(`submission_${newId}`, JSON.stringify(sub));
    const all = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    all.push({ submissionId: newId, submissionDate: sub.submissionDate, submittedBy: sub.submittedBy, status: sub.status });
    localStorage.setItem('all_submissions', JSON.stringify(all));
  }, { baseId, newId, patch });
  return newId;
}

// Seed a Section 2 pre-screening questionnaire item (QUEST-) — the only
// item type PBP review since the July 2026 straight-to-Procurement change
async function seedQuest(page, id, patch = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ id, patch }) => {
    const sub = {
      id, submissionId: id,
      status: 'pending_review', currentStage: 'pbp',
      type: 'questionnaire', isQuestionnaire: true, questionnaireType: 'nonClinical',
      submissionDate: new Date().toISOString(),
      submittedBy: 'test.requester@nhs.net',
      formData: {
        companyName: 'Quest Suite Ltd', supplierName: 'Quest Suite Ltd',
        serviceCategory: 'non-clinical', requesterName: 'Test Requester',
        nhsEmail: 'test.requester@nhs.net',
        nonClinicalQuestionnaire: { supplierName: 'Quest Suite Ltd' },
      },
      pbpReview: { exchanges: [] },
      ...patch,
    };
    localStorage.setItem(`submission_${id}`, JSON.stringify(sub));
    const all = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    all.push({ submissionId: id, submissionDate: sub.submissionDate, submittedBy: sub.submittedBy, status: sub.status, type: 'questionnaire' });
    localStorage.setItem('all_submissions', JSON.stringify(all));
  }, { id, patch });
  return id;
}

async function open(page, url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}

async function clickBtn(page, name) {
  await page.evaluate((n) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().includes(n) && !x.disabled);
    if (!b) throw new Error(`button not found/enabled: ${n}`);
    b.click();
  }, name);
  await page.waitForTimeout(900);
}

async function fillPanel(page, { comments, name = 'Test Reviewer', date = '2026-07-02' } = {}) {
  // Fill visible empty textareas, text inputs and date inputs in the open panel
  await page.evaluate(({ comments, name, date }) => {
    const setVal = (el, v) => {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    [...document.querySelectorAll('textarea')].filter((t) => !t.value && t.offsetParent).forEach((t) => setVal(t, comments));
    [...document.querySelectorAll('input[type="text"]')].filter((t) => !t.value && t.offsetParent).forEach((t) => setVal(t, name));
    [...document.querySelectorAll('input[type="date"]')].filter((t) => t.offsetParent).forEach((t) => setVal(t, date));
  }, { comments, name, date });
  await page.waitForTimeout(300);
}

// ---------- PBP routes (QUEST- questionnaire items only, July 2026) ----------
async function routeA_pbpApprove(page) {
  const id = await seedQuest(page, 'QUEST-SUITE-A1');
  await open(page, `/pbp-review/${id}`);
  await clickBtn(page, 'Approve Questionnaire');
  await fillPanel(page, { comments: 'Approved - verification test.' });
  await clickBtn(page, 'Confirm Approval');
  record('A', 'PBP approve questionnaire', 'approved', (await status(page, id))?.status);
}

async function routeB_pbpInfoRoundTrip(page) {
  const id = await seedQuest(page, 'QUEST-SUITE-B1');
  await open(page, `/pbp-review/${id}`);
  await clickBtn(page, 'Request More Information');
  await fillPanel(page, { comments: 'Please provide insurance certificate details.' });
  await shot(page, 'B1-info-panel');
  // confirm button name unknown - find anything Confirm/Send
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /confirm|send request/i.test(x.textContent) && !x.disabled);
    if (!b) throw new Error('no confirm button for info request');
    b.click();
  });
  await page.waitForTimeout(900);
  record('B', 'PBP request info', 'info_required', (await status(page, id))?.status);

  // Requester responds
  await open(page, `/respond/${id}`);
  await shot(page, 'B2-respond-page');
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('textarea')].find((x) => x.offsetParent);
    if (!t) throw new Error('no response textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'Insurance certificate attached - ref ABC123.');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /send|submit response/i.test(x.textContent) && !x.disabled);
    if (!b) throw new Error('no send-response button');
    b.click();
  });
  await page.waitForTimeout(900);
  const afterResponse = await status(page, id);
  console.log('  [B] after requester response:', JSON.stringify(afterResponse));

  // PBP approves after response
  await open(page, `/pbp-review/${id}`);
  await shot(page, 'B3-pbp-after-response');
  await clickBtn(page, 'Approve Questionnaire');
  await fillPanel(page, { comments: 'Info received - approved.' });
  await clickBtn(page, 'Confirm Approval');
  record('B', 'PBP approve after info round-trip', 'approved', (await status(page, id))?.status);
}

async function routeC_pbpReject(page) {
  const id = await seedQuest(page, 'QUEST-SUITE-C1');
  await open(page, `/pbp-review/${id}`);
  await clickBtn(page, 'Reject Questionnaire');
  await fillPanel(page, { comments: 'Duplicate of existing supplier - rejected.' });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /confirm/i.test(x.textContent) && !x.disabled);
    if (!b) throw new Error('no confirm button for reject');
    b.click();
  });
  await page.waitForTimeout(900);
  record('C', 'PBP reject', 'rejected', (await status(page, id))?.status);
}

// ---------- Procurement routes ----------
async function radioByName(page, name, value) {
  await page.evaluate(({ name, value }) => {
    const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
    (el.closest('label') || el).click();
  }, { name, value });
  await page.waitForTimeout(300);
}

async function procDecide(page, id, classification, action, expectStatus, route, label) {
  await open(page, `/procurement-review/${id}`);
  if (classification) await radioByName(page, 'supplierClassification', classification);
  await clickBtn(page, action === 'approve' ? 'Approve' : 'Reject');
  await fillPanel(page, { comments: `${label} - verification test.` });
  if (action === 'approve') {
    // unnamed text input = Alemba reference; overwrite the generic fill
    await page.evaluate(() => {
      const alemba = [...document.querySelectorAll('input[type="text"]')].find((i) => !i.id && i.offsetParent);
      if (alemba) {
        // Alemba ref must be the bare numeric call number (validation added Jul 2026)
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(alemba, '3153684');
        alemba.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /confirm/i.test(x.textContent) && !x.disabled);
    if (!b) throw new Error('no confirm button');
    b.click();
  });
  await page.waitForTimeout(900);
  record(route, label, expectStatus, await status(page, id));
}

// ---------- OPW routes ----------
const OPW_PATCH = {
  status: 'procurement_approved_opw', currentStage: 'opw',
  pbpReview: { decision: 'approved', currentStatus: 'complete' },
};
const SOLE_TRADER_FD = { supplierType: 'sole_trader', soleTraderStatus: 'yes', companiesHouseRegistered: 'no' };

async function opwDecide(page, id, { radioName, determination, contract, reject }, expect, route, label) {
  await open(page, `/opw-review/${id}`);
  await radioByName(page, radioName, determination);
  await page.waitForTimeout(500);
  if (contract) {
    // Intermediary and sole-trader paths use different radio group names
    const grp = await page.evaluate(() =>
      document.querySelector('input[name="contractRequiredSoleTrader"]') ? 'contractRequiredSoleTrader' : 'contractRequired');
    await radioByName(page, grp, contract);
  }
  // Rationale / rejection-reason textareas, SDS checkbox and any date fields
  // must be completed before "Proceed to Sign" enables
  await page.evaluate((msg) => {
    const setVal = (el, v, proto) => {
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    [...document.querySelectorAll('textarea')].filter((t) => t.offsetParent && !t.value)
      .forEach((t) => setVal(t, msg, HTMLTextAreaElement.prototype));
    [...document.querySelectorAll('input[type="checkbox"]')].filter((c) => c.offsetParent && !c.checked)
      .forEach((c) => (c.closest('label') || c).click());
    [...document.querySelectorAll('input[type="date"]')].filter((d) => d.offsetParent && !d.value)
      .forEach((d) => setVal(d, '2026-07-02', HTMLInputElement.prototype));
  }, reject
    ? 'Engagement fails IR35 assessment - rejected for verification test.'
    : `${label} rationale - verification test.`);
  await page.waitForTimeout(500);
  await clickBtn(page, 'Proceed to Sign');
  await fillPanel(page, { comments: `${label} rationale - verification test.` });
  await shot(page, `opw-${route}-signpanel`);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].reverse()
      .find((x) => /submit|sign|confirm/i.test(x.textContent) && !/proceed/i.test(x.textContent) && !x.disabled);
    if (!b) throw new Error('no final OPW submit button; have: ' +
      [...document.querySelectorAll('button')].map((y) => y.textContent.trim()).join(' | '));
    b.click();
  });
  await page.waitForTimeout(1200);
  record(route, label, expect, await status(page, id));
}

async function apComplete(page, id, route, label) {
  await open(page, `/ap-review/${id}`);
  await page.evaluate(() => {
    const setVal = (el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    [...document.querySelectorAll('input[type="checkbox"]')]
      .filter((c) => c.offsetParent && !c.checked).forEach((c) => (c.closest('label') || c).click());
    const texts = [...document.querySelectorAll('input[type="text"]')].filter((t) => t.offsetParent);
    if (texts[0] && !texts[0].value) setVal(texts[0], 'Testcorp Compliance Ltd');
    if (texts[1]) setVal(texts[1], 'VND-100042'); // vendor/supplier number
  });
  await page.waitForTimeout(400);
  await clickBtn(page, 'Complete AP Verification');
  await fillPanel(page, { comments: 'All financial details verified.' });
  await shot(page, `ap-${route}-panel`);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].reverse()
      .find((x) => /confirm|complete/i.test(x.textContent) && !x.disabled);
    if (!b) throw new Error('no AP confirm button; have: ' +
      [...document.querySelectorAll('button')].map((y) => y.textContent.trim()).join(' | '));
    b.click();
  });
  await page.waitForTimeout(1500);
  const sub = await require('./helpers').getSub(page, id);
  record(route, label, { status: 'completed', currentStage: 'completed' },
    { status: sub?.status, currentStage: sub?.currentStage });
  console.log(`  [${route}] vendorNumber recorded:`, sub?.vendorNumber);
}

const APPROVED_PATCH = {
  status: 'approved', currentStage: 'procurement',
  pbpReview: { decision: 'approved', currentStatus: 'complete', signature: 'Test PBP', completedAt: new Date().toISOString() },
};

async function main() {
  const { browser, page } = await launch(true);
  const stage = process.argv[2] || 'pbp';
  try {
    if (stage === 'pbp') {
      await routeA_pbpApprove(page);
      await routeB_pbpInfoRoundTrip(page);
      await routeC_pbpReject(page);
    }
    if (stage === 'proc') {
      // Route A: the base submission enters the pipeline at Procurement
      // (July 2026 — PBP clearance happens inside the form at Section 2)
      await procDecide(page, baseId, 'standard', 'approve',
        { status: 'pending_ap_control', currentStage: 'ap' }, 'A', 'Procurement standard approve');
      const dId = await clone(page, 'SUP-2026-ROUTED01', APPROVED_PATCH);
      await procDecide(page, dId, 'opw_ir35', 'approve',
        { status: 'procurement_approved_opw', currentStage: 'opw' }, 'D', 'Procurement OPW classification');
      const jId = await clone(page, 'SUP-2026-ROUTEJ01', APPROVED_PATCH);
      await procDecide(page, jId, null, 'reject',
        { status: 'rejected', currentStage: 'rejected' }, 'J', 'Procurement reject');
    }
    if (stage === 'opw') {
      // Intermediary paths (limited company base) - route D continues on ROUTED01
      await opwDecide(page, 'SUP-2026-ROUTED01',
        { radioName: 'ir35Determination', determination: 'inside' },
        { status: 'inside_ir35_sds_issued', currentStage: 'sds_issued' }, 'G', 'OPW intermediary inside IR35');
      const h = await clone(page, 'SUP-2026-ROUTEH01', OPW_PATCH);
      await opwDecide(page, h,
        { radioName: 'ir35Determination', determination: 'outside', contract: 'no' },
        { status: 'pending_ap_control', currentStage: 'ap' }, 'H', 'OPW intermediary outside, no contract');
      const i = await clone(page, 'SUP-2026-ROUTEI01', OPW_PATCH);
      await opwDecide(page, i,
        { radioName: 'ir35Determination', determination: 'outside', contract: 'yes' },
        { status: 'pending_contract', currentStage: 'contract' }, 'I', 'OPW intermediary outside, contract required');
      const k = await clone(page, 'SUP-2026-ROUTEK01', OPW_PATCH);
      await opwDecide(page, k,
        { radioName: 'ir35Determination', determination: 'rejected', reject: true },
        { status: 'rejected', currentStage: 'rejected' }, 'K', 'OPW reject');
      // Sole trader paths
      const e1 = await clone(page, 'SUP-2026-ROUTEE01', { ...OPW_PATCH, formData: SOLE_TRADER_FD });
      await opwDecide(page, e1,
        { radioName: 'employmentStatus', determination: 'employed' },
        { status: 'completed_payroll', currentStage: 'completed_payroll' }, 'E1', 'OPW sole trader employed');
      const e2 = await clone(page, 'SUP-2026-ROUTEE02', { ...OPW_PATCH, formData: SOLE_TRADER_FD });
      await opwDecide(page, e2,
        { radioName: 'employmentStatus', determination: 'self_employed', contract: 'yes' },
        { status: 'pending_contract', currentStage: 'contract' }, 'E2', 'OPW sole trader self-employed, contract');
      const f = await clone(page, 'SUP-2026-ROUTEF01', { ...OPW_PATCH, formData: SOLE_TRADER_FD });
      await opwDecide(page, f,
        { radioName: 'employmentStatus', determination: 'self_employed', contract: 'no' },
        { status: 'pending_ap_control', currentStage: 'ap' }, 'F', 'OPW sole trader self-employed, no contract');
    }
    if (stage === 'contract') {
      const id = 'SUP-2026-ROUTEE22'; // pending_contract via OPW UI (route E2)
      await open(page, `/contract-drafter/${id}`);
      await page.getByText('Sole Trader Agreement', { exact: true }).first().click();
      await page.waitForTimeout(400);
      await fillPanel(page, { comments: 'Please review and sign the attached agreement.' });
      await clickBtn(page, 'Send Agreement to Supplier');
      const afterSend = await status(page, id);
      record('E2', 'Contract: send agreement (stays pending_contract)',
        { status: 'pending_contract', currentStage: 'contract' }, afterSend);
      await open(page, `/contract-drafter/${id}`);
      await shot(page, 'contract-stateB');
      await dump(page, 'contract state B');
    }
    if (stage === 'contract2') {
      const id = 'SUP-2026-ROUTEE22';
      await open(page, `/contract-drafter/${id}`);
      await page.locator('input[name="finalizedAgreement"]').setInputFiles(PDF);
      await page.waitForTimeout(900);
      await fillPanel(page, { comments: 'Final signed agreement received - approved.' });
      await shot(page, 'contract-before-submit');
      await clickBtn(page, 'Submit to AP Control');
      record('E2', 'Contract: approve + upload', { status: 'contract_uploaded', currentStage: 'ap' }, await status(page, id));
    }
    if (stage === 'ap') {
      // Route A finale: base submission (pending_ap_control via UI) -> completed
      await apComplete(page, baseId, 'A', 'AP complete (standard route)');
      // Route E finale: contract_uploaded -> completed
      await apComplete(page, 'SUP-2026-ROUTEE22', 'E2', 'AP complete (contract route)');
      // Route L: AP reject
      const l = await clone(page, 'SUP-2026-ROUTEL01', {
        status: 'pending_ap_control', currentStage: 'ap',
        pbpReview: { decision: 'approved' },
      });
      await open(page, `/ap-review/${l}`);
      await clickBtn(page, 'Reject Request');
      await fillPanel(page, { comments: 'Bank details could not be verified - rejected.' });
      await shot(page, 'ap-reject-panel');
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].reverse()
          .find((x) => /confirm|reject/i.test(x.textContent) && !/request/i.test(x.textContent) && !x.disabled);
        if (!b) throw new Error('no confirm-reject button; have: ' +
          [...document.querySelectorAll('button')].map((y) => y.textContent.trim()).join(' | '));
        b.click();
      });
      await page.waitForTimeout(1200);
      record('L', 'AP reject', { status: 'rejected', currentStage: 'rejected' }, await status(page, l));
    }
    if (stage === 'ap2') {
      // Contract-route finale + AP reject (fresh fixtures)
      await apComplete(page, 'SUP-2026-ROUTEE22', 'E2', 'AP complete (contract route)');
      const l = await clone(page, 'SUP-2026-ROUTEL02', {
        status: 'pending_ap_control', currentStage: 'ap',
        pbpReview: { decision: 'approved' },
      });
      await open(page, `/ap-review/${l}`);
      await clickBtn(page, 'Reject Request');
      await fillPanel(page, { comments: 'Bank details could not be verified - rejected.' });
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].reverse()
          .find((x) => /confirm|reject/i.test(x.textContent) && !/request/i.test(x.textContent) && !x.disabled);
        if (!b) throw new Error('no confirm-reject button');
        b.click();
      });
      await page.waitForTimeout(1200);
      record('L', 'AP reject', { status: 'rejected', currentStage: 'rejected' }, await status(page, l));
    }
    if (stage === 'opw2') {
      const e2 = await clone(page, 'SUP-2026-ROUTEE22', { ...OPW_PATCH, formData: SOLE_TRADER_FD });
      await opwDecide(page, e2,
        { radioName: 'employmentStatus', determination: 'self_employed', contract: 'yes' },
        { status: 'pending_contract', currentStage: 'contract' }, 'E2', 'OPW sole trader self-employed, contract');
      const f = await clone(page, 'SUP-2026-ROUTEF02', { ...OPW_PATCH, formData: SOLE_TRADER_FD });
      await opwDecide(page, f,
        { radioName: 'employmentStatus', determination: 'self_employed', contract: 'no' },
        { status: 'pending_ap_control', currentStage: 'ap' }, 'F', 'OPW sole trader self-employed, no contract');
    }
    await page.saveState();
  } finally {
    console.log('\nRESULTS:', JSON.stringify(results));
    fs.appendFileSync(__dirname + '/results.jsonl', results.map((r) => JSON.stringify(r)).join('\n') + '\n');
    await browser.close();
  }
}
if (require.main === module) {
  main().catch((e) => { console.error('SUITE FAILED:', e.message); process.exit(1); });
}

module.exports = { clone, open, clickBtn, fillPanel, record, results, status };