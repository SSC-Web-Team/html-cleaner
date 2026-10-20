import { SHOW_TEXT } from '../utils/constants.ts';

const NBSP = '\u00A0';

export function cleanFrenchTypography(document: Document): void {
  const walker = document.createTreeWalker(document.body, SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  textNodes.forEach((textNode) => {
    if (textNode.parentElement?.closest('script, style, code, pre')) {
      return;
    }

    textNode.data = textNode.data
      .replaceAll(/(?<!\d)(\d{1,3})[ \u00A0\u202F](?=\d{3}(?!\d))/g, `$1${NBSP}`)
      .replaceAll(/[ \u00A0]*:/g, `${NBSP}:`)
      .replaceAll(/(\d)[ \u00A0]*\$/g, `$1${NBSP}$`);
  });
}
