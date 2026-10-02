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

  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  // Click edit icon on webdiag.ru card
  console.log('Clicking edit icon on webdiag.ru card...');
  const editButtons = await page.$$('div:has-text("webdiag.ru") button:has(svg.lucide-pen-line), div:has-text("webdiag.ru") button:has(svg.lucide-pencil), div:has-text("webdiag.ru") button:has(svg)');
  // Let's find button with pencil in the first card
  const firstCard = await page.$('div:has(> * :text-is("webdiag.ru"))');
  const pencil = await page.$('button svg.lucide-pencil, button svg.lucide-pen-line, button:has(svg.lucide-square-pen)');
  if (pencil) {
    await pencil.click();
    await page.waitForTimeout(1000);
    const editScreen = path.join(__dirname, 'dokploy-edit-domain-modal.png');
    await page.screenshot({ path: editScreen });
    console.log('Saved edit domain modal screenshot to:', editScreen);

    // List all switches and selects in edit modal
    const modalDetails = await page.$$eval('[role="dialog"] *', els =>
      els.filter(e => e.tagName === 'LABEL' || e.tagName === 'SELECT' || e.getAttribute('role') === 'switch' || e.tagName === 'BUTTON')
         .map(e => ({
           tag: e.tagName.toLowerCase(),
           text: e.innerText?.trim().replace(/\n+/g, ' '),
           role: e.getAttribute('role'),
           checked: e.getAttribute('aria-checked')
         }))
    );
    console.log('Edit domain modal details:\n', JSON.stringify(modalDetails, null, 2));
  }

  // Also check "Validate DNS" on webdiag.ru
  console.log('Checking Validate DNS button...');
  const validateDnsBtn = await page.$('button:has-text("Validate DNS")');
  if (validateDnsBtn) {
    await validateDnsBtn.click();
    await page.waitForTimeout(2000);
    const valScreen = path.join(__dirname, 'dokploy-validate-dns.png');
    await page.screenshot({ path: valScreen });
    console.log('Saved validate DNS screenshot to:', valScreen);
  }

  await browser.close();
}

run().catch(console.error);
