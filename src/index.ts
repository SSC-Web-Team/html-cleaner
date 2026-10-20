import { JSDOM } from 'jsdom';

import { cleanAttributes } from './cleaners/attributes.ts';
import { cleanElements } from './cleaners/elements.ts';
import { cleanFormatting } from './cleaners/formatting.ts';
import { addDateTimeTags } from './cleaners/date-time.ts';
import { unwrapOutlookSafeLinks } from './cleaners/outlook-safe-links.ts';
import { cleanFrenchTypography } from './cleaners/french-typography.ts';

export type ContentLanguage = 'en' | 'fr';

export function cleanHtml(html: string, language: ContentLanguage = 'en'): string {
  // Simple text-based cleanup
  html = html.trim();

  // Parse HTML
  const dom = new JSDOM(html);
  const { document } = dom.window;

  // Run cleanup modules
  unwrapOutlookSafeLinks(document);
  cleanAttributes(document);
  cleanElements(document);
  cleanFormatting(document);
  addDateTimeTags(document);

  if (language === 'fr') {
    cleanFrenchTypography(document);
  }

  const result = document.body?.innerHTML ?? '';

  return result;
}
