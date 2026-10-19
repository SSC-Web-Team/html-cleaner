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
  const initialHtml = '<div>This is a <span>special</span> test</div>';
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
