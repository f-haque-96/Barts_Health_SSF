// Shared helpers for SSF workflow verification (playwright-core + installed Edge)
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const STATE = path.join(__dirname, 'state.json');

async function launch(useState = false) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 950 },
    ...(useState && fs.existsSync(STATE) ? { storageState: STATE } : {}),
  });
  const page = await context.newPage();
  page.saveState = () => context.storageState({ path: STATE });
  // Auto-accept every alert/confirm so blocking dialogs never hang the run;
  // record them so we can assert on their text.
  page.dialogs = [];
  page.on('dialog', async (d) => {
    page.dialogs.push({ type: d.type(), message: d.message() });
    await d.accept();
  });
  page.consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') page.consoleErrors.push(m.text());
  });
  return { browser, context, page };
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false });
}

// Read a submission straight from the app's own dev store
async function getSub(page, id) {
  return page.evaluate((sid) => {
    const raw = localStorage.getItem(`submission_${sid}`);
    return raw ? JSON.parse(raw) : null;
  }, id);
}

async function status(page, id) {
  const s = await getSub(page, id);
  return s ? { status: s.status, currentStage: s.currentStage } : null;
}

module.exports = { BASE, SHOTS, launch, shot, getSub, status };