import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sanitizeHtml from 'sanitize-html';

const root = new URL('../dist/', import.meta.url).pathname;
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((e) => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))).flat();
}
const files = await walk(root);
assert(files.some((p) => p.endsWith('/index.html')), 'Homepage is missing');
assert(!files.some((p) => /\/(\.obsidian|\.trash)\//.test(p)), 'Private editor or trash directory was published');
const books = JSON.parse(await readFile(join(root, 'search.json'), 'utf8'));
assert(books.length > 0, 'Library is empty');
assert.equal(new Set(books.map((b) => b.id)).size, books.length, 'Duplicate book IDs');
for (const book of books) {
  assert(book.title && book.author && book.href, `Incomplete book metadata: ${book.id}`);
  const html = await readFile(join(root, decodeURIComponent(book.href), 'index.html'), 'utf8');
  assert(html.includes('class="prose"'), `Reading view missing: ${book.id}`);
  assert(!html.includes('[!abstract]'), `Unprocessed Obsidian callout: ${book.id}`);
}
let links = 0;
for (const path of files.filter((p) => p.endsWith('.html'))) {
  const html = await readFile(path, 'utf8');
  const refs = [];
  sanitizeHtml(html, { onOpenTag: (tag, attrs) => {
    if (tag === 'a' && attrs.href?.startsWith('/')) refs.push(attrs.href);
    if (tag === 'script' && attrs.src?.startsWith('/')) refs.push(attrs.src);
    if (tag === 'link' && attrs.href?.startsWith('/')) refs.push(attrs.href);
  } });
  for (const href of refs) {
    const url = new URL(href, 'https://lusongcai.github.io');
    const target = join(root, decodeURIComponent(url.pathname));
    const resolved = url.pathname.endsWith('/') ? join(target, 'index.html') : target;
    await stat(resolved).catch(() => assert.fail(`Broken local URL ${href} in ${path}`));
    links++;
  }
}
console.log(`Verified ${books.length} unique books, ${files.filter((p) => p.endsWith('.html')).length} HTML pages and ${links} local links/assets.`);
