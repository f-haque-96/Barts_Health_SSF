// Graph provider smoke test — the app running with the REAL
// GraphStorageProvider against mock-graph.js (:3996).
// Prereqs: node mock-graph.js AND `npm run dev -- --mode graphtest` on :5173.
// Proves: session+roles from Graph, full-form save (bank strip → BankDetails,
// upload externalisation, UPN stamping), review read+write via PATCH,
// optimistic concurrency (412 → user-visible conflict), completion.
const { BASE, launch } = require('./helpers');
const { run } = require('./fillform');

const MOCK = 'http://localhost:3996';
const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? '  PASS' : '! FAIL'} ${name}${detail !== undefined ? ' | ' + JSON.stringify(detail) : ''}`);
}
const dump = async () => (await fetch(`${MOCK}/__dump`)).json();

(async () => {
  const { browser, page } = await launch(false);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // 1. Submit the full form through the UI → Graph provider save.
  // fillform discovers the id from localStorage, which the Graph provider
  // correctly does NOT write — catch that and take the id from the mock.
  await run(page).catch((e) => {
    if (!/No SUP- submission found/.test(e.message)) throw e;
  });
  let s0 = await dump();
  const id = s0.lists['SSF-Submissions'].map((i) => i.fields.Title).filter((t) => /^SUP-/.test(t)).pop();
  record('save: submission id created in SharePoint (not localStorage)',
    /^SUP-\d{4}-[0-9A-F]{8}$/.test(id || ''), id);

  let s = await dump();
  const item = s.lists['SSF-Submissions'].find((i) => i.fields.Title === id);
  record('save: list item created', !!item);
  const f = item?.fields || {};
  record('save: status approved / stage procurement (Section 2 PBP gate)',
    f.Status === 'approved' && f.CurrentStage === 'procurement');
  record('save: RequesterEmail stamped from UPN not typed field (rule 3)',
    f.RequesterEmail === 'graph.tester@nhs.net', f.RequesterEmail);
  record('save: CompanyName column', f.CompanyName === 'Testcorp Compliance Ltd');
  record('save: SubmissionType full', f.SubmissionType === 'full');

  const formJson = f.FormDataJSON || '';
  record('save: FormDataJSON has NO bank details (rule 1)',
    !formJson.includes('12345678') && !formJson.includes('sortCode":"20-00-00') && !/"accountNumber"/.test(formJson));
  record('save: FormDataJSON has NO base64 (rule 2)', !formJson.includes('data:application') && !formJson.includes('base64,'));

  const bank = s.lists['SSF-BankDetails'].find((i) => i.fields.Title === id);
  record('save: SSF-BankDetails row with typed values (rule 1)',
    !!bank && bank.fields.AccountNumber === '12345678' &&
    String(bank.fields.SortCode).replace(/\D/g, '') === '200000' &&
    bank.fields.NameOnAccount === 'Testcorp Compliance Ltd');

  const supplierFiles = Object.keys(s.drives.d1.files);
  const sensitiveFiles = Object.keys(s.drives.d2.files);
  record('save: uploads externalised to libraries (rule 2)',
    supplierFiles.length + sensitiveFiles.length >= 2,
    { SupplierDocuments: supplierFiles, SensitiveDocuments: sensitiveFiles });

  // 2. Review pages read via Graph + write decisions via PATCH
  await page.goto(`${BASE}/procurement-review/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const loaded = await page.evaluate(() => /Testcorp Compliance Ltd/.test(document.body.innerText));
  record('read: procurement page loads submission from Graph', loaded);

  await page.evaluate(() => {
    const el = document.querySelector('input[name="supplierClassification"][value="standard"]');
    (el.closest('label') || el).click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /Approve/i.test(x.textContent) && !x.disabled).click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const setVal = (el, v, proto) => {
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    [...document.querySelectorAll('textarea')].filter((t) => t.offsetParent && !t.value)
      .forEach((t) => setVal(t, 'Graph smoke approval.', HTMLTextAreaElement.prototype));
    [...document.querySelectorAll('input[type="text"]')].filter((t) => t.offsetParent)
      .forEach((t) => setVal(t, t.value || 'Graph Tester', HTMLInputElement.prototype));
    const alemba = [...document.querySelectorAll('input[type="text"]')].find((i) => !i.id && i.offsetParent);
    if (alemba) setVal(alemba, '3153684', HTMLInputElement.prototype);
  });
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /confirm/i.test(x.textContent) && !x.disabled)?.click();
  });
  await page.waitForTimeout(1500);

  s = await dump();
  const after = s.lists['SSF-Submissions'].find((i) => i.fields.Title === id).fields;
  record('write: PATCH applied — pending_ap_control', after.Status === 'pending_ap_control', after.Status);
  record('write: ProcurementReviewJSON stored', !!after.ProcurementReviewJSON &&
    after.ProcurementReviewJSON.includes('3153684'));

  // 3. Optimistic concurrency: tamper the etag → AP decision must FAIL with
  //    a conflict, leaving the item untouched
  await page.goto(`${BASE}/ap-review/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await fetch(`${MOCK}/__tamper/${id}`);
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
    if (texts[1]) setVal(texts[1], 'VND-GRAPH1');
  });
  await page.waitForTimeout(300);
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
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(t, 'Graph Tester');
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    [...document.querySelectorAll('button')].reverse()
      .find((x) => /confirm|complete/i.test(x.textContent) && !x.disabled)?.click();
  });
  await page.waitForTimeout(1500);
  s = await dump();
  const conflicted = s.lists['SSF-Submissions'].find((i) => i.fields.Title === id).fields;
  record('conflict: stale write REJECTED (still pending_ap_control)',
    conflicted.Status === 'pending_ap_control', conflicted.Status);
  record('conflict: user saw the conflict dialog',
    page.dialogs.some((d) => /changed by someone else|refresh/i.test(d.message)),
    page.dialogs.map((d) => d.message.slice(0, 60)));

  // 4. Fresh load → complete succeeds with the new etag
  await page.goto(`${BASE}/ap-review/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
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
    if (texts[1]) setVal(texts[1], 'VND-GRAPH1');
  });
  await page.waitForTimeout(300);
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
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(t, 'Graph Tester');
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    [...document.querySelectorAll('button')].reverse()
      .find((x) => /confirm|complete/i.test(x.textContent) && !x.disabled)?.click();
  });
  await page.waitForTimeout(1500);
  s = await dump();
  const final = s.lists['SSF-Submissions'].find((i) => i.fields.Title === id).fields;
  record('retry after refresh: completed + vendor number',
    final.Status === 'completed' && final.VendorNumber === 'VND-GRAPH1',
    { status: final.Status, vendor: final.VendorNumber });

  // ---- 5. Security additions (Aug 2026 audit fixes) ----

  // 5a. AP page reads typed bank details from the RESTRICTED list (not
  //     FormDataJSON, which never contains them in production)
  await page.goto(`${BASE}/ap-review/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const bankShown = await page.evaluate(() => ({
    account: /12345678/.test(document.body.innerText),
    name: /Name on Account/.test(document.body.innerText),
  }));
  record('security: AP page shows bank details from SSF-BankDetails list',
    bankShown.account && bankShown.name, bankShown);

  // 5b. SharePoint-permission denial on the bank list surfaces the warning
  await fetch(`${MOCK}/__setuser`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mail: 'graph.tester@nhs.net', denyBankList: true }) });
  await page.goto(`${BASE}/ap-review/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const denied = await page.evaluate(() =>
    /does not have access to the restricted bank details/i.test(document.body.innerText) &&
    !/12345678/.test(document.body.innerText));
  record('security: bank list 403 -> warning shown, NO account number rendered', denied);

  // 5c. Requester ownership guard: a session with no reviewer roles cannot
  //     open someone else's submission through the app
  await fetch(`${MOCK}/__setuser`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mail: 'random.requester@nhs.net', displayName: 'Random Requester' }) });
  await page.goto(`${BASE}/respond/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const blocked = await page.evaluate(() => ({
    deniedText: /Access Denied|permission to view|Failed to load/i.test(document.body.innerText),
    dataLeaked: /Testcorp Compliance Ltd/.test(document.body.innerText),
  }));
  record('security: foreign requester BLOCKED from another user\'s submission',
    blocked.deniedText && !blocked.dataLeaked, blocked);

  // 5d. ...but the real owner still gets in (guard doesn't over-block)
  await fetch(`${MOCK}/__setuser`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mail: 'graph.tester@nhs.net' }) });
  await page.goto(`${BASE}/respond/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const ownerOk = await page.evaluate(() => /Testcorp Compliance Ltd|SUP-2026/.test(document.body.innerText));
  record('security: legitimate owner still accesses their own submission', ownerOk);

  // 5e. Illegal workflow transition rejected by the provider pre-check.
  //     Reload the completed item, then attempt an illegal jump directly.
  await fetch(`${MOCK}/__setuser`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mail: 'graph.tester@nhs.net' }) });
  const illegalRejected = await page.evaluate(async (subId) => {
    const mod = await import('/src/services/StorageProvider.js');
    const storage = mod.default;
    await storage.getSubmission(subId); // baseline currentStatus (completed)
    try {
      await storage.updateSubmission(subId, { status: 'pending_review' });
      return { rejected: false };
    } catch (e) {
      return { rejected: e.code === 'ILLEGAL_TRANSITION', msg: e.message };
    }
  }, id).catch((e) => ({ rejected: false, msg: e.message }));
  record('security: provider rejects illegal Status transition (completed→pending_review)',
    illegalRejected.rejected, illegalRejected.msg);

  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('SMOKE FAILED:', e.message); process.exit(1); });
