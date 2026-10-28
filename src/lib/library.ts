import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  subcategory: string;
  cover: string;
  date: string;
  path: string;
  href: string;
  description: string;
  highlights: number;
  content: string;
  searchText: string;
  headings: { id: string; text: string; level: number }[];
};

const root = process.cwd();
const excluded = new Set(['src', 'public', 'scripts', 'node_modules', 'dist']);
async function notePaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = await Promise.all(entries.filter((e) => !e.name.startsWith('.') && !excluded.has(e.name)).map(async (entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return notePaths(path);
    return entry.name.endsWith('.md') && !/^(README|SITE|DESIGN|AGENTS)\.md$/i.test(entry.name) ? [path] : [];
  }));
  return paths.flat();
}

function cleanText(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*_`]/g, '').trim();
}

async function loadLibrary(): Promise<Book[]> {
  const entries = await Promise.all((await notePaths(root)).sort().map(async (path) => {
    const { data, content } = matter(await readFile(path, 'utf8'));
    if (data.doc_type !== 'weread-highlights-reviews') return null;
    const title = content.match(/^>\s*-\s*书名[：:]\s*(.+)$/m)?.[1]?.trim() || basename(path, '.md').split('-')[0];
    const description = content.match(/^>\s*-\s*简介[：:]\s*(.*)$/m)?.[1]?.trim() || '';
    const category = String(data.category || relative(root, path).split('/')[0]).split('-')[0];
    const id = String(data.bookId || basename(path, '.md'));
    const date = data.lastReadDate instanceof Date ? data.lastReadDate.toISOString().slice(0, 10) : String(data.lastReadDate || '').slice(0, 10);
    // Older exports name the metadata heading after the book instead of "元数据".
    const readingStart = content.search(/^# (高亮划线|读书笔记|本书评论)\s*$/m);
    const formattedBody = (readingStart >= 0 ? content.slice(readingStart) : content)
      .replace(/^[ \t]*-[ \t]*⏱[ \t]*(.+)$/gm, '\n<time class="highlight-time">$1</time>\n')
      .replace(/(^[ \t]*-[ \t]*)📌[ \t]*/gm, '$1')
      .replace(/ \^[\w-]+/g, '');
    const body = formattedBody.split(/(?=^# )/m)
      .filter((section) => !/^# (高亮划线|读书笔记|本书评论)[ \t]*\r?\n\s*$/.test(section))
      .join('');
    const headings: Book['headings'] = [];
    let sequence = 0;
    const renderer = new marked.Renderer();
    renderer.heading = ({ tokens, depth }) => {
      const text = cleanText(tokens.map((token) => token.raw).join(''));
      const id = `section-${++sequence}`;
      const level = Math.min(depth + 1, 4);
      headings.push({ id, text, level });
      return `<h${level} id="${id}">${sanitizeHtml(text, { allowedTags: [] })}</h${level}>`;
    };
    const html = marked.parse(body, { renderer, async: false }) as string;
    const safe = sanitizeHtml(html, {
      allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'time'],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        h2: ['id'], h3: ['id'], h4: ['id'],
        time: ['class'], img: ['src', 'alt', 'width', 'height', 'loading'],
        a: ['href', 'title', 'rel'],
      },
      allowedSchemes: ['https', 'http', 'mailto'],
      transformTags: {
        a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
        img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
      },
    });
    return {
      id, title, author: String(data.author || ''), category,
      subcategory: String(data.category || ''), cover: String(data.cover || '').replace(/^http:/, 'https:'),
      date, path: relative(root, path), href: `/books/${encodeURIComponent(id)}/`,
      description, highlights: (content.match(/📌/g) || []).length,
      content: safe, headings,
      searchText: cleanText(body).replace(/⏱|📌|\^[\w-]+/g, ''),
    } satisfies Book;
  }));
  // Root-level exports and category exports can refer to the same WeRead book.
  const byId = new Map<string, Book>();
  for (const book of entries.filter((b): b is Book => b !== null)) {
    const existing = byId.get(book.id);
    if (!existing || (book.path.includes('/') && !existing.path.includes('/')) || book.content.length > existing.content.length) byId.set(book.id, book);
  }
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'));
}

export const books = await loadLibrary();
export const categories = [...new Set(books.map((b) => b.category))].sort((a, b) =>
  books.filter((v) => v.category === b).length - books.filter((v) => v.category === a).length || a.localeCompare(b, 'zh-CN'));
export const sourceUrl = (book: Book) => `https://github.com/lusongcai/my-docs/blob/develop/${book.path.split('/').map(encodeURIComponent).join('/')}`;
