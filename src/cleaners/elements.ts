import {
  normalizeText,
  removeBySelector,
  removeEmptyBySelector,
  removeComments,
  unwrapBySelector,
} from '../utils/dom.ts';

const elementsToRemove = ['del', 'script', 'style', 'o\\:p', 'v\\:shape', 'w\\:sdt'];
const elementsToRemoveIfEmpty = [
  'a',
  'b',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'img',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];
const elementsToUnwrap = ['font', 'span'];

export function cleanElements(document: Document): void {
  // Remove all specified tags and their contents
  elementsToRemove.forEach((selector) => {
    removeBySelector(document, selector);
  });

  // Remove specified empty tags and their contents
  elementsToRemoveIfEmpty.forEach((selector) => {
    removeEmptyBySelector(document, selector);
  });

  // Unwrap specified tags
  elementsToUnwrap.forEach((selector) => {
    unwrapBySelector(document, selector);
  });

  unwrapSingleParagraphsInContainers(document);

  // Remove underline tags that redundantly wrap links or their contents
  unwrapBySelector(document, 'a u, u:has(a)');

  // Remove Word TOC bookmarks
  document.querySelectorAll('a[name]').forEach((a) => {
    const name = a.getAttribute('name');

    if (name && name.startsWith('_Toc')) {
      a.remove();
    }
  });

  // Remove comments
  removeComments(document);

  // Normalize text
  normalizeText(document);

  // Merge adjacent text nodes
  document.normalize();
}

function unwrapSingleParagraphsInContainers(document: Document): void {
  document.querySelectorAll('li, td, th').forEach((container) => {
    const paragraphs = container.querySelectorAll('p');

    if (paragraphs.length !== 1) {
      return;
    }

    const paragraph = paragraphs[0];

    while (paragraph.firstChild) {
      paragraph.parentNode?.insertBefore(paragraph.firstChild, paragraph);
    }

    paragraph.remove();
  });
}
