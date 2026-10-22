import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { addTableOfContents } from './toc.ts';
import { generateToc } from '../index.ts';

const source = '<h2>Intro</h2><h3>Sub A</h3><h3>Sub B</h3><h2>Next</h2><h4>Ignored</h4>';

function run(
  html: string,
  language: 'en' | 'fr' = 'en',
  platform: 'myssc' | 'canada' = 'myssc',
): Document {
  const { document } = new JSDOM(html).window;

  addTableOfContents(document, language, platform);

  return document;
}

test('generates nested TOC with heading IDs and anchors', () => {
  const document = run(source);
  const links = Array.from(document.querySelectorAll('#toc-nav a')).map((a) => [
    a.getAttribute('href'),
    a.textContent,
  ]);

  expect(links).toEqual([
    ['#toc1', 'Intro'],
    ['#toc1-1', 'Sub A'],
    ['#toc1-2', 'Sub B'],
    ['#toc2', 'Next'],
  ]);
  expect(document.querySelector('h3')?.id).toBe('toc1-1');
  expect(document.querySelector('h4')?.id).toBe('');
});

test('uses the language for the title', () => {
  expect(run(source, 'en').querySelector('#toc')?.textContent).toBe('On this page');
  expect(run(source, 'fr').querySelector('#toc')?.textContent).toBe('Sur cette page');
});

test('is unchanged and inserted at the top', () => {
  const output = generateToc(generateToc(source, 'fr'), 'fr');

  expect(output.trimStart().startsWith('<section id="toc-nav">')).toBe(true);
  expect(output.match(/id="toc-nav"/g)).toHaveLength(1);
});

test('uses the Canada.ca template with GC Design System components', () => {
  const document = run(source, 'en', 'canada');

  expect(document.querySelector('#toc-nav > nav > gcds-heading')?.getAttribute('tag')).toBe('h2');
  expect(document.querySelector('gcds-heading')?.textContent).toBe('On this page');
  expect(document.querySelector('#toc-nav > nav > ul')?.className).toBe('list-disc mb-300');
  expect(document.querySelectorAll('#toc-nav a')).toHaveLength(0);
  expect(document.querySelector('gcds-link')?.getAttribute('href')).toBe('#toc1');
  expect(document.querySelectorAll('#toc-nav gcds-link')).toHaveLength(4);
});

test('is unchanged on Canada.ca', () => {
  const output = generateToc(generateToc(source, 'fr', 'canada'), 'fr', 'canada');

  expect(output.match(/id="toc-nav"/g)).toHaveLength(1);
  expect(output).toContain('Sur cette page');
});

test('wraps the TOC in a labelled nav', () => {
  expect(run(source, 'en').querySelector('#toc-nav > nav')?.getAttribute('aria-label')).toBe(
    'On this page',
  );
  expect(run(source, 'fr', 'canada').querySelector('#toc-nav > nav')?.getAttribute('aria-label')).toBe(
    'Sur cette page',
  );
});

test('places the TOC before the first h2 when an h1 is present', () => {
  const document = run('<p>Intro</p><h1>Title</h1><p>Text</p><h2>A</h2>');

  expect(document.querySelector('#toc1')?.previousElementSibling?.id).toBe('toc-nav');
  expect(document.querySelector('h1')?.nextElementSibling?.tagName).toBe('P');
});

test('places the TOC after the h1 when there is no h2', () => {
  const document = run('<h1>Title</h1><p>Text</p><h3>A</h3>');

  expect(document.querySelector('h1')?.nextElementSibling?.id).toBe('toc-nav');
});
