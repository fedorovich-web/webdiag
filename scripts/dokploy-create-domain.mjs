import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function addDomain(page, domainName) {
  console.log(`Adding domain: ${domainName}...`);
  await page.click('button:has-text("Add Domain")');
  await page.waitForTimeout(1500);

  // Click Manual button
  await page.click('button:has-text("Manual")');
  await page.waitForTimeout(500);

  // Fill serviceName
  await page.fill('input[name="serviceName"]', 'web');

  // Fill host
  await page.fill('input[name="host"]', domainName);

  // Fill port
  await page.fill('input[name="port"]', '3000');

  // Find HTTPS switch: it's the switch right after the label with text "HTTPS"
  const httpsSwitch = await page.$('label:has-text("HTTPS") ~ button[role="switch"], div:has(> label:has-text("HTTPS")) button[role="switch"]');
  if (httpsSwitch) {
    const isChecked = await httpsSwitch.getAttribute('aria-checked');
    console.log(`HTTPS switch aria-checked: ${isChecked}`);
    if (isChecked !== 'true') {
      console.log('Enabling HTTPS switch...');
      await httpsSwitch.click();
      await page.waitForTimeout(500);
    }
  } else {
    console.log('Could not find specific HTTPS switch selector, searching by label container...');
    const labelContainer = await page.$('div:has-text("HTTPS")');
    const sw = await labelContainer?.$('button[role="switch"]');
    if (sw) {
      const isChecked = await sw.getAttribute('aria-checked');
      if (isChecked !== 'true') {
        await sw.click();
        await page.waitForTimeout(500);
      }
    }
  }

  const modalScreen = path.join(__dirname, `dokploy-domain-${domainName.replace(/[^a-z0-9]/g, '_')}-modal.png`);
  await page.screenshot({ path: modalScreen });
  console.log('Saved domain modal screenshot to:', modalScreen);

  // Click Create
  console.log('Clicking Create button in modal...');
  await page.click('[role="dialog"] button[type="submit"]:has-text("Create")');
  await page.waitForTimeout(2500);
}

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

  // Go to Domains tab
  console.log('Opening Domains tab...');
  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  // Add webdiag.ru
  await addDomain(page, 'webdiag.ru');

  // Add app.webdiag.ru
  await addDomain(page, 'app.webdiag.ru');

  const finalDomainsScreen = path.join(__dirname, 'dokploy-domains-configured.png');
  await page.screenshot({ path: finalDomainsScreen, fullPage: true });
  console.log('Saved final domains screenshot to:', finalDomainsScreen);

  await browser.close();
}

run().catch(console.error);
