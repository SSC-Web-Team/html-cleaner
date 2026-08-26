import { removeAttribute } from '../utils/dom.ts';

const attributesToRemove = [
  'border',
  'class',
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
}
