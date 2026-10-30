import { JSDOM } from 'jsdom';
import { moveBoundarySpacesOutside } from '../utils/dom.ts';

export type EmphasisAction = 'i' | 'cite' | 'strong' | 'unwrap';

export type EmphasisOccurrence = {
  start: number;
  end: number;
  text: string;
};

export function getEmphasisOccurrences(html: string): EmphasisOccurrence[] {
  const { document } = new JSDOM(html).window;
  const elements = Array.from(document.querySelectorAll('em'));
  const ranges = getEmphasisSourceRanges(html);

  return ranges.map(({ start, end }, index) => ({
    start,
    end,
    text: elements[index]?.textContent?.trim().replaceAll(/\s+/g, ' ') ?? '',
  }));
}

function getEmphasisSourceRanges(html: string): Array<Pick<EmphasisOccurrence, 'start' | 'end'>> {
  const ranges: Array<Pick<EmphasisOccurrence, 'start' | 'end'>> = [];
  const openEmphasis: Array<{ start: number }> = [];
  let cursor = 0;

  while (cursor < html.length) {
    const tagStart = html.indexOf('<', cursor);

    if (tagStart === -1) {
      break;
    }

    if (html.startsWith('<!--', tagStart)) {
      const commentEnd = html.indexOf('-->', tagStart + 4);
      cursor = commentEnd === -1 ? html.length : commentEnd + 3;
      continue;
    }

    const tagEnd = findTagEnd(html, tagStart);

    if (tagEnd === -1) {
      break;
    }

    const tag = html.slice(tagStart, tagEnd);
    const match = tag.match(/^<\s*(\/?)\s*([a-z][\w:-]*)\b/i);
    cursor = tagEnd;

    if (!match) {
      continue;
    }

    const [, closing, rawName] = match;
    const name = rawName.toLowerCase();

    if (name === 'script' || name === 'style') {
      if (!closing) {
        const closingTag = new RegExp(`<\\/\\s*${name}\\s*>`, 'ig');
        closingTag.lastIndex = cursor;
        const closingMatch = closingTag.exec(html);
        cursor = closingMatch ? closingTag.lastIndex : html.length;
      }

      continue;
    }

    if (name !== 'em') {
      continue;
    }

    if (closing) {
      const opening = openEmphasis.pop();

      if (opening) {
        ranges.push({ start: opening.start, end: tagEnd });
      }
    } else if (!/\/\s*>$/.test(tag)) {
      openEmphasis.push({ start: tagStart });
    }
  }

  openEmphasis.forEach(({ start }) => {
    ranges.push({ start, end: html.length });
  });

  return ranges.sort((a, b) => a.start - b.start);
}

function findTagEnd(html: string, start: number): number {
  let quote = '';

  for (let index = start + 1; index < html.length; index++) {
    const character = html[index];

    if (quote) {
      if (character === quote) {
        quote = '';
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index + 1;
    }
  }

  return -1;
}

export function applyEmphasisActions(document: Document, actions: EmphasisAction[]): void {
  document.querySelectorAll('em').forEach((emphasis, index) => {
    const action = actions[index];

    if (!action) {
      return;
    }

    if (action === 'unwrap') {
      while (emphasis.firstChild) {
        emphasis.parentNode?.insertBefore(emphasis.firstChild, emphasis);
      }

      emphasis.remove();
      return;
    }

    const replacement = document.createElement(action);

    Array.from(emphasis.attributes).forEach((attribute) => {
      replacement.setAttribute(attribute.name, attribute.value);
    });

    while (emphasis.firstChild) {
      replacement.appendChild(emphasis.firstChild);
    }

    emphasis.replaceWith(replacement);
    moveBoundarySpacesOutside(document, replacement);
  });
}
