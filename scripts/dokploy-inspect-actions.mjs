import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;

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

  const deployButtons = await page.$$eval('button', els =>
    els.map((e, idx) => ({
      idx,
      text: e.innerText?.trim(),
      outerHTML: e.outerHTML.slice(0, 200),
      disabled: e.disabled
    })).filter(b => b.text && (b.text.includes('Deploy') || b.text.includes('Rebuild') || b.text.includes('Start')))
  );
  console.log('Action buttons:', JSON.stringify(deployButtons, null, 2));

  await browser.close();
}

run().catch(console.error);
