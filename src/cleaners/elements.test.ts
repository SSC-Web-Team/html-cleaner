import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';
import { cleanElements } from './elements.ts';

test('remove del tag', () => {
  const initialHtml = '<div>This is a <del>deleted</del> test</div>';
  const finalHtml = '<div>This is a test</div>';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('unwrap span tag', () => {
  const initialHtml = '<div>This is a <span>special</span> test</div><p></p><em>&nbsp;</em><h1> &nbsp;</h1>';
  const finalHtml = '<div>This is a special test</div>';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('unwrap ins tag', () => {
  const initialHtml = '<div>This is a <ins>special</ins> test</div>';
  const finalHtml = '<div>This is a special test</div>';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('unwrap u tag inside a link', () => {
  const initialHtml = '<div><a href="https://example.com"><u>link</u></a></div>';
  const finalHtml = '<div><a href="https://example.com">link</a></div>';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('unwrap u tag wrapping a link', () => {
  const initialHtml = '<div><u><a href="https://example.com">link</a></u></div>';
  const finalHtml = '<div><a href="https://example.com">link</a></div>';
  const dom = new JSDOM(initialHtml);
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(finalHtml);
});

test('unwrap a single paragraph from list items and table cells', () => {
  const dom = new JSDOM(
    '<ul><li><p>List item</p></li></ul><table><tbody><tr><td><p>Cell</p></td><th><p>Header</p></th></tr></tbody></table>',
  );
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(
    '<ul><li>List item</li></ul><table><tbody><tr><td>Cell</td><th>Header</th></tr></tbody></table>',
  );
});

test('keep paragraphs when a list item or table cell contains more than one', () => {
  const dom = new JSDOM(
    '<ul><li><p>First</p><p>Second</p></li></ul><table><tbody><tr><td><p>First</p><p>Second</p></td><th><p>Only paragraph</p></th></tr></tbody></table>',
  );
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(
    '<ul><li><p>First</p><p>Second</p></li></ul><table><tbody><tr><td><p>First</p><p>Second</p></td><th>Only paragraph</th></tr></tbody></table>',
  );
});

test('unwrap strong tags from table headers and heading elements', () => {
  const dom = new JSDOM(
    '<table><thead><tr><th><strong>Column</strong></th><th><b>Column 2</b></th></tr></thead></table><h1><strong>Title</strong></h1><h2>Sub <strong>heading</strong></h2><h3><strong>Third</strong></h3><h4><strong>Fourth</strong></h4><h5><strong>Fifth</strong></h5><h6><strong>Sixth</strong></h6><h2>Sub <b>heading</b></h2>',
  );
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(
    '<table><thead><tr><th>Column</th><th>Column 2</th></tr></thead></table><h1>Title</h1><h2>Sub heading</h2><h3>Third</h3><h4>Fourth</h4><h5>Fifth</h5><h6>Sixth</h6><h2>Sub heading</h2>',
  );
});

test('unwrap nested duplicate strong tags', () => {
  const dom = new JSDOM('<p><strong><strong>test</strong></strong></p>');
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe('<p><strong>test</strong></p>');
});

test.each(['strong', 'b', 'i', 'em'])('merge adjacent <%s> tags', (tag) => {
  const dom = new JSDOM(`<p><${tag}>this is </${tag}><${tag}>bold</${tag}></p>`);
  const { document } = dom.window;

  cleanElements(document);

  expect(document.body.innerHTML).toBe(`<p><${tag}>this is bold</${tag}></p>`);
});
