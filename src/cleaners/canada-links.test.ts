import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { rewriteCanadaLinks } from './canada-links.ts';
import { cleanHtml } from '../index.ts';

function run(href: string): string {
  const { document } = new JSDOM(`<a href="${href}">Link</a>`).window;

  rewriteCanadaLinks(document);

  return document.querySelector('a')?.getAttribute('href') ?? '';
}

test('rewrite Canada.ca paths while preserving query strings and fragments', () => {
  expect(
    run('https://www.canada.ca/en/services.html?lang=en#section'),
  ).toBe('/content/canadasite/en/services.html?lang=en#section');
});

test('rewrite Canada.ca home page paths', () => {
  expect(run('https://www.canada.ca/home.html')).toBe('/content/canadasite/home.html');
});

test('rewrite Canada.ca root links', () => {
  expect(run('https://www.canada.ca/')).toBe('/content/canadasite/');
});

test.each([
  'http://www.canada.ca/home.html',
  'https://canada.ca/home.html',
  'https://example.com/home.html',
])('leave non-Canada.ca links unchanged: %s', (href) => {
  expect(run(href)).toBe(href);
});

test('rewrite Canada.ca links only for the Canada.ca platform', () => {
  const html = '<a href="https://www.canada.ca/home.html">Home</a>';

  expect(cleanHtml(html, 'en', 'canada')).toBe(
    '<a href="/content/canadasite/home.html">Home</a>',
  );
  expect(cleanHtml(html, 'en', 'myssc')).toBe(
    '<a href="https://www.canada.ca/home.html">Home</a>',
  );
});
