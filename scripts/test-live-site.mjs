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

  // Test 1: With normal context (strict SSL)
  console.log('Testing https://webdiag.ru/ with strict SSL...');
  const strictContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const strictPage = await strictContext.newPage();
  let strictSuccess = false;
  try {
    const res = await strictPage.goto('https://webdiag.ru/', { waitUntil: 'domcontentloaded', timeout: 8000 });
    console.log(`Strict SSL SUCCESS! Status: ${res.status()}, Title: ${await strictPage.title()}`);
    strictSuccess = true;
  } catch (err) {
    console.log(`Strict SSL not yet ready: ${err.message}`);
  }

  // Test 2: If strict not ready yet, test with ignoreHTTPSErrors
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  console.log('Navigating to https://webdiag.ru/ (ignoreHTTPSErrors: true)...');
  const res = await page.goto('https://webdiag.ru/', { waitUntil: 'networkidle', timeout: 15000 });
  console.log(`HTTP Status: ${res.status()}`);
  console.log(`Page title: ${await page.title()}`);

  const homeScreenshot = path.join(__dirname, 'webdiag-production-home.png');
  await page.screenshot({ path: homeScreenshot, fullPage: true });
  console.log('Saved home screenshot to:', homeScreenshot);

  // Check language switch
  console.log('Checking page text and navigation...');
  const h1Text = await page.$eval('h1', el => el.innerText).catch(() => 'No H1');
  console.log('H1:', h1Text);

  // Navigate to /tools
  console.log('Navigating to /tools ...');
  await page.goto('https://webdiag.ru/tools', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('Tools page title:', await page.title());

  const toolsScreenshot = path.join(__dirname, 'webdiag-production-tools.png');
  await page.screenshot({ path: toolsScreenshot, fullPage: true });
  console.log('Saved tools screenshot to:', toolsScreenshot);

  // Navigate to /account
  console.log('Navigating to /account ...');
  await page.goto('https://webdiag.ru/account', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('Account page title:', await page.title());

  const accountScreenshot = path.join(__dirname, 'webdiag-production-account.png');
  await page.screenshot({ path: accountScreenshot, fullPage: true });
  console.log('Saved account screenshot to:', accountScreenshot);

  await browser.close();
}

run().catch(console.error);
