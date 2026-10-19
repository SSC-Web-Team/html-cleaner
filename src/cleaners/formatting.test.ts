import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { cleanFormatting } from './formatting.ts';

test.each(['<br>', '<br />'])('move a trailing break before the closing strong tag: %s', (breakTag) => {
  const dom = new JSDOM(`<strong>Bold${breakTag}</strong>`);
  const { document } = dom.window;

  cleanFormatting(document);

  expect(document.body.innerHTML).toBe('<strong>Bold</strong><br>');
});

test('move consecutive trailing breaks outside a bold tag', () => {
  const dom = new JSDOM('<b>Bold<br><br></b>');
  const { document } = dom.window;

  cleanFormatting(document);

  expect(document.body.innerHTML).toBe('<b>Bold</b><br><br>');
});
