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

test('collapse whitespace inside inline tags without trimming their boundaries', () => {
  const initialHtml = 'Hello world <span>  from  </span> HTML Cleaner';
  const finalHtml = 'Hello world <span> from </span> HTML Cleaner';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  normalizeText(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('trim block and heading boundaries', () => {
  const initialHtml =
    '<p>  Paragraph  </p><ul><li> Item </li></ul><table><tbody><tr><td> Cell </td><th> Heading cell </th></tr></tbody></table><h2> Heading </h2>';
  const finalHtml =
    '<p>Paragraph</p><ul><li>Item</li></ul><table><tbody><tr><td>Cell</td><th>Heading cell</th></tr></tbody></table><h2>Heading</h2>';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  normalizeText(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('move whitespace at both link boundaries outside the link', () => {
  const dom = new JSDOM('this is a<a href=""> link </a>about stuff');
  const { document } = dom.window;

  normalizeText(document);

  expect(document.body.innerHTML).toBe('this is a <a href="">link</a> about stuff');
});

test('normalize duplicate and nonbreaking spaces around links', () => {
  const dom = new JSDOM('<p>  This&nbsp;&nbsp; is  a&nbsp;<a href=""> link&nbsp;</a>&nbsp;about  stuff .  </p>');
  const { document } = dom.window;

  normalizeText(document);

  expect(document.body.innerHTML).toBe('<p>This is a <a href="">link</a> about stuff.</p>');
});

test('normalize nonbreaking spaces and spacing around breaks', () => {
  const dom = new JSDOM('<p>Text&nbsp;&nbsp;.&nbsp;<br />&nbsp;Next</p>');
  const { document } = dom.window;

  normalizeText(document);

  expect(document.body.innerHTML).toBe('<p>Text.<br>Next</p>');
});
