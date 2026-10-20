import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { removeHomepageUtmCodes } from './utm-codes.ts';
import { cleanHtml } from '../index.ts';

function run(href: string): string {
  const { document } = new JSDOM(`<a href="${href}">Link</a>`).window;

  removeHomepageUtmCodes(document);

  return document.querySelector('a')?.getAttribute('href') ?? '';
}

test.each(['promo_block', 'upcoming_events', 'latest_news', 'get_help'])(
  'remove MySSC homepage UTM codes for %s',
  (campaign) => {
    expect(
      run(
        `https://plus.ssc-spc.gc.ca/en/topic/internal-disclosure-wrongdoing?utm_source=myssc&utm_medium=homepage&utm_campaign=${campaign}`,
      ),
    ).toBe('https://plus.ssc-spc.gc.ca/en/topic/internal-disclosure-wrongdoing');
  },
);

test.each([
  ['myssc', 'most_requested'],
  ['servinggov', 'most_requested'],
  ['servinggov', 'digital_together'],
])('remove %s homepage UTM codes for %s', (source, campaign) => {
  expect(
    run(
      `https://www.canada.ca/page?utm_source=${source}&utm_medium=homepage&utm_campaign=${campaign}`,
    ),
  ).toBe('https://www.canada.ca/page');
});

test('preserve other query parameters when removing matching UTM codes', () => {
  expect(
    run(
      'https://plus.ssc-spc.gc.ca/en/topic/internal-disclosure-wrongdoing?lang=en&utm_source=myssc&utm_medium=homepage&utm_campaign=latest_news&ref=email#section',
    ),
  ).toBe('https://plus.ssc-spc.gc.ca/en/topic/internal-disclosure-wrongdoing?lang=en&ref=email#section');
});

test('preserve unrelated UTM combinations', () => {
  const href =
    'https://plus.ssc-spc.gc.ca/en/topic/internal-disclosure-wrongdoing?utm_source=other&utm_medium=homepage&utm_campaign=latest_news';

  expect(run(href)).toBe(href);
});

test('remove matching UTM codes through the HTML cleaner', () => {
  expect(
    cleanHtml(
      '<a href="https://plus.ssc-spc.gc.ca/en/topic/internal-disclosure-wrongdoing?utm_source=myssc&amp;utm_medium=homepage&amp;utm_campaign=get_help">Help</a>',
    ),
  ).toBe('<a href="https://plus.ssc-spc.gc.ca/en/topic/internal-disclosure-wrongdoing">Help</a>');
});
