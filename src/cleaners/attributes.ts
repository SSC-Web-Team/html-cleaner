import { removeAttribute } from '../utils/dom.ts';

// WET footnote classes must survive cleaning
const classesToKeep = new Set(['wb-fnote', 'fn-lnk', 'fn-rtn', 'wb-inv']);
const attributesToRemove = [
  'border',
  'cellpadding',
  'cellspacing',
  'lang',
  'name',
  'style',
  'target',
  'width',
];

export function cleanAttributes(document: Document): void {
  attributesToRemove.forEach((attr) => {
    removeAttribute(document, attr);
  });

  document.querySelectorAll('[class]').forEach((el) => {
    const kept = Array.from(el.classList).filter((name) => classesToKeep.has(name));

    if (kept.length > 0) {
      el.className = kept.join(' ');
    } else {
      el.removeAttribute('class');
    }
  });

  document.querySelectorAll('li[type]').forEach((li) => {
    li.removeAttribute('type');
  });
}
