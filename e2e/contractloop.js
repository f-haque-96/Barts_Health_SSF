// Full contract-drafter loop through the real UI:
// send agreement (exchange recorded) -> requester portal shows template +
// instructions + can reply -> drafter sees the reply -> upload + approve
// (no 404, state C) -> AP queue. Run with dev server up.
const { BASE, launch, getSub } = require('./helpers');
const { PDF } = require('./fillform');
const fs = require('fs');

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? '  PASS' : '! FAIL'} ${name}${detail ? ' | ' + detail : ''}`);
}

const ID = 'SUP-2026-CONLOOP1';
const baseId = fs.readFileSync(__dirname + '/baseid.txt', 'utf8').trim();

(async () => {
  const { browser, page } = await launch(true);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Seed a pending_contract item (OPW routed it here)
  await page.evaluate(({ baseId, ID }) => {
    const base = JSON.parse(localStorage.getItem(`submission_${baseId}`));
    const sub = {
      ...base, id: ID, submissionId: ID,
      status: 'pending_contract', currentStage: 'contract',
      pbpReview: { decision: 'approved' },
      procurementReview: { classification: 'opw_ir35', supplierClassification: 'opw_ir35', decision: 'approved', alembaReference: '3153684' },
      opwReview: { workerClassification: 'sole_trader', employmentStatus: 'self_employed', decision: 'approved', contractRequired: 'yes' },
      contractDrafter: { status: 'pending_review', ir35Status: 'self_employed', requiredTemplate: 'Sole Trader Agreement latest version 22.docx' },
      apReview: null, apControlReview: null, vendorNumber: null, finalStatus: null, requiresOPW: null,
    };
    localStorage.setItem(`submission_${ID}`, JSON.stringify(sub));
  }, { baseId, ID });

  // --- Drafter: State A — select template + send ---
  await page.goto(`${BASE}/contract-drafter/${ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.getByText('Sole Trader Agreement', { exact: true }).first().click();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('textarea')].find((x) => x.offsetParent);
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'Please review, sign and return the attached agreement.');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /Send Agreement to Supplier/i.test(x.textContent) && !x.disabled).click();
  });
  await page.waitForTimeout(1200);
  let sub = await getSub(page, ID);
  const ex = sub?.contractDrafter?.exchanges || [];
  record('send: exchange recorded', ex.length === 1 && ex[0].type === 'agreement_sent');
  record('send: template attached with url', !!ex[0]?.attachments?.[0]?.url && /Sole Trader/.test(ex[0].attachments[0].name));
  record('send: status stays pending_contract', sub.status === 'pending_contract');

  // --- Requester portal: sees agreement + can reply ---
  await page.goto(`${BASE}/respond/${ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const portal = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      instructions: /Please review, sign and return/.test(txt),
      attachment: /Sole Trader Agreement/.test(txt),
      replyForm: /Your Response|Supplier Response/.test(txt),
    };
  });
  record('portal: instructions visible', portal.instructions);
  record('portal: template attachment visible', portal.attachment);
  record('portal: reply form available', portal.replyForm);

  // Reply from the portal
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('textarea')].filter((x) => x.offsetParent).pop();
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'Signed agreement will follow by email tomorrow.');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent).find((x) => /send|submit response/i.test(x.textContent) && !x.disabled);
    b.click();
  });
  await page.waitForTimeout(1200);
  sub = await getSub(page, ID);
  record('portal: reply recorded in exchanges', (sub?.contractDrafter?.exchanges || []).length === 2);

  // --- Drafter: sees the reply, uploads final agreement, approves ---
  await page.goto(`${BASE}/contract-drafter/${ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const drafterSees = await page.evaluate(() => /Negotiation record/.test(document.body.innerText) && /Signed agreement will follow by email tomorrow/.test(document.body.innerText));
  record('drafter: sees portal reply in negotiation record', drafterSees);

  // Drafter replies in-thread (new capability) -> portal re-activates
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('textarea')].find((x) => x.offsetParent && /Respond to the requester/i.test(x.placeholder || ''));
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'Clause 2.1 amended as requested — revised copy attached to my email.');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /Send reply/i.test(x.textContent) && !x.disabled).click();
  });
  await page.waitForTimeout(1200);
  sub = await getSub(page, ID);
  record('drafter reply: recorded as third exchange', (sub?.contractDrafter?.exchanges || []).length === 3);

  await page.goto(`${BASE}/respond/${ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const portal2 = await page.evaluate(() => ({
    reply: /Clause 2\.1 amended as requested/.test(document.body.innerText),
    formActive: /Your Response|Supplier Response/.test(document.body.innerText),
  }));
  record('portal: sees drafter reply + form re-activated', portal2.reply && portal2.formActive);

  // Back to drafter: upload + approve WITHOUT comments (now optional),
  // signature via the shared SignatureSection
  await page.goto(`${BASE}/contract-drafter/${ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.locator('input[name="finalizedAgreement"]').setInputFiles(PDF);
  await page.waitForTimeout(900);
  const sigUI = await page.evaluate(() => ({
    dateInput: !!document.querySelector('input[type="date"]'),
    cursive: [...document.querySelectorAll('input')].some((i) => /cursive/i.test(i.style.fontFamily || '')),
  }));
  record('signature: shared component (date field present, no cursive font)', sigUI.dateInput && !sigUI.cursive);
  await page.evaluate(() => {
    const setVal = (el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    // fill ONLY the signature name — approval comments stay empty on purpose
    const name = [...document.querySelectorAll('input[type="text"]')].find((t) => t.offsetParent && !t.value);
    setVal(name, 'Test Drafter');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /Submit to AP Control/i.test(x.textContent) && !x.disabled).click();
  });
  await page.waitForTimeout(1500);
  sub = await getSub(page, ID);
  record('approve (no comments): status contract_uploaded / stage ap', sub.status === 'contract_uploaded' && sub.currentStage === 'ap');
  record('approve: finalized agreement stored', !!sub.contractDrafter?.finalizedAgreement?.base64);
  const afterApprove = await page.evaluate(() => ({
    on404: /Page Not Found/.test(document.body.innerText),
    stateC: /Approved|approved/.test(document.body.innerText),
  }));
  record('approve: NO 404, approved view shown', !afterApprove.on404 && afterApprove.stateC);

  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('PROBE FAILED:', e.message); process.exit(1); });
