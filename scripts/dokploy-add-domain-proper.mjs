import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function addDomain(page, domainName) {
  console.log(`\n=== Adding domain: ${domainName} ===`);
  await page.click('button:has-text("Add Domain")');
  await page.waitForTimeout(1500);

  // Click Manual button
  console.log('Clicking Manual service name button...');
  await page.click('button:has-text("Manual")');
  await page.waitForTimeout(500);

  // Fill serviceName
  console.log('Filling serviceName: web');
  await page.fill('input[name="serviceName"]', 'web');

  // Fill host
  console.log(`Filling host: ${domainName}`);
  await page.fill('input[name="host"]', domainName);

  // Container port is already 3000, but fill it explicitly
  await page.fill('input[name="port"]', '3000');

  // Enable HTTPS switch: find the switch in the container with "HTTPS Automatically provision SSL Certificate"
  console.log('Finding HTTPS switch...');
  const httpsContainer = await page.$('div:has-text("HTTPS Automatically provision SSL Certificate.")');
  const httpsSwitch = await httpsContainer?.$('button[role="switch"]');
  if (httpsSwitch) {
    const isChecked = await httpsSwitch.getAttribute('aria-checked');
    console.log(`HTTPS switch aria-checked before click: ${isChecked}`);
    if (isChecked !== 'true') {
      await httpsSwitch.click();
      await page.waitForTimeout(500);
      console.log(`HTTPS switch aria-checked after click: ${await httpsSwitch.getAttribute('aria-checked')}`);
    }
  }

  // Ensure Strip Path is NOT enabled
  const stripContainer = await page.$('div:has-text("Strip Path Remove the external path")');
  const stripSwitch = await stripContainer?.$('button[role="switch"]');
  if (stripSwitch) {
    const isChecked = await stripSwitch.getAttribute('aria-checked');
    console.log(`Strip Path switch aria-checked: ${isChecked}`);
    if (isChecked === 'true') {
      await stripSwitch.click();
      await page.waitForTimeout(500);
    }
  }

  const screenshotModal = path.join(__dirname, `dokploy-domain-${domainName.replace(/[^a-z0-9]/g, '_')}-ready.png`);
  await page.screenshot({ path: screenshotModal });
  console.log('Saved modal screenshot to:', screenshotModal);

  // Click Create button
  console.log('Clicking Create button...');
  await page.click('[role="dialog"] button[type="submit"]:has-text("Create")');
  await page.waitForTimeout(3000);

  console.log('Domain creation submitted.');
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('Logging in...');
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

  // Navigate to Domains tab
  console.log('Opening Domains tab...');
  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  // Close any lingering modal if open
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Add webdiag.ru
  await addDomain(page, 'webdiag.ru');

  // Add app.webdiag.ru
  await addDomain(page, 'app.webdiag.ru');

  const finalScreen = path.join(__dirname, 'dokploy-domains-list.png');
  await page.screenshot({ path: finalScreen, fullPage: true });
  console.log('Saved final domains screenshot to:', finalScreen);

  // Print all domain entries on the page
  const domainsList = await page.$$eval('table tr, div[class*="border"]', els =>
    els.map(e => e.innerText?.trim().replace(/\n+/g, ' ')).filter(t => t && (t.includes('webdiag.ru') || t.includes('HTTPS')))
  );
  console.log('Configured domains listed on page:\n', domainsList);

  await browser.close();
}

run().catch(console.error);
