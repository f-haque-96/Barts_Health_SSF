// Drives the full 7-section form through the real UI and submits it.
// Exports run() so route scripts can reuse it.
const { BASE, launch, shot } = require('./helpers');
const fs = require('fs');
const path = require('path');

// Minimal valid single-page PDF for uploads
const PDF = path.join(__dirname, 'dummy.pdf');
if (!fs.existsSync(PDF)) {
  fs.writeFileSync(PDF,
    '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n' +
    'trailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n');
}

async function dump(page, label) {
  const controls = await page.evaluate(() => [...document.querySelectorAll('input, select, textarea')]
    .map((e) => ({ tag: e.tagName.toLowerCase(), type: e.type || '', name: e.name || '', id: e.id || '', value: (e.type === 'radio' || e.type === 'checkbox') ? e.value : '' })));
  const buttons = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim().slice(0, 50)));
  const errs = await page.evaluate(() => [...document.querySelectorAll('[class*="error"], [role="alert"]')].map((e) => e.textContent.trim().slice(0, 120)).filter(Boolean));
  console.log(`===== DUMP ${label} =====`);
  console.log(JSON.stringify(controls));
  console.log('BUTTONS:', JSON.stringify(buttons));
  console.log('VISIBLE ERRORS:', JSON.stringify(errs.slice(0, 12)));
}

async function radio(page, name, value) {
  // Styled radios: the input may not be directly clickable. Click the label
  // that wraps it (real user gesture); fall back to a native DOM click.
  const input = page.locator(`input[name="${name}"][value="${value}"]`).first();
  const handle = await input.elementHandle();
  const clicked = await page.evaluate((el) => {
    const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
    if (label) { label.click(); return 'label'; }
    el.click(); return 'input';
  }, handle);
  await page.waitForTimeout(200);
  const ok = await input.isChecked();
  if (!ok) throw new Error(`radio ${name}=${value} not checked (via ${clicked})`);
}

async function next(page, expectSelector, label) {
  await page.getByRole('button', { name: 'Next', exact: false }).first().click();
  await page.waitForTimeout(900);
  if (expectSelector) {
    try {
      await page.waitForSelector(expectSelector, { timeout: 5000 });
    } catch {
      await shot(page, `FAIL-${label}`);
      await dump(page, `stuck at ${label}`);
      throw new Error(`Did not advance past ${label} (expected ${expectSelector})`);
    }
  }
}

