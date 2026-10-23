import { SHOW_COMMENT, SHOW_TEXT } from './constants.ts';

export function removeBySelector(document: Document, selector: string) {
  document.querySelectorAll(selector).forEach((el) => {
    el.remove();
  });
}

export function removeEmptyBySelector(document: Document, selector: string) {
  document.querySelectorAll(selector).forEach((el) => {
    if (!el.textContent?.trim() && el.children.length === 0) {
      el.remove();
    }
  });
}

export function removeAttribute(document: Document, attr: string) {
  document.querySelectorAll(`[${attr}]`).forEach((el) => {
    el.removeAttribute(attr);
  });
}

export function unwrapBySelector(document: Document, selector: string) {
  document.querySelectorAll(selector).forEach((el) => {
    while (el.firstChild) {
      el.parentNode?.insertBefore(el.firstChild, el);
    }

    el.remove();
  });
}

export function addClassBySelector(document: Document, selector: string, className: string) {
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.add(className);
  });
}

export function removeComments(document: Document) {
  const comments: Comment[] = [];
  const commentWalker = document.createTreeWalker(document, SHOW_COMMENT);
  let node: Node | null;

  while ((node = commentWalker.nextNode())) {
    comments.push(node as Comment);
  }

  comments.forEach((comment) => comment.remove());
}

export function normalizeText(document: Document) {
  document.body.normalize();

  const textNodes = getTextNodes(document.body);

  textNodes.forEach((textNode) => {
    textNode.data = textNode.data
      .replaceAll(/[\s\u00a0]+/g, ' ')
      .replaceAll(/ +([.;!,)\]}])/g, '$1')
      .replaceAll(/([([{]) +/g, '$1');
  });

  document.querySelectorAll('a, cite').forEach((element) => {
    moveBoundarySpacesOutside(document, element);
  });

  document.querySelectorAll('br').forEach((lineBreak) => {
    trimBoundaryText(lineBreak.previousSibling, false);
    trimBoundaryText(lineBreak.nextSibling, true);
  });

  document
    .querySelectorAll('p, li, td, th, h1, h2, h3, h4, h5, h6')
    .forEach((element) => {
      trimElementBoundarySpaces(element);
    });

  trimElementBoundarySpaces(document.body);
}

function getTextNodes(element: Element): Text[] {
  const textNodes: Text[] = [];
  const walker = element.ownerDocument.createTreeWalker(element, SHOW_TEXT);
  let node: Node | null;

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  return textNodes;
}

function trimElementBoundarySpaces(element: Element): void {
  const textNodes = getTextNodes(element);

  if (textNodes.length === 0) {
    return;
  }

  textNodes[0].data = textNodes[0].data.replace(/^ +/, '');
  textNodes[textNodes.length - 1].data = textNodes[textNodes.length - 1].data.replace(/ +$/, '');
}

export function moveBoundarySpacesOutside(document: Document, element: Element): void {
  const textNodes = getTextNodes(element);
  const firstText = textNodes[0];
  const lastText = textNodes[textNodes.length - 1];

  if (firstText?.data.startsWith(' ')) {
    firstText.data = firstText.data.replace(/^ +/, '');
    ensureBoundarySpace(document, element, true);
  }

  if (lastText?.data.endsWith(' ')) {
    lastText.data = lastText.data.replace(/ +$/, '');
    ensureBoundarySpace(document, element, false);
  }
}

function ensureBoundarySpace(document: Document, element: Element, before: boolean): void {
  const neighbor = before ? element.previousSibling : element.nextSibling;

  if (!neighbor || neighbor.nodeName === 'BR' || hasBoundarySpace(neighbor, before)) {
    return;
  }

  const space = document.createTextNode(' ');

  if (before) {
    element.parentNode?.insertBefore(space, element);
  } else {
    element.parentNode?.insertBefore(space, element.nextSibling);
  }
}

function hasBoundarySpace(node: Node, before: boolean): boolean {
  if (node.nodeType === 3) {
    return before
      ? node.textContent?.endsWith(' ') ?? false
      : node.textContent?.startsWith(' ') ?? false;
  }

  if (node.nodeName === 'BR') {
    return true;
  }

  if (node.nodeType !== 1) {
    return false;
  }

  const textNodes = getTextNodes(node as Element);
  const textNode = before ? textNodes[textNodes.length - 1] : textNodes[0];

  return textNode
    ? before
      ? textNode.data.endsWith(' ')
      : textNode.data.startsWith(' ')
    : false;
}

function trimBoundaryText(node: Node | null, leading: boolean): void {
  if (!node) {
    return;
  }

  let textNode: Text | undefined;

  if (node.nodeType === 3) {
    textNode = node as Text;
  } else if (node.nodeType === 1) {
    const ownerDocument = node.ownerDocument;

    if (!ownerDocument) {
      return;
    }

    const walker = ownerDocument.createTreeWalker(node, SHOW_TEXT);
    const textNodes: Text[] = [];
    let child: Node | null;

    while ((child = walker.nextNode())) {
      textNodes.push(child as Text);
    }

    textNode = leading ? textNodes[0] : textNodes[textNodes.length - 1];
  }

  if (!textNode) {
    return;
  }

  textNode.data = leading ? textNode.data.replace(/^ +/, '') : textNode.data.replace(/ +$/, '');
}
