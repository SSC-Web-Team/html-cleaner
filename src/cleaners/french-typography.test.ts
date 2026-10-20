import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { cleanFrenchTypography } from './french-typography.ts';
import { cleanHtml } from '../index.ts';

test('add a nonbreaking space before colons and dollar signs', () => {
  const { document } = new JSDOM(
    '<p>Bonjour : 25 $, et 10$</p><code>http://example.com</code>',
  ).window;

  cleanFrenchTypography(document);

  expect(document.body.innerHTML).toBe(
    '<p>Bonjour&nbsp;: 25&nbsp;$, et 10&nbsp;$</p><code>http://example.com</code>',
  );
});

test('add nonbreaking spaces between French thousands groups', () => {
  const { document } = new JSDOM(
    '<p>1 239; 13 333 333; 1234 567; 1 23</p>',
  ).window;

  cleanFrenchTypography(document);

  expect(document.body.innerHTML).toBe(
    '<p>1&nbsp;239; 13&nbsp;333&nbsp;333; 1234 567; 1 23</p>',
  );
});

test('apply French typography only when French is selected', () => {
  const html = '<p>Bonjour : 1 025 $</p>';

  expect(cleanHtml(html, 'fr')).toBe('<p>Bonjour&nbsp;: 1&nbsp;025&nbsp;$</p>');
  expect(cleanHtml(html, 'en')).toBe('<p>Bonjour : 1 025 $</p>');
});

test('beautify cleaned HTML with indentation', () => {
  expect(cleanHtml('<section><p>First</p><p>Second</p></section>')).toBe(
    '<section>\n  <p>First</p>\n  <p>Second</p>\n</section>',
  );
});