async function run(page, opts = {}) {
  const o = { supplierType: 'limited_company', soleTrader: 'no', ...opts };

  await page.goto(BASE, { waitUntil: 'networkidle' });

  // Section 1
  await page.fill('#firstName', 'Test');
  await page.fill('#lastName', 'Requester');
  await page.fill('#jobTitle', 'Procurement Officer');
  await page.fill('#department', 'Procurement');
  await page.fill('#nhsEmail', 'test.requester@nhs.net');
  await page.fill('#phoneNumber', '020 7377 7000');
  await next(page, 'input[name="serviceCategory"]', 'section1');

  // Section 2 (progressive disclosure - answer in visual/logical order)
  // Questions unlock strictly in numbered order (progressive disclosure)
  async function uploadNew(prevCount) {
    await page.waitForFunction(
      (n) => document.querySelectorAll('input[type="file"]').length > n, prevCount,
      { timeout: 8000 });
    const inputs = page.locator('input[type="file"]');
    const n = await inputs.count();
    await inputs.nth(n - 1).setInputFiles(PDF);
    await page.waitForTimeout(900);
    return n;
  }

  await radio(page, 'substantivePosition', 'no');           // 2.1
  await radio(page, 'supplierConnection', 'no');            // 2.2
  await radio(page, 'soleTraderStatus', o.soleTrader);      // 2.3
  let files = await page.locator('input[type="file"]').count();
  if (o.soleTrader === 'yes') files = await uploadNew(files - 1); // CEST form
  await radio(page, 'letterheadAvailable', 'yes');          // 2.4 (mandatory yes)
  files = await uploadNew(files - 1);                       // letterhead upload
  await page.fill('#justification', 'Specialist service required for estates compliance works.'); // 2.5
  await radio(page, 'usageFrequency', 'regular');           // 2.6
  await radio(page, 'serviceCategory', 'non-clinical');     // 2.7
  await radio(page, 'procurementEngaged', o.procurementMode || 'yes'); // 2.8
  await uploadNew(files - 1);                               // approval evidence
  const ack = page.locator('input[name="prescreeningAcknowledgement"]');
  if (await ack.count() > 0) {
    const h = await ack.elementHandle();
    await page.evaluate((el) => (el.closest('label') || el).click(), h);
    await page.waitForTimeout(200);
    if (!(await ack.isChecked())) throw new Error('acknowledgement checkbox not checked');
  }
  await next(page, 'input[name="companiesHouseRegistered"], select[name="supplierType"], input[name="supplierType"]', 'section2');

  // Section 3 — progressive disclosure again; supplier type is a card grid
  await radio(page, 'companiesHouseRegistered', o.supplierType === 'sole_trader' ? 'no' : 'yes');
  await page.waitForTimeout(600);
  const cardText = { limited_company: 'Limited Company', sole_trader: 'Sole Trader', partnership: 'Partnership' }[o.supplierType];
  await page.getByText(cardText, { exact: true }).first().click();
  await page.waitForTimeout(700);
  if (o.supplierType === 'limited_company') {
    await page.fill('#crn', '07101408');
    if (o.crnProbe) {
      // Click "Check Companies House" and capture whatever feedback the UI gives
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => /Check Companies House/i.test(x.textContent));
        b.click();
      });
      await page.waitForTimeout(4000);
      const feedback = await page.evaluate(() =>
        [...document.querySelectorAll('p, span, div')]
          .map((e) => e.textContent.trim())
          .filter((t) => t && t.length < 200 && /verif|unable|connect|manual|not found|error|dissolved|CORS/i.test(t))
          .slice(0, 6));
      console.log('CRN PROBE feedback:', JSON.stringify([...new Set(feedback)]));
      await shot(page, 'probe-crn-check');
      return { page, id: null, crnProbe: true };
    }
    await radio(page, 'limitedCompanyInterest', 'no');
  }
  await page.fill('#annualValue', '25000');
  await page.selectOption('#employeeCount', { index: 1 });
  // sole trader route: ID type / uploads appear
  if (o.supplierType === 'sole_trader') {
    await dump(page, 'SECTION 3 sole trader extras');
  }
  await next(page, '#companyName', 'section3');

  // Section 4 — supplier details
  await page.fill('#companyName', 'Testcorp Compliance Ltd');
  if (o.stopAtSection4) {
    // Give the rejected-supplier fuzzy check time to run on companyName
    await page.waitForTimeout(1800);
    const warn = await page.evaluate(() =>
      [...document.querySelectorAll('p, div, strong, small')]
        .map((e) => e.textContent.trim())
        .filter((t) => t && t.length < 250 && /rejected|flag|similar|previously/i.test(t)).slice(0, 5));
    console.log('SECTION4 REJECTED-SUPPLIER WARNING:', JSON.stringify([...new Set(warn)]));
    await shot(page, 'section4-flag-warning');
    return { page, id: null };
  }
  await page.fill('#registeredAddress', '1 Test Street');
  await page.fill('#city', 'London');
  await page.fill('#postcode', 'E1 1BB');
  await page.fill('#contactName', 'Sam Supplier');
  await page.fill('#contactEmail', 'sam@testcorp.example');
  await page.fill('#contactPhone', '020 7946 0000');
  await next(page, '#serviceDescription, textarea[name="serviceDescription"]', 'section4');

  // Section 5 — service types (checkboxes) + description
  const stBoxes = page.locator('input[type="checkbox"]');
  const stHandle = await stBoxes.first().elementHandle();
  await page.evaluate((el) => (el.closest('label') || el).click(), stHandle);
  await page.waitForTimeout(200);
  await page.fill('#serviceDescription', 'Statutory estates compliance testing and certification services.');
  await next(page, 'input[name="overseasSupplier"]', 'section5');

  // Section 6 — financial info
  await radio(page, 'overseasSupplier', 'no');
  await page.waitForTimeout(400);
  await page.fill('#nameOnAccount', 'Testcorp Compliance Ltd');
  await page.fill('#sortCode', '20-00-00');
  await page.fill('#accountNumber', '12345678');
  await radio(page, 'accountsAddressSame', 'yes');
  await radio(page, 'ghxDunsKnown', 'no');
  await radio(page, 'cisRegistered', 'no');
  await radio(page, 'publicLiability', 'no');
  if (o.vatProbe) {
    // VAT verification probe: select yes, type a GB-prefixed valid sandbox VRN,
    // and stop here so the caller can inspect the verification UI.
    await radio(page, 'vatRegistered', 'yes');
    await page.waitForSelector('#vatNumber');
    await page.fill('#vatNumber', 'GB553557881');
    await page.waitForTimeout(1600); // debounce + mock flow round-trip
    return { page, id: null };
  }
  await radio(page, 'vatRegistered', 'no');
  await next(page, null, 'section6');
  await page.waitForTimeout(800);

  // Section 7 — acknowledge + submit
  const fa = page.locator('input[name="finalAcknowledgement"]');
  const fh = await fa.elementHandle();
  await page.evaluate((el) => (el.closest('label') || el).click(), fh);
  await page.waitForTimeout(300);
  // Click the actual Submit button via DOM (nav buttons are type=button; be precise)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Submit');
    btn.click();
  });
  try {
    await page.waitForFunction(
      () => /Submitted Successfully|error occurred while submitting/i.test(document.body.innerText),
      null, { timeout: 10000 });
  } catch { /* fall through to diagnostics below */ }
  console.log('AFTER SUBMIT, page says:',
    (await page.evaluate(() => document.body.innerText)).split('\n')
      .filter((l) => /submit|success|error/i.test(l)).slice(0, 8).join(' | '));
  await shot(page, '08-submitted');

  // Pull the new submission id straight from the dev store
  const id = await page.evaluate(() => {
    const ids = Object.keys(localStorage)
      .filter((k) => k.startsWith('submission_SUP-'))
      .map((k) => k.replace('submission_', ''));
    return ids.sort().pop() || null;
  });
  if (!id) {
    console.log('DIALOGS:', JSON.stringify(page.dialogs, null, 1));
    console.log('CONSOLE ERRORS:', JSON.stringify(page.consoleErrors.slice(-10), null, 1));
    await dump(page, 'SUBMIT FAILED');
    throw new Error('No SUP- submission found after submit');
  }
  const sub = await page.evaluate((sid) => JSON.parse(localStorage.getItem(`submission_${sid}`)), id);
  console.log('SUBMITTED:', id, 'status =', sub.status, '| stage =', sub.currentStage);
  return { page, id };
}

module.exports = { run, radio, next, dump, PDF };

if (require.main === module) {
  (async () => {
    const { browser, page } = await launch();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await run(page);
    await browser.close();
  })().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
}