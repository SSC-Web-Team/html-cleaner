import { expect, test } from 'vitest';
import { clipboardHtmlFragment } from './paste-html.ts';

test('extracts the selected fragment rather than the surrounding Word document', () => {
  const html =
    'Version:1.0\r\n<html><head><style>.MsoNormal { color: red }</style></head><body>' +
    '<p>Not selected</p><!--StartFragment--><p class="MsoNormal">Hello <b>Word</b></p>' +
    '<!--EndFragment--><p>Not selected</p></body></html>';

  expect(clipboardHtmlFragment(html)).toBe('<p class="MsoNormal">Hello <b>Word</b></p>');
});

test('extracts the body from a complete HTML document without fragment markers', () => {
  expect(
    clipboardHtmlFragment('<html><head><title>Title</title></head><body><p>Text</p></body></html>'),
  ).toBe('<p>Text</p>');
});

test('preserves an HTML fragment and its inline formatting', () => {
  const html =
    '<p style="color: red">Hello <strong>there</strong> <a href="https://example.com">link</a></p>';
  expect(clipboardHtmlFragment(html)).toBe(html);
});

test.each([
  '<!--StartFragment--><p>Text</p>',
  '<p>Text</p><!--EndFragment-->',
  '<!--EndFragment--><p>Text</p><!--StartFragment-->',
])('rejects malformed fragment markers: %s', (html) => {
  expect(() => clipboardHtmlFragment(html)).toThrow('invalid fragment markers');
});
