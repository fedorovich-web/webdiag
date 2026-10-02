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

  console.log('Navigating to Environment tab...');
  await page.click('[role="tab"]:has-text("Environment")');
  await page.waitForTimeout(1500);

  // Look for eye button (button inside the Environment Settings header or near it)
  console.log('Looking for eye button...');
  const eyeButtons = await page.$$eval('button', els => els.map((e, idx) => ({
    idx,
    html: e.innerHTML,
    ariaLabel: e.getAttribute('aria-label')
  })).filter(b => b.html.includes('lucide-eye') || b.html.includes('eye')));
  console.log('Eye buttons:', eyeButtons);

  if (eyeButtons.length > 0) {
    console.log(`Clicking eye button index ${eyeButtons[0].idx}...`);
    const btns = await page.$$('button');
    await btns[eyeButtons[0].idx].click();
    await page.waitForTimeout(1000);
  }

  // Now check if cm-content is clickable or if overlay is gone
  console.log('Checking editor overlay...');
  const overlay = await page.$('div[class*="[background:var(--overlay)]"]');
  console.log('Overlay present?', Boolean(overlay));

  // Focus and type or paste into cm-content
  console.log('Focusing editor...');
  await page.click('.cm-content');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(500);

  console.log('Typing environment variables...');
  // Type or paste via clipboard API
  await page.evaluate((text) => {
    const el = document.querySelector('.cm-content');
    if (el) {
      el.focus();
      document.execCommand('insertText', false, text);
    }
  }, ENV_CONTENT);
  await page.waitForTimeout(1000);

  const envContentCheck = await page.$eval('.cm-content', el => el.innerText);
  console.log('Editor text after insertion:\n', envContentCheck);

  // Click Save
  console.log('Clicking Save...');
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(2000);

  const savedScreen = path.join(__dirname, 'dokploy-env-saved-success.png');
  await page.screenshot({ path: savedScreen, fullPage: true });
  console.log('Saved screenshot to:', savedScreen);

  await browser.close();
}

run().catch(console.error);
