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

  // Find cards with webdiag.ru
  const cards = await page.$$('div:has(> * :text-is("webdiag.ru")), div:has-text("webdiag.ru")');
  console.log(`Found cards for webdiag.ru: ${cards.length}`);

  // Find all buttons inside the domain card for webdiag.ru
  const domainCard = await page.$('div.group\\/card:has-text("webdiag.ru"), div[class*="rounded"]:has-text("webdiag.ru")');
  if (domainCard) {
    const cardButtons = await domainCard.$$eval('button', els => els.map((e, idx) => ({
      idx,
      text: e.innerText?.trim(),
      html: e.innerHTML.slice(0, 100),
      className: e.className
    })));
    console.log('Domain card buttons:', JSON.stringify(cardButtons, null, 2));

    // The pencil button is usually the second icon button on the top right
    const iconButtons = await domainCard.$$('button:not(:has-text("Validate DNS"))');
    console.log(`Found ${iconButtons.length} icon buttons in card`);
    if (iconButtons.length >= 2) {
      console.log('Clicking the pencil edit button...');
      await iconButtons[1].click(); // index 1 is pencil (index 0 is ?, index 1 is pencil, index 2 is trash)
      await page.waitForTimeout(1500);

      const editModalScreen = path.join(__dirname, 'dokploy-domain-edit-opened.png');
      await page.screenshot({ path: editModalScreen });
      console.log('Saved edit modal screenshot to:', editModalScreen);

      // Check switches in modal
      const switches = await page.$$('[role="dialog"] button[role="switch"]');
      console.log(`Found ${switches.length} switches in edit dialog`);
      if (switches.length >= 3) {
        const httpsState = await switches[2].getAttribute('aria-checked');
        console.log(`Current HTTPS state: ${httpsState}`);
        if (httpsState !== 'true') {
          console.log('Toggling HTTPS ON...');
          await switches[2].click();
          await page.waitForTimeout(500);
        }
        // Save
        console.log('Clicking Update / Save button...');
        await page.click('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("Update"), [role="dialog"] button:has-text("Save")');
        await page.waitForTimeout(2500);
      }
    }
  }

  // Also do the same for app.webdiag.ru
  const appCard = await page.$('div.group\\/card:has-text("app.webdiag.ru"), div[class*="rounded"]:has-text("app.webdiag.ru")');
  if (appCard) {
    const iconButtons = await appCard.$$('button:not(:has-text("Validate DNS"))');
    if (iconButtons.length >= 2) {
      console.log('Clicking edit for app.webdiag.ru...');
      await iconButtons[1].click();
      await page.waitForTimeout(1500);

      const switches = await page.$$('[role="dialog"] button[role="switch"]');
      if (switches.length >= 3) {
        const httpsState = await switches[2].getAttribute('aria-checked');
        if (httpsState !== 'true') {
          console.log('Toggling HTTPS ON for app.webdiag.ru...');
          await switches[2].click();
          await page.waitForTimeout(500);
        }
        await page.click('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("Update"), [role="dialog"] button:has-text("Save")');
        await page.waitForTimeout(2500);
      }
    }
  }

  const resultScreen = path.join(__dirname, 'dokploy-domains-with-https.png');
  await page.screenshot({ path: resultScreen, fullPage: true });
  console.log('Saved updated domains screenshot to:', resultScreen);

  await browser.close();
}

run().catch(console.error);
