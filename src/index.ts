import { JSDOM } from 'jsdom';

import { cleanAttributes } from './cleaners/attributes.ts';
import { cleanElements } from './cleaners/elements.ts';
import { cleanFormatting } from './cleaners/formatting.ts';

export function cleanHtml(html: string): string {
  // Simple text-based cleanup
  html = html.trim();

  // Parse HTML
  const dom = new JSDOM(html);
  const { document } = dom.window;

  // Run cleanup modules
  cleanAttributes(document);
  cleanElements(document);
  cleanFormatting(document);

  const result = document.body?.innerHTML ?? '';

  return result;
}
