import { JSDOM } from "jsdom";

import { cleanElements } from "./cleaners/elements.ts";
import { cleanAttributes } from "./cleaners/attributes.ts";
import { cleanFormatting } from "./cleaners/formatting.ts";

export function cleanHtml(html: string): string {
  // Simple text-based cleanup
  html = html.trim();

  // Parse HTML
  const dom = new JSDOM(html);
  const { document } = dom.window;

  // Run cleanup modules
  cleanElements(document);
  cleanAttributes(document);
  cleanFormatting(document);

  const result = document.body?.innerHTML ?? '';

  return result;
}
