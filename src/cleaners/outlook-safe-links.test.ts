import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import { unwrapOutlookSafeLinks } from './outlook-safe-links.ts';
import { cleanHtml } from '../index.ts';

function run(html: string): string {
  const { document } = new JSDOM(html).window;

  unwrapOutlookSafeLinks(document);

  return document.body.innerHTML;
}

test('unwrap Outlook Safe Links to their destination URL', () => {
  expect(
    run(
      '<a href="https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.canada.ca%2Fen%2Fshared-services%2Fcorporate%2Fstay-connected%2Frss-feeds.html&amp;data=tracking">RSS feeds</a>',
    ),
  ).toBe(
    '<a href="https://www.canada.ca/en/shared-services/corporate/stay-connected/rss-feeds.html">RSS feeds</a>',
  );
});

test('leave unrelated and unsupported links unchanged', () => {
  const html =
    '<a href="https://example.com/?url=https%3A%2F%2Fwww.canada.ca">Example</a><a href="https://can01.safelinks.protection.outlook.com/?url=javascript%3Aalert(1)">Unsafe</a>';

  expect(run(html)).toBe(html);
});

test('unwrap Outlook Safe Links through the HTML cleaner', () => {
  expect(
    cleanHtml(
      '<a href="https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.canada.ca%2Fen%2Fshared-services%2Fcorporate%2Fstay-connected%2Frss-feeds.html&amp;data=tracking">RSS feeds</a>',
    ),
  ).toBe(
    '<a href="https://www.canada.ca/en/shared-services/corporate/stay-connected/rss-feeds.html">RSS feeds</a>',
  );
});
