const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const AxeBuilder = require('@axe-core/playwright').default;

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'desktop.png', fullPage: true });
  assert.equal(await page.locator('.view.active').getAttribute('id'), 'experience');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Desktop horizontal overflow');

  await page.locator('#awaken').click();
  assert.match(await page.locator('#awaken').textContent(), /La scène est à vous/);
  await page.locator('[data-act="1"]').click();
  assert.equal(await page.locator('#act-name').textContent(), 'L’ENVOL');
  await page.locator('[data-force="gravity"]').click();
  assert.equal(await page.locator('#performer').evaluate(el => el.classList.contains('gravity')), true);
  await page.locator('#sun-handle').focus();
  const initialLeft = await page.locator('#sun-handle').evaluate(el => el.style.left);
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await page.locator('#sun-handle').evaluate(el => el.style.left), initialLeft);
  await page.locator('#sound-toggle').click();
  assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'true');
  await page.locator('#sound-toggle').click();

  await page.locator('.nav-link[data-route="recit"]').click();
  for (let step = 0; step < 3; step++) {
    await page.locator('.story-choice').first().click();
    await page.waitForTimeout(550);
  }
  assert.match(await page.locator('#story-chapter').textContent(), /CONSTELLATION/);
  await page.locator('#story-reset').click();
  assert.equal(await page.locator('.story-choice').count(), 3);
  await page.screenshot({ path: 'story.png', fullPage: true });

  await page.locator('.nav-link[data-route="programme"]').click();
  await page.locator('.book-button[data-show="Paris"]').click();
  assert.equal(await page.locator('#booking-dialog').evaluate(el => el.open), true);
  await page.locator('#ticket-count').selectOption('2');
  await page.locator('#simulate-booking').click();
  assert.match(await page.locator('#booking-result').textContent(), /Aucun billet/);
  await page.locator('.dialog-close').click();
  await page.locator('.faq summary').first().click();
  assert.equal(await page.locator('.faq details').first().getAttribute('open'), '');
  await page.screenshot({ path: 'programme.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.brand').click();
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile horizontal overflow');
  await page.screenshot({ path: 'mobile.png', fullPage: true });
  const touchTarget = await page.locator('#sun-handle').boundingBox();
  assert.ok(touchTarget.width >= 44 && touchTarget.height >= 44);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);

  for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    for (const route of ['experience', 'recit', 'programme', 'a-propos']) {
      await page.goto(`http://localhost:3000/#${route}`);
      assert.equal(await page.locator('.view.active').getAttribute('id'), route);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route} overflow at ${viewport.width}px`);
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ['experience', 'recit', 'programme', 'a-propos']) {
    await page.goto(`http://localhost:3000/#${route}`);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(audit.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })), [], `Accessibility: ${route}`);
  }
  await page.goto('http://localhost:3000/#recit');
  await page.locator('.nav-link[data-route="programme"]').click();
  await page.goBack();
  assert.equal(await page.locator('.view.active').getAttribute('id'), 'recit');
  assert.deepEqual(errors, []);
  console.log('PASS: 4 breakpoints, deep links, history, scene, touch targets, keyboard, audio, story, booking, FAQ, reduced motion, axe WCAG AA, no runtime errors.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
