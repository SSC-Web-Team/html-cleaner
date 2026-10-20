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

test('add table classes and group multiple header rows in thead', () => {
  const dom = new JSDOM(
    '<table><tr><th>First header</th></tr><tr><td><strong>Second header</strong></td></tr><tr><td>Data</td></tr></table>',
  );
  const { document } = dom.window;

  cleanFormatting(document);

  expect(document.body.innerHTML).toBe(
    '<table class="table table-condensed table-bordered"><thead><tr class="active"><th>First header</th></tr><tr><td><strong>Second header</strong></td></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>',
  );
});

test('recognize bold and strong table cells as header rows', () => {
  const dom = new JSDOM(
    '<table><tr><td><b>Bold header</b></td><td><strong>Strong header</strong></td></tr><tr><td>Data</td><td>More data</td></tr></table>',
  );
  const { document } = dom.window;

  cleanFormatting(document);

  expect(document.querySelector('thead')?.textContent).toBe('Bold headerStrong header');
  expect(document.querySelector('tbody')?.textContent).toBe('DataMore data');
  expect(document.querySelector('thead tr')?.classList.contains('active')).toBe(true);
});

test('convert first-row bold data cells to header cells', () => {
  const dom = new JSDOM(
    '<table><tr><td class="label"><strong>First header</strong></td><td><b>Second header</b></td></tr><tr><td>Data</td><td>More data</td></tr></table>',
  );
  const { document } = dom.window;

  cleanFormatting(document);

  expect(document.body.innerHTML).toBe(
    '<table class="table table-condensed table-bordered"><thead><tr class="active"><th class="label">First header</th><th>Second header</th></tr></thead><tbody><tr><td>Data</td><td>More data</td></tr></tbody></table>',
  );
});

test('put all rows in tbody when there is no header row', () => {
  const dom = new JSDOM('<table><tr><td>Data</td></tr></table>');
  const { document } = dom.window;

  cleanFormatting(document);

  expect(document.body.innerHTML).toBe(
    '<table class="table table-condensed table-bordered"><tbody><tr><td>Data</td></tr></tbody></table>',
  );
});

test('remove empty tables', () => {
  const dom = new JSDOM('<table></table><table><tr><td> </td></tr></table><table><tr><td>Content</td></tr></table>');
  const { document } = dom.window;

  cleanFormatting(document);

  expect(document.body.innerHTML).toBe(
    '<table class="table table-condensed table-bordered"><tbody><tr><td>Content</td></tr></tbody></table>',
  );
});
