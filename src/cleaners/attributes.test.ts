import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { cleanAttributes } from './attributes.ts';

test('remove class attribute', () => {
  const initialHtml = '<div class="well well-lg">Test</div>';
  const finalHtml = '<div>Test</div>';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  cleanAttributes(dom.window.document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('keep id attribute', () => {
  const html = '<div id="some-id">Test</div>';
  const dom = new JSDOM(html);
  const { document } = dom.window;

  cleanAttributes(document);

  expect(document.body.innerHTML).toBe(html);
});
