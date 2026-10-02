import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });
  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, name: e.name })));
  if (inputs.length >= 2) {
    await page.fill(inputs[0].id ? `#${inputs[0].id}` : 'input[name="email"]', 'fedorovich.web@yandex.ru');
    await page.fill(inputs[1].id ? `#${inputs[1].id}` : 'input[name="password"]', 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  // Check the duplicate service page header buttons
  const duplicateUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/2yI2Yd6ADIg517NIs2T8G';
  await page.goto(duplicateUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const headerButtons = await page.$$eval('header button, .flex button, div button', els =>
    els.map(e => ({
      text: e.innerText?.trim(),
      title: e.getAttribute('title') || e.getAttribute('aria-label'),
      className: e.className,
      innerHTML: e.innerHTML.slice(0, 100)
    })).filter(b => b.innerHTML.includes('svg') || b.text.includes('Delete') || b.title)
  );
  console.log('Duplicate page buttons with svg/title:', JSON.stringify(headerButtons.slice(0, 20), null, 2));

  await browser.close();
}

run().catch(console.error);
