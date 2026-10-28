import { books } from '../lib/library';

export function GET() {
  return new Response(JSON.stringify(books.map(({ id, title, author, category, date, highlights, href, searchText }) => ({
    id, title, author, category, date, highlights, href, searchText,
  }))), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
