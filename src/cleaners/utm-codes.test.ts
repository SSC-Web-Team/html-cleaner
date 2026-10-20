import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { removeMySscUtmCodes } from './utm-codes.ts';
import { cleanHtml } from '../index.ts';

function run(href: string): string {
  const { document } = new JSDOM(`<a href="${href}">Link</a>`).window;

  removeMySscUtmCodes(document);

  return document.querySelector('a')?.getAttribute('href') ?? '';
}

test.each(['promo_block', 'upcoming_events', 'latest_news', 'get_help'])(
  'remove MySSC homepage UTM codes for %s',
  (campaign) => {
    expect(
      run(
        `https://www.canada.ca/page?utm_source=myssc&utm_medium=homepage&utm_campaign=${campaign}`,
      ),
    ).toBe('https://www.canada.ca/page');
  },
);

test('preserve other query parameters when removing matching UTM codes', () => {
  expect(
    run(
      'https://www.canada.ca/page?lang=en&utm_source=myssc&utm_medium=homepage&utm_campaign=latest_news&ref=email#section',
    ),
  ).toBe('https://www.canada.ca/page?lang=en&ref=email#section');
});

test('preserve unrelated UTM combinations', () => {
  const href =
    'https://www.canada.ca/page?utm_source=other&utm_medium=homepage&utm_campaign=latest_news';

  expect(run(href)).toBe(href);
});

test('remove matching UTM codes through the HTML cleaner', () => {
  expect(
    cleanHtml(
      '<a href="https://www.canada.ca/page?utm_source=myssc&amp;utm_medium=homepage&amp;utm_campaign=get_help">Help</a>',
    ),
  ).toBe('<a href="https://www.canada.ca/page">Help</a>');
});
