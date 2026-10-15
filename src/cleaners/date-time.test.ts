import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { addDateTimeTags } from './date-time.ts';

function run(html: string) {
  const { document } = new JSDOM(html).window;

  addDateTimeTags(document);

  return document.body.innerHTML;
}

test('wrap English date', () => {
  expect(run('<p>Due September 30, 2026.</p>')).toBe(
    '<p>Due <time class="nowrap" datetime="2026-09-30">September&nbsp;30, 2026</time>.</p>',
  );
});

test('wrap French date', () => {
  expect(run('<p>Le 30 septembre 2026</p>')).toBe(
    '<p>Le <time class="nowrap" datetime="2026-09-30">30&nbsp;septembre 2026</time></p>',
  );
});

test('wrap French date with 1er and unaccented month', () => {
  expect(run('<p>1er fevrier 2026</p>')).toBe(
    '<p><time class="nowrap" datetime="2026-02-01">1er&nbsp;fevrier 2026</time></p>',
  );
});

test('wrap French date with accented month', () => {
  expect(run('<p>15 août 2026</p>')).toBe(
    '<p><time class="nowrap" datetime="2026-08-15">15&nbsp;août 2026</time></p>',
  );
});

test('do not wrap a date already in a time tag', () => {
  const html = '<p><time datetime="2026-09-30">September 30, 2026</time></p>';

  expect(run(html)).toBe(html);
});

test('format French time', () => {
  expect(run('<p>15h30</p>')).toBe(
    '<p><time class="nowrap" datetime="15:30">15&nbsp;h&nbsp;30</time></p>',
  );
});

test('wrap English time with periods', () => {
  expect(run('<p>3:30 p.m.</p>')).toBe(
    '<p><time class="nowrap" datetime="15:30">3:30 p.m.</time></p>',
  );
});

test('wrap English time with periods and uppercase', () => {
  expect(run('<p>3:30 P.M.</p>')).toBe(
    '<p><time class="nowrap" datetime="15:30">3:30 P.M.</time></p>',
  );
});

test('wrap English time without periods and uppercase', () => {
  expect(run('<p>3:30 PM</p>')).toBe(
    '<p><time class="nowrap" datetime="15:30">3:30 PM</time></p>',
  );
});

test('wrap English time lowercase', () => {
  expect(run('<p>3:30 pm</p>')).toBe(
    '<p><time class="nowrap" datetime="15:30">3:30 pm</time></p>',
  );
});

test('wrap English time uppercase', () => {
  expect(run('<p>3:30 PM</p>')).toBe(
    '<p><time class="nowrap" datetime="15:30">3:30 PM</time></p>',
  );
});

test('wrap English date and time', () => {
  expect(run('<p>October 26 from 1 to 2 pm (ET)</p>')).toBe(
    '<p><time class="nowrap" datetime="10-26">October&nbsp;26</time> from <time class="nowrap" datetime="13:00">1 pm</time> to <time class="nowrap" datetime="14:00">2 pm</time> (ET)</p>',
  );
});