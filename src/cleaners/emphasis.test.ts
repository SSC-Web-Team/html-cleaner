import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { applyEmphasisActions, getEmphasisOccurrences } from './emphasis.ts';
import { cleanHtml } from '../index.ts';

test('get source ranges and text previews for emphasis tags in document order', () => {
  const html = '<p><em> First   phrase </em> <em>Second</em></p>';

  expect(getEmphasisOccurrences(html)).toEqual([
    { start: 3, end: 28, text: 'First phrase' },
    { start: 29, end: 44, text: 'Second' },
  ]);
});

test('ignore em-like text in comments, attributes, and script content', () => {
  const html =
    '<!-- <em>comment</em> --><p title="<em>attribute</em>"><em>Text</em></p><script>"<em>script</em>"</script>';

  expect(getEmphasisOccurrences(html)).toEqual([
    { start: 55, end: 68, text: 'Text' },
  ]);
});

test.each(['i', 'cite', 'strong'] as const)('change em to <%s>', (tag) => {
  const { document } = new JSDOM('<p><em class="source">Text</em></p>').window;

  applyEmphasisActions(document, [tag]);

  expect(document.body.innerHTML).toBe(`<p><${tag} class="source">Text</${tag}></p>`);
});

test('unwrap em while preserving its contents', () => {
  const { document } = new JSDOM('<p>Some <em><a href="/">text</a></em></p>').window;

  applyEmphasisActions(document, ['unwrap']);

  expect(document.body.innerHTML).toBe('<p>Some <a href="/">text</a></p>');
});

test('apply per-element emphasis actions through the HTML cleaner', () => {
  expect(
    cleanHtml('<p><em>Italic</em>, <em>Citation</em>, <em>Important</em>, <em>Plain</em></p>', 'en', 'myssc', [
      'i',
      'cite',
      'strong',
      'unwrap',
    ]),
  ).toBe('<p><i>Italic</i>, <cite>Citation</cite>, <strong>Important</strong>, Plain</p>');
});

test('apply emphasis choices after other cleanup transformations', () => {
  expect(
    cleanHtml('<p><em>Keep <del>removed</del> text</em></p>', 'en', 'myssc', ['cite']),
  ).toBe('<p><cite>Keep text</cite></p>');
});

test('move trailing space outside a newly selected cite tag', () => {
  expect(
    cleanHtml('<p>metus. <em>Aliquam </em>augue</p>', 'en', 'myssc', ['cite']),
  ).toBe('<p>metus. <cite>Aliquam</cite> augue</p>');
});
