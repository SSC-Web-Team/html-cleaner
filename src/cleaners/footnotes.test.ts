import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { cleanHtml, generateFootnotes } from '../index.ts';

const word =
  '<p>First claim<a href="#_ftn1" name="_ftnref1"><sup><sup>[1]</sup></sup></a> and second <sup><a href="#_ftn2" name="_ftnref2">[2]</a></sup>.</p>' +
  '<div><hr><div id="ftn1"><p><a href="#_ftnref1" name="_ftn1">[1]</a> Note one &amp; more</p></div>' +
  '<div id="ftn2"><p><a href="#_ftnref2" name="_ftn2">[2]</a> Note two</p></div></div>';

function parse(html: string): Document {
  return new JSDOM(html).window.document;
}

test('converts Word footnotes to the WET structure (EN)', () => {
  const document = parse(generateFootnotes(word, 'en', 'canada')!);

  expect(document.querySelector('sup#fn1-rf > a.fn-lnk')?.getAttribute('href')).toBe('#fn1');
  expect(document.querySelector('sup#fn1-rf .wb-inv')?.textContent).toBe('Footnote ');
  expect(document.querySelector('sup#fn2-rf')?.textContent).toBe('Footnote 2');
  expect(document.querySelector('aside.wb-fnote[role="note"] > h2#fn')?.textContent).toBe(
    'Footnotes',
  );
  expect(document.querySelectorAll('aside dt')).toHaveLength(2);
  expect(document.querySelector('aside dt')?.textContent).toBe('Footnote 1');
  expect(document.querySelector('dd#fn1 p')?.innerHTML).toBe('Note one &amp; more');
  expect(document.querySelector('dd#fn1 p.fn-rtn a')?.getAttribute('href')).toBe('#fn1-rf');
  expect(document.querySelector('dd#fn1 p.fn-rtn')?.textContent).toBe(
    'Return to footnote 1 referrer',
  );
  expect(document.querySelector('hr')).toBeNull();
  expect(document.querySelector('#ftn1')).toBeNull();
  expect(document.querySelector('body > div')).toBeNull();
});

test('uses French labels', () => {
  const document = parse(generateFootnotes(word, 'fr', 'canada')!);

  expect(document.querySelector('aside h2')?.textContent).toBe('Notes de bas de page');
  expect(document.querySelector('aside dt')?.textContent).toBe('Note de bas de page 1');
  expect(document.querySelector('p.fn-rtn')?.textContent).toBe(
    'Retour à la référence de la note de bas de page 1',
  );
});

test('converts Word footnotes to MySSC+ footnotes without a footnotes section', () => {
  const output = generateFootnotes(word, 'en', 'myssc')!;
  const document = parse(output);
  const [first] = Array.from(document.querySelectorAll('footnotes'));

  expect(document.querySelectorAll('footnotes')).toHaveLength(2);
  expect(first.getAttribute('data-value')).toBe('');
  expect(first.getAttribute('data-text')).toBe('<p>Note one &amp; more</p>');
  expect(first.textContent).toBe('\u00a0');
  expect(output).toContain('data-text="&lt;p&gt;Note one &amp;amp; more&lt;/p&gt;"');
  expect(document.querySelector('aside')).toBeNull();
  expect(document.querySelector('hr')).toBeNull();
  expect(document.body.textContent).not.toContain('[1]');
});

test('converts WET footnotes (including symbols) to MySSC+', () => {
  const wet = generateFootnotes(
    '<p>Text<sup id="fn*-rf"><a class="fn-lnk" href="#fn*"><span class="wb-inv">Footnote </span>*</a></sup></p>' +
      '<aside class="wb-fnote" role="note"><h2 id="fn">Footnotes</h2><dl><dt>Footnote *</dt><dd id="fn*"><p>Symbol note</p><p class="fn-rtn"><a href="#fn*-rf">*</a></p></dd></dl></aside>',
    'en',
    'myssc',
  )!;
  const note = parse(wet).querySelector('footnotes');

  expect(note?.getAttribute('data-value')).toBe('*');
  expect(note?.getAttribute('data-text')).toBe('<p>Symbol note</p>');
  expect(parse(wet).querySelector('aside')).toBeNull();
});

