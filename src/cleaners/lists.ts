export function cleanLists(document: Document): void {
  removeEmptyListItems(document);
  convertFakeBulletLists(document);
  convertFakeNumberedLists(document);
  mergeAdjacentLists(document);
}

/**
 * Remove empty <li> elements
 */
function removeEmptyListItems(document: Document): void {
  document.querySelectorAll("li").forEach((li) => {
    if (!li.textContent?.trim() && li.children.length === 0) {
      li.remove();
    }
  });
}

/**
 * Convert:
 *
 * <p>• Item 1</p>
 * <p>• Item 2</p>
 *
 * into:
 *
 * <ul>
 *   <li>Item 1</li>
 *   <li>Item 2</li>
 * </ul>
 */
function convertFakeBulletLists(document: Document): void {
  const paragraphs = Array.from(document.querySelectorAll("p")) as HTMLParagraphElement[];

  let currentList: HTMLUListElement | null = null;

  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() ?? "";

    const isBullet = /^(•|▪|◦|-|o)\s+/.test(text);

    if (!isBullet) {
      currentList = null;
      return;
    }

    if (!currentList) {
      currentList = document.createElement("ul");

      p.parentNode?.insertBefore(currentList, p);
    }

    const li = document.createElement("li");

    li.textContent = text.replace(/^(•|▪|◦|-|o)\s+/, "");

    currentList.appendChild(li);

    p.remove();
  });
}

/**
 * Convert:
 *
 * <p>1. First</p>
 * <p>2. Second</p>
 *
 * into:
 *
 * <ol>
 *   <li>First</li>
 *   <li>Second</li>
 * </ol>
 */
function convertFakeNumberedLists(document: Document): void {
  const paragraphs = Array.from(document.querySelectorAll("p")) as HTMLParagraphElement[];

  let currentList: HTMLOListElement | null = null;

  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() ?? "";

    const isNumbered = /^\d+[\.\)]\s+/.test(text);

    if (!isNumbered) {
      currentList = null;
      return;
    }

    if (!currentList) {
      currentList = document.createElement("ol");

      p.parentNode?.insertBefore(currentList, p);
    }

    const li = document.createElement("li");

    li.textContent = text.replace(/^\d+[\.\)]\s+/, "");

    currentList.appendChild(li);

    p.remove();
  });
}

/**
 * Merge:
 *
 * <ul><li>A</li></ul>
 * <ul><li>B</li></ul>
 *
 * into:
 *
 * <ul>
 *   <li>A</li>
 *   <li>B</li>
 * </ul>
 */
function mergeAdjacentLists(document: Document): void {
  document.querySelectorAll("ul, ol").forEach((list) => {
    let next = list.nextElementSibling;

    while (next && next.tagName === list.tagName) {
      while (next.firstChild) {
        list.appendChild(next.firstChild);
      }

      const oldNext = next;

      next = next.nextElementSibling;

      oldNext.remove();
    }
  });
}
