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
  const textNodes: Text[] = [];
  const textWalker = document.createTreeWalker(document, SHOW_TEXT);
  let node: Node | null;

  while ((node = textWalker.nextNode())) {
    textNodes.push(node as Text);
  }

  textNodes.forEach((textNode) => {
    textNode.textContent =
      textNode.textContent
        ?.replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() ?? '';
  });
}
