import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Launching browser to log into Dokploy...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to https://cp.flatero.ru/ ...');
  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });

  console.log('Current page URL:', page.url());
  console.log('Page title:', await page.title());

  await page.waitForTimeout(3000);
  const screenshotPath = path.join(__dirname, 'dokploy-login-screen.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved login screenshot to:', screenshotPath);

  const inputs = await page.$$eval('input', els => els.map(e => ({
    type: e.type,
    name: e.name,
    id: e.id,
    placeholder: e.placeholder,
    outerHTML: e.outerHTML.slice(0, 200)
  })));
  console.log('Inputs found on page:', JSON.stringify(inputs, null, 2));

  // If there are inputs, fill the first as email/user and second as password
  if (inputs.length >= 2) {
    const emailSelector = inputs[0].id ? `#${inputs[0].id}` : (inputs[0].name ? `input[name="${inputs[0].name}"]` : 'input:nth-of-type(1)');
    const passSelector = inputs[1].id ? `#${inputs[1].id}` : (inputs[1].name ? `input[name="${inputs[1].name}"]` : 'input:nth-of-type(2)');
    console.log(`Using selectors: ${emailSelector}, ${passSelector}`);
    await page.fill(emailSelector, 'fedorovich.web@yandex.ru');
    await page.fill(passSelector, 'nwRL8aK6mnJJ6edYL1');
    console.log('Clicking login button...');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  // Navigate directly to WebDiag project environment
  const webdiagUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl';
  console.log('Navigating directly to WebDiag environment:', webdiagUrl);
  await page.goto(webdiagUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Clicking Create Service...');
  await page.click('button:has-text("Create Service")');
  await page.waitForTimeout(1500);

  const modalScreen = path.join(__dirname, 'dokploy-create-service-modal.png');
  await page.screenshot({ path: modalScreen });
  console.log('Saved Create Service modal screenshot to:', modalScreen);

  console.log('Clicking Compose menuitem...');
  await page.click('[role="menuitem"]:has-text("Compose")');
  await page.waitForTimeout(1500);

  const composeDialogScreen = path.join(__dirname, 'dokploy-compose-dialog.png');
  await page.screenshot({ path: composeDialogScreen });
  console.log('Saved Compose dialog screenshot to:', composeDialogScreen);

  console.log('Filling service name: webdiag-core...');
  await page.fill('input[name="name"]', 'webdiag-core');
  await page.waitForTimeout(500);

  console.log('Clicking Create button...');
  await page.click('button[type="submit"]:has-text("Create")');
  await page.waitForTimeout(3000);

  console.log('Current URL after service creation:', page.url());
  const serviceScreen = path.join(__dirname, 'dokploy-service-created.png');
  await page.screenshot({ path: serviceScreen, fullPage: true });
  console.log('Saved service screen to:', serviceScreen);

  // Inspect tabs or buttons on the service page
  const serviceTabs = await page.$$eval('[role="tab"], button, a', els =>
    els.map(e => ({
      tag: e.tagName.toLowerCase(),
      text: e.innerText?.trim().replace(/\n+/g, ' '),
      role: e.getAttribute('role'),
      href: e.getAttribute('href')
    })).filter(e => e.text && e.text.length < 40)
  );
  console.log('Service page tabs and actions:', JSON.stringify(serviceTabs.slice(0, 30), null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error('Automation error:', err);
  process.exit(1);
});