test('handles footnotes referenced more than once', () => {
  const document = parse(
    generateFootnotes(
      '<p>A<a href="#_ftn1">[1]</a> B<a href="#_ftn1">[1]</a></p><p><a href="#_ftnref1">[1]</a> Shared</p>',
      'en',
      'canada',
    )!,
  );

  expect(document.querySelector('#fn1-1-rf')).not.toBeNull();
  expect(document.querySelector('#fn1-2-rf')).not.toBeNull();
  expect(document.querySelector('p.fn-rtn a')?.getAttribute('href')).toBe('#fn1-1-rf');
  expect(document.querySelector('p.fn-rtn')?.textContent).toBe(
    'Return to first footnote 1 referrer',
  );
});

test('returns null when there are no footnotes', () => {
  expect(generateFootnotes('<p>Nothing here</p>', 'en', 'canada')).toBeNull();
});

const list =
  '<h1>T</h1><p>Text<sup id="ref-ftn1"><a href="#ftn1">[1]</a></sup> more<a id="ref-ftn2" href="#ftn2">[2]</a>.</p>' +
  '<ul><li id="ftn1" data-list-item-id="x"><p><a href="#ref-ftn1">^</a></p><div><p>This is a footnote</p></div></li>' +
  '<li id="ftn2"><p><a href="#ref-ftn2">^</a></p><div><p>Another</p></div></li></ul>';

test('converts list-style footnotes (ftnN / ref-ftnN) to MySSC+', () => {
  const document = parse(generateFootnotes(list, 'en', 'myssc')!);

  expect(document.querySelectorAll('footnotes')).toHaveLength(2);
  expect(document.querySelector('footnotes')?.getAttribute('data-text')).toBe(
    '<p>This is a footnote</p>',
  );
  expect(document.querySelector('ul')).toBeNull();
  expect(document.querySelector('sup')).toBeNull();
});

test('converts list-style footnotes to WET', () => {
  const document = parse(generateFootnotes(list, 'fr', 'canada')!);

  expect(document.querySelector('sup#fn1-rf a')?.getAttribute('href')).toBe('#fn1');
  expect(document.querySelectorAll('aside dd')).toHaveLength(2);
  expect(document.querySelector('ul')).toBeNull();
});

test('ignores list footnotes that have no reference in the text', () => {
  expect(generateFootnotes(list.replace(/<sup.*?<\/sup>|<a id.*?<\/a>/g, ''), 'en', 'myssc')).toBeNull();
});

test('Clean HTML keeps the WET footnote classes and hidden spans', () => {
  const output = cleanHtml(generateFootnotes(list, 'en', 'canada')!, 'en', 'canada');

  expect(output).toContain(
    '<sup id="fn1-rf"><a class="fn-lnk" href="#fn1"><span class="wb-inv">Footnote </span>1</a></sup>',
  );
  expect(output).toContain('<aside class="wb-fnote" role="note">');
  expect(output).toContain(
    '<p class="fn-rtn"><a href="#fn1-rf"><span class="wb-inv">Return to footnote </span>1<span class="wb-inv"> referrer</span></a></p>',
  );
});

test('Clean HTML keeps the WET footnote classes and hidden spans in French', () => {
  const output = cleanHtml(generateFootnotes(list, 'fr', 'canada')!, 'fr', 'canada');

  expect(output).toContain(
    '<sup id="fn1-rf"><a class="fn-lnk" href="#fn1"><span class="wb-inv">Note de bas de page </span>1</a></sup>',
  );
  expect(output).toContain('<aside class="wb-fnote" role="note">');
  expect(output).toContain(
    '<p class="fn-rtn"><a href="#fn1-rf"><span class="wb-inv">Retour à la référence de la note de bas de page </span>1</a></p>',
  );
});
