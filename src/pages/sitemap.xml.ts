import { books } from '../lib/library';

export function GET() {
  const paths = ['/', '/library/', ...books.map((book) => book.href)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>https://lusongcai.github.io${path}</loc></url>`).join('')}</urlset>`,
  { headers: { 'Content-Type': 'application/xml' } });
}
