import { addClassBySelector } from '../utils/dom.ts';

export function cleanFormatting(document: Document): void {
  formatTables(document);

  addClassBySelector(document, 'table', 'table');
  addClassBySelector(document, 'table', 'table-condensed');
  addClassBySelector(document, 'table', 'table-bordered');

  convertFakeBulletLists(document);
  convertFakeNumberedLists(document);
  mergeAdjacentLists(document);
  moveTrailingBreaksOutsideBoldElements(document);
}

function formatTables(document: Document): void {
  document.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    const rows = Array.from(table.rows).filter((row) => row.parentElement?.tagName !== 'TFOOT');
    const hasContent = rows.some((row) =>
      Array.from(row.cells).some(
        (cell) =>
          cell.textContent?.trim() ||
          cell.querySelector('img, svg, video, audio, object, iframe'),
      ),
    );

    if (!hasContent) {
      table.remove();
      return;
    }

    const headerRows: HTMLTableRowElement[] = [];

    for (const row of rows) {
      if (!isHeaderRow(row)) {
        break;
      }

      headerRows.push(row);
    }

    const bodyRows = rows.slice(headerRows.length);
    const sections = Array.from(table.children).filter(
      (child) => child.tagName === 'THEAD' || child.tagName === 'TBODY',
    );
    const thead = sections.find((section) => section.tagName === 'THEAD');
    const tbody = sections.find((section) => section.tagName === 'TBODY');

    sections.forEach((section) => {
      while (section.firstChild) {
        section.removeChild(section.firstChild);
      }

      if (section !== thead && section !== tbody) {
        section.remove();
      }
    });

    if (headerRows.length > 0) {
      const header = thead ?? document.createElement('thead');

      if (Array.from(headerRows[0].cells).every((cell) => cell.tagName === 'TH')) {
        headerRows[0].classList.add('active');
      }

      headerRows.forEach((row) => header.appendChild(row));
      table.insertBefore(header, tbody ?? table.querySelector(':scope > tfoot'));
    } else {
      thead?.remove();
    }

    if (bodyRows.length > 0) {
      const body = tbody ?? document.createElement('tbody');
      bodyRows.forEach((row) => body.appendChild(row));
      table.insertBefore(body, table.querySelector(':scope > tfoot'));
    } else {
      tbody?.remove();
    }
  });
}

function isHeaderRow(row: HTMLTableRowElement): boolean {
  const cells = Array.from(row.cells);

  if (cells.length === 0) {
    return false;
  }

  if (cells.every((cell) => cell.tagName === 'TH')) {
    return true;
  }

  return cells.every(
    (cell) =>
      cell.tagName === 'TD' &&
      cell.children.length === 1 &&
      (cell.firstElementChild?.tagName === 'STRONG' || cell.firstElementChild?.tagName === 'B'),
  );
}

function moveTrailingBreaksOutsideBoldElements(document: Document): void {
  document.querySelectorAll('b, strong').forEach((element) => {
    const trailingBreaks: Node[] = [];

    while (element.lastChild?.nodeName === 'BR') {
      const lineBreak = element.lastChild;
      trailingBreaks.unshift(lineBreak);
      element.removeChild(lineBreak);
    }

    trailingBreaks.forEach((lineBreak) => {
      element.parentNode?.insertBefore(lineBreak, element.nextSibling);
    });
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
  const paragraphs = Array.from(document.querySelectorAll('p')) as HTMLParagraphElement[];

  let currentList: HTMLUListElement | null = null;

  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() ?? '';

    const isBullet = /^(•|▪|◦|-|o)\s+/.test(text);

    if (!isBullet) {
      currentList = null;
      return;
    }

    if (!currentList) {
      currentList = document.createElement('ul');

      p.parentNode?.insertBefore(currentList, p);
    }

    const li = document.createElement('li');

    li.textContent = text.replace(/^(•|▪|◦|-|o)\s+/, '');

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
  const paragraphs = Array.from(document.querySelectorAll('p')) as HTMLParagraphElement[];

  let currentList: HTMLOListElement | null = null;

  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() ?? '';

    const isNumbered = /^\d+[.)]\s+/.test(text);

    if (!isNumbered) {
      currentList = null;
      return;
    }

    if (!currentList) {
      currentList = document.createElement('ol');

      p.parentNode?.insertBefore(currentList, p);
    }

    const li = document.createElement('li');

    li.textContent = text.replace(/^\d+[.)]\s+/, '');

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
  document.querySelectorAll('ul, ol').forEach((list) => {
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
