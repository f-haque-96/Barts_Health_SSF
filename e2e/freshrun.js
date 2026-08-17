// Fresh full-suite bootstrap: clears state, submits a new base form through the
// real UI, records baseid.txt, and saves storage state for suite.js stages.
const { launch, BASE } = require('./helpers');
const { run } = require('./fillform');
const fs = require('fs');

(async () => {
  const { browser, page } = await launch(false);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  const { id } = await run(page);
  if (!id) throw new Error('no submission id');
  fs.writeFileSync(__dirname + '/baseid.txt', id);
  await page.saveState();
  console.log('BASE SUBMISSION READY:', id);
  await browser.close();
})().catch((e) => { console.error('FRESHRUN FAILED:', e.message); process.exit(1); });
