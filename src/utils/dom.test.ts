import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { normalizeText } from './dom.ts';

test('normalize text', () => {
  const initialHtml = '\n Hello   world\n\n from\n HTML  Cleaner\n';
  const finalHtml = 'Hello world from HTML Cleaner';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  normalizeText(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('normalize HTML tag', () => {
  const initialHtml = 'Hello world <span>  from  </span> HTML Cleaner';
  const finalHtml = 'Hello world <span>from</span> HTML Cleaner';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  normalizeText(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});
