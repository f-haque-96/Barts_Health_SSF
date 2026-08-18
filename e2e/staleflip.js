// Stale-conditional-field regression: flipping a controlling answer must
// CLEAR its dependent values everywhere (store, Section 7, submission).
// Also checks the requester timeline shows PBP as cleared for items that
// never had an in-app PBP review (email-approval path).
const { BASE, launch } = require('./helpers');
const { run, radio } = require('./fillform');

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? '  PASS' : '! FAIL'} ${name}${detail ? ' | ' + JSON.stringify(detail) : ''}`);
}

const store = (page) => page.evaluate(() =>
  JSON.parse(localStorage.getItem('nhs-supplier-form-storage'))?.state?.formData || {});

(async () => {
  const { browser, page } = await launch(false);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Drive to Section 6 with VAT=yes + verified number (vatProbe stop)
  await run(page, { vatProbe: true });
  await page.waitForTimeout(2000);

  // 1. THE REPORTED BUG: VAT yes->no must clear number + verification
  await radio(page, 'vatRegistered', 'no');
  await page.waitForTimeout(600);
  let f = await store(page);
  record('Q6.15 no -> VAT number cleared', !f.vatNumber && !f.vatVerification, { vatNumber: f.vatNumber });

  // 2. GHX/DUNS yes -> fill -> no
  await radio(page, 'ghxDunsKnown', 'yes');
  await page.waitForTimeout(400);
  await page.fill('#ghxDunsNumber', '123456789');
  await page.waitForTimeout(300);
  await radio(page, 'ghxDunsKnown', 'no');
  await page.waitForTimeout(600);
  f = await store(page);
  record('DUNS known no -> number cleared', !f.ghxDunsNumber);

  // 3. Public liability yes -> fill -> no
  await radio(page, 'publicLiability', 'yes');
  await page.waitForTimeout(400);
  await page.fill('#plCoverage', '5000000').catch(() => {});
  await page.evaluate(() => {
    const d = [...document.querySelectorAll('input[type="date"]')].find((x) => x.offsetParent);
    if (d) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(d, '2027-03-31');
      d.dispatchEvent(new Event('input', { bubbles: true }));
      d.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);
  await radio(page, 'publicLiability', 'no');
  await page.waitForTimeout(600);
  f = await store(page);
  record('PL insurance no -> coverage/expiry cleared', !f.plCoverage && !f.plExpiry);

  // 4. Overseas flip: UK bank fields were filled by run(); flipping to yes
  //    must clear them (incl. accounts-address block)
  await radio(page, 'overseasSupplier', 'yes');
  await page.waitForTimeout(600);
  f = await store(page);
  record('overseas yes -> UK bank fields cleared',
    !f.nameOnAccount && !f.sortCode && !f.accountNumber && !f.accountsAddressSame);
  // fill IBAN then flip back -> intl fields cleared
  await page.fill('#iban', 'GB29NWBK60161331926819').catch(() => {});
  await page.waitForTimeout(300);
  await radio(page, 'overseasSupplier', 'no');
  await page.waitForTimeout(600);
  f = await store(page);
  record('overseas no -> IBAN cleared', !f.iban);

  // 5. Section 7 shows none of the stale labels
  // (refill required UK fields so Next passes validation)
  await page.fill('#nameOnAccount', 'Testcorp Compliance Ltd');
  await page.fill('#sortCode', '20-00-00');
  await page.fill('#accountNumber', '12345678');
  await radio(page, 'accountsAddressSame', 'yes');
  await radio(page, 'ghxDunsKnown', 'no');
  await radio(page, 'cisRegistered', 'no');
  await radio(page, 'publicLiability', 'no');
  await radio(page, 'vatRegistered', 'no');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Next', exact: false }).first().click();
  await page.waitForTimeout(1500);
  const s7 = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      onS7: !!document.querySelector('input[name="finalAcknowledgement"]'),
      vatRow: /VAT Number/.test(txt),
      utrRow: /UTR Number/.test(txt),
      dunsRow: /GHX\/DUNS Number/.test(txt),
      coverageRow: /Coverage/.test(txt),
      ibanRow: /IBAN/.test(txt),
    };
  });
  record('Section 7: no stale VAT/UTR/DUNS/coverage/IBAN rows',
    s7.onS7 && !s7.vatRow && !s7.utrRow && !s7.dunsRow && !s7.coverageRow && !s7.ibanRow, s7);

  // 6. Timeline: completed item with NO pbpReview -> PBP step shows cleared
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const sub = {
      id: 'SUP-2026-EMAILAPP1', submissionId: 'SUP-2026-EMAILAPP1',
      status: 'completed', currentStage: 'completed',
      submissionDate: new Date().toISOString(), submittedBy: 'test.requester@nhs.net',
      formData: { companyName: 'Email Approval Ltd', nhsEmail: 'test.requester@nhs.net', procurementEngaged: 'yes_email' },
      pbpReview: null,
      procurementReview: { classification: 'standard', supplierClassification: 'standard', decision: 'approved' },
      apControlReview: { verified: true, decision: 'approved' },
      vendorNumber: 'VND-777', completedAt: new Date().toISOString(),
    };
    localStorage.setItem('submission_SUP-2026-EMAILAPP1', JSON.stringify(sub));
  });
  await page.goto(`${BASE}/respond/SUP-2026-EMAILAPP1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const timeline = await page.evaluate(() => /Cleared at pre-screening/.test(document.body.innerText));
  record('timeline: PBP shows "Cleared at pre-screening" on email-approval item', timeline);

  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('PROBE FAILED:', e.message); process.exit(1); });
