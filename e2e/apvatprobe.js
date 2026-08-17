// VAT Determination at AP Control (Finance request July 2026):
// A) VAT-registered supplier: completion GATED until status + COS + Finance
//    name are filled; COS pre-suggested from Section 5 service type (amber).
// B) Non-registered supplier: green auto "No VAT", no extra gating.
const { BASE, launch, getSub } = require('./helpers');
const fs = require('fs');

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? '  PASS' : '! FAIL'} ${name}${detail !== undefined ? ' | ' + JSON.stringify(detail) : ''}`);
}

const baseId = fs.readFileSync(__dirname + '/baseid.txt', 'utf8').trim();

const seed = (page, id, vatRegistered) => page.evaluate(({ baseId, id, vatRegistered }) => {
  const base = JSON.parse(localStorage.getItem(`submission_${baseId}`));
  const sub = {
    ...base, id, submissionId: id,
    status: 'pending_ap_control', currentStage: 'ap',
    pbpReview: { decision: 'approved' }, procurementReview: { decision: 'approved', classification: 'standard' },
    opwReview: null, contractDrafter: null, apReview: null, apControlReview: null,
    vendorNumber: null, finalStatus: null, requiresOPW: null, completedAt: null,
    formData: { ...base.formData, vatRegistered, vatNumber: vatRegistered === 'yes' ? '553557881' : '', serviceType: ['software'] },
  };
  localStorage.setItem(`submission_${id}`, JSON.stringify(sub));
}, { baseId, id, vatRegistered });

const fillBasics = async (page) => {
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
    if (texts[1] && !texts[1].value) setVal(texts[1], 'VND-VAT01');
  });
  await page.waitForTimeout(400);
};

const completeBtnDisabled = (page) => page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Complete AP Verification/i.test(x.textContent));
  return b ? b.disabled : null;
});

(async () => {
  const { browser, page } = await launch(true);
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // ---- A) VAT-registered ----
  await seed(page, 'SUP-2026-VATDET01', 'yes');
  await page.goto(`${BASE}/ap-review/SUP-2026-VATDET01`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const ui = await page.evaluate(() => ({
    panel: /VAT Determination \(Finance\)/.test(document.body.innerText),
    amber: /suggested from the service type/i.test(document.body.innerText),
    cosPreselect: [...document.querySelectorAll('select')].some((s) => s.value === 'computer_services'),
  }));
  record('A: VAT panel shown with amber suggestion note', ui.panel && ui.amber);
  record('A: COS pre-suggested from serviceType software -> computer_services', ui.cosPreselect);

  await fillBasics(page);
  record('A: Complete GATED while VAT determination incomplete', await completeBtnDisabled(page) === true);

  await page.evaluate(() => {
    const sels = [...document.querySelectorAll('select')].filter((s) => s.offsetParent);
    const statusSel = sels.find((s) => [...s.options].some((o) => o.value === 'recoverable'));
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(statusSel, 'recoverable');
    statusSel.dispatchEvent(new Event('change', { bubbles: true }));
    const by = [...document.querySelectorAll('input[type="text"]')].find((t) => t.offsetParent && /Finance officer/i.test(t.placeholder || ''));
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(by, 'Kelda Alleyne');
    by.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(400);
  record('A: Complete ENABLED once status + COS + Finance name filled', await completeBtnDisabled(page) === false);

  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /Complete AP Verification/i.test(x.textContent) && !x.disabled).click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    [...document.querySelectorAll('textarea')].filter((t) => t.offsetParent && !t.value).forEach((t) => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'Verified.');
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    [...document.querySelectorAll('input[type="text"]')].filter((t) => t.offsetParent && !t.value).forEach((t) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(t, 'AP Tester');
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    [...document.querySelectorAll('button')].reverse()
      .find((x) => /confirm|complete/i.test(x.textContent) && !x.disabled)?.click();
  });
  await page.waitForTimeout(1500);
  let sub = await getSub(page, 'SUP-2026-VATDET01');
  const det = sub?.apControlReview?.vatDetermination;
  record('A: determination saved (status/COS/by/suggested flag)',
    det?.status === 'recoverable' && det?.cosCategory === 'computer_services' &&
    det?.determinedBy === 'Kelda Alleyne' && det?.suggestedFromServiceType === true, det);

  // ---- B) NOT VAT-registered ----
  await seed(page, 'SUP-2026-VATDET02', 'no');
  await page.goto(`${BASE}/ap-review/SUP-2026-VATDET02`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const uiB = await page.evaluate(() => /Auto-determined: No VAT/.test(document.body.innerText));
  record('B: green auto "No VAT" for non-registered supplier', uiB);
  await fillBasics(page);
  record('B: Complete NOT gated by VAT fields', await completeBtnDisabled(page) === false);

  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('PROBE FAILED:', e.message); process.exit(1); });
