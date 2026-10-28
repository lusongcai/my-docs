import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.argv[2] || 'http://127.0.0.1:4328';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const checks = [];
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 1440, height: 900 });
  const ready = async () => {
    await page.waitForFunction(() => !document.querySelector('#grid-view')?.hidden &&
      document.querySelector('#page-number')?.textContent.includes('/'), { timeout: 20000 });
  };
  await page.goto(`${base}/library/`, { waitUntil: 'networkidle2' });
  await ready();
  assert.equal(await page.$$eval('.library-book:not([hidden])', (items) => items.length), 12);
  await page.click('#next');
  await page.waitForFunction(() => document.querySelector('#page-number').textContent.startsWith('2'));
  assert(new URL(page.url()).searchParams.get('page') === '2');
  checks.push('pagination and URL state');

  await page.goto(`${base}/library/?category=${encodeURIComponent('心理')}`, { waitUntil: 'networkidle2' });
  await ready();
  assert.equal(await page.$eval('#category', (el) => el.value), '心理');
  assert(await page.$$eval('.library-book:not([hidden]) .book-meta', (items) => items.every((el) => el.textContent.includes('心理'))));
  await page.click('#list-view');
  assert(await page.$eval('#book-results', (el) => el.classList.contains('is-list')));
  checks.push('category deep links and list view');

  await page.click('#reset');
  await page.type('#search', '阿德勒');
  await page.waitForFunction(() => document.querySelector('#result-count').textContent.includes('找到'));
  assert(await page.$$eval('.library-book:not([hidden])', (items) => items.length > 0));
  await page.click('#reset');
  await page.type('#search', '自卑能毁灭你');
  await page.waitForFunction(() => document.querySelector('#result-count').textContent.includes('找到'));
  assert(await page.$$eval('.library-book:not([hidden]) h2', (items) => items.some((el) => el.textContent.includes('自卑与超越'))));
  checks.push('author search and full-text search');

  await page.click('#reset');
  await page.type('#search', 'zzzzunfindable123456789');
  await page.waitForFunction(() => !document.querySelector('#empty-results').hidden);
  assert.equal(await page.$$eval('.library-book:not([hidden])', (items) => items.length), 0);
  checks.push('empty search state');

  await page.goto(`${base}/books/919582/`, { waitUntil: 'networkidle2' });
  const heading = await page.$eval('h1', (el) => el.textContent);
  assert(heading.includes('传习录'));
  assert.equal(await page.$eval('.prose', (el) => el.textContent.includes('[!abstract]')), false);
  const fragment = await page.$eval('.reading-toc a', (el) => el.getAttribute('href').slice(1));
  assert(await page.evaluate((id) => !!document.getElementById(id), fragment));
  checks.push('reading content and table of contents');

  for (const width of [320, 375, 768, 1280, 1920]) {
    await page.setViewport({ width, height: 900 });
    for (const path of ['/', '/library/', '/books/919582/']) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle2' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${path} overflows at ${width}px`);
    }
  }
  checks.push('no horizontal overflow across five widths');

  await page.setJavaScriptEnabled(false);
  await page.goto(`${base}/library/`, { waitUntil: 'networkidle2' });
  assert((await page.$$eval('.library-book', (items) => items.length)) >= 68);
  await page.goto(`${base}/books/919582/`, { waitUntil: 'networkidle2' });
  assert((await page.$eval('.prose', (el) => el.textContent.length)) > 1000);
  checks.push('readable content with JavaScript disabled');
  assert.deepEqual(errors, []);
  console.log(`Browser checks passed: ${checks.join('; ')}.`);
} finally {
  await browser.close();
}
