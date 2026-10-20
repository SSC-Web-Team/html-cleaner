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
    '<section>\n\n  <p>First</p>\n\n  <p>Second</p>\n</section>',
  );
});

test('add blank lines before headings, lists, divs, and tables', () => {
  expect(
    cleanHtml(
      '<p>Paragraph</p><h2>Heading</h2><ul><li>Item</li></ul><ol><li>Numbered</li></ol><div>Division</div><table><tr><td>Cell</td></tr></table>',
    ),
  ).toBe(
    '<p>Paragraph</p>\n\n<h2>Heading</h2>\n\n<ul>\n  <li>Item</li>\n</ul>\n\n<ol>\n  <li>Numbered</li>\n</ol>\n\n<div>Division</div>\n\n<table class="table table-condensed table-bordered">\n  <tbody>\n    <tr>\n      <td>Cell</td>\n    </tr>\n  </tbody>\n</table>',
  );
});

test('do not add blank lines to block tags inside unordered lists', () => {
  expect(
    cleanHtml(
      '<ul><li><p><a href="#ref-ftn1">^</a></p><div><p>This is a footnote</p></div></li><li><p><a href="#ref-ftn2">^</a></p><div><p>This is another footnote</p></div></li></ul>',
    ),
  ).toBe(
    '<ul>\n  <li>\n    <p><a href="#ref-ftn1">^</a></p>\n    <div>\n      <p>This is a footnote</p>\n    </div>\n  </li>\n  <li>\n    <p><a href="#ref-ftn2">^</a></p>\n    <div>\n      <p>This is another footnote</p>\n    </div>\n  </li>\n</ul>',
  );
});

test('omit the blank line before the first paragraph in each table cell', () => {
  expect(
    cleanHtml(
      '<table><tr><td><p>Support equitable recruitment and promotion of Indigenous employees at SSC.</p><p><strong>Program:</strong> Internal Services</p></td></tr></table>',
    ),
  ).toBe(
    '<table class="table table-condensed table-bordered">\n  <tbody>\n    <tr>\n      <td>\n        <p>Support equitable recruitment and promotion of Indigenous employees at SSC.</p>\n\n        <p><strong>Program:</strong> Internal Services</p>\n      </td>\n    </tr>\n  </tbody>\n</table>',
  );
});
