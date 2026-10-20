import beautify from 'js-beautify';
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

  const formatted = beautify.html(result, {
    indent_size: 2,
    max_preserve_newlines: 1,
    preserve_newlines: true,
    wrap_line_length: 0,
  });

  return addBlockSpacing(formatted);
}

const tagsWithSpacing = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'div',
  'table',
]);
const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function addBlockSpacing(html: string): string {
  const openTags: { name: string; hasParagraph: boolean }[] = [];
  const lines = html.split('\n');
  const formattedLines: string[] = [];

  lines.forEach((line) => {
    const firstTag = line.match(/^\s*<([a-z][\w:-]*)\b[^>]*>/i);
    const firstTagName = firstTag?.[1].toLowerCase();
    let cell: (typeof openTags)[number] | undefined;

    for (let index = openTags.length - 1; index >= 0; index--) {
      if (openTags[index].name === 'td') {
        cell = openTags[index];
        break;
      }
    }

    const isFirstParagraphInCell =
      firstTagName === 'p' && cell !== undefined && !cell.hasParagraph;

    if (
      isFirstParagraphInCell ||
      (firstTagName && tagsWithSpacing.has(firstTagName) && !openTags.some((tag) => tag.name === 'ul'))
    ) {
      if (isFirstParagraphInCell && cell) {
        cell.hasParagraph = true;
      } else if (
        formattedLines.length > 0 &&
        formattedLines[formattedLines.length - 1] !== ''
      ) {
        formattedLines.push('');
      }
    }

    for (const [, closing, tagName] of line.matchAll(/<(\/)?([a-z][\w:-]*)\b[^>]*>/gi)) {
      const name = tagName.toLowerCase();

      if (closing) {
        let index = -1;

        for (let currentIndex = openTags.length - 1; currentIndex >= 0; currentIndex--) {
          if (openTags[currentIndex].name === name) {
            index = currentIndex;
            break;
          }
        }

        if (index !== -1) {
          openTags.length = index;
        }
      } else if (!voidTags.has(name)) {
        openTags.push({ name, hasParagraph: false });
      }
    }

    formattedLines.push(line);
  });

  return formattedLines.join('\n');
}
