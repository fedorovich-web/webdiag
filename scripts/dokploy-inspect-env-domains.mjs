import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });
  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, name: e.name })));
  if (inputs.length >= 2) {
    await page.fill(inputs[0].id ? `#${inputs[0].id}` : 'input[name="email"]', 'fedorovich.web@yandex.ru');
    await page.fill(inputs[1].id ? `#${inputs[1].id}` : 'input[name="password"]', 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  const serviceUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/IIFs-ezxHret2rViaDEek';
  await page.goto(serviceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Inspect Environment tab editor
  await page.click('[role="tab"]:has-text("Environment")');
  await page.waitForTimeout(1500);

  const envEditors = await page.$$eval('.monaco-editor, .cm-editor, textarea, [contenteditable]', els =>
    els.map(e => ({
      tag: e.tagName.toLowerCase(),
      className: e.className,
      value: e.value || e.innerText?.slice(0, 100)
    }))
  );
  console.log('Environment editors found:', JSON.stringify(envEditors, null, 2));

  // Inspect Domains tab -> Add Domain modal
  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  await page.click('button:has-text("Add Domain")');
  await page.waitForTimeout(1000);

  const addDomainScreen = path.join(__dirname, 'dokploy-add-domain-modal.png');
  await page.screenshot({ path: addDomainScreen });
  console.log('Saved Add Domain modal screenshot to:', addDomainScreen);

  const domainInputs = await page.$$eval('[role="dialog"] input, [role="dialog"] select, [role="dialog"] button', els =>
    els.map(e => ({
      tag: e.tagName.toLowerCase(),
      type: e.getAttribute('type'),
      name: e.getAttribute('name'),
      placeholder: e.getAttribute('placeholder'),
      text: e.innerText?.trim()
    }))
  );
  console.log('Add Domain modal elements:', JSON.stringify(domainInputs, null, 2));

  await browser.close();
}

run().catch(console.error);
