import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENV_CONTENT = `WEBDIAG_ENVIRONMENT=production
WEBDIAG_PUBLIC_RELEASE=true
PUBLIC_RELEASE=true
WEBDIAG_MONITORING_INTERNAL_TOKEN=fa2826321b9d576961eb02cb26f98873075273d01b9fc6a466b06464284b04c6
WEBDIAG_CRAWLER_INTERNAL_TOKEN=d580e9547bbef9f34e52b6d791bbfa1c02b23e2bd98d09f9a087a03e7172baad
GOOGLE_PAGESPEED_API_KEY=`;

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

  // 1. Environment configuration
  console.log('Configuring Environment...');
  await page.click('[role="tab"]:has-text("Environment")');
  await page.waitForTimeout(1500);

  // Click on CodeMirror editor
  const cm = await page.$('.cm-content');
  if (cm) {
    await cm.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    // Paste or insert text
    await page.evaluate((text) => {
      const el = document.querySelector('.cm-content');
      if (el) {
        // Dispatch insert text via clipboard or simulated input
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const event = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(event);
      }
    }, ENV_CONTENT);
    await page.waitForTimeout(1000);

    // Click Save in Environment tab
    console.log('Saving environment variables...');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);

    const envSavedScreen = path.join(__dirname, 'dokploy-env-saved.png');
    await page.screenshot({ path: envSavedScreen });
    console.log('Saved env screenshot to:', envSavedScreen);
  }

  // 2. Domains configuration
  console.log('Configuring Domains...');
  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  await page.click('button:has-text("Add Domain")');
  await page.waitForTimeout(1500);

  // Click "Manual" button for service name
  console.log('Clicking Manual service name button...');
  await page.click('button:has-text("Manual")');
  await page.waitForTimeout(500);

  // Take screenshot of manual mode
  const manualScreen = path.join(__dirname, 'dokploy-domain-manual.png');
  await page.screenshot({ path: manualScreen });
  console.log('Saved manual domain modal screenshot to:', manualScreen);

  // Inspect inputs inside modal now
  const modalInputs = await page.$$eval('[role="dialog"] input', els => els.map(e => ({
    name: e.getAttribute('name'),
    placeholder: e.getAttribute('placeholder'),
    type: e.type,
    id: e.id,
    value: e.value
  })));
  console.log('Modal inputs in manual mode:', JSON.stringify(modalInputs, null, 2));

  await browser.close();
}

run().catch(console.error);
