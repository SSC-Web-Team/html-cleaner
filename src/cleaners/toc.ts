export type TocLanguage = 'en' | 'fr';
export type TocPlatform = 'myssc' | 'canada';

const TOC_SECTION_ID = 'toc-nav';
const TOC_TITLES: Record<TocLanguage, string> = {
  en: 'On this page',
  fr: 'Sur cette page',
};

export function addTableOfContents(
  document: Document,
  language: TocLanguage,
  platform: TocPlatform = 'myssc',
): void {
  const body = document.body;

  if (!body) {
    return;
  }

  // Remove a previously generated TOC so the command can be re-run safely
  document.getElementById(TOC_SECTION_ID)?.remove();

  const headings = Array.from(body.querySelectorAll<HTMLHeadingElement>('h2, h3'));

  if (headings.length === 0) {
    return;
  }

  const list = document.createElement('ul');
  let sectionCount = 0;
  let subCount = 0;
  let currentItem: HTMLLIElement | undefined;
  let subList: HTMLUListElement | undefined;

  for (const heading of headings) {
    const text = (heading.textContent ?? '').replace(/\s+/g, ' ').trim();

    if (!text) {
      continue;
    }

    const isH2 = heading.tagName === 'H2';

    // An h3 before any h2 is promoted to a top-level entry
    if (!isH2 && !currentItem) {
      sectionCount++;
      subCount = 0;
      heading.id = `toc${sectionCount}`;
      list.append(createItem(document, heading.id, text, platform));
      continue;
    }

    if (isH2) {
      sectionCount++;
      subCount = 0;
      subList = undefined;
      heading.id = `toc${sectionCount}`;
      currentItem = createItem(document, heading.id, text, platform);
      list.append(currentItem);
    } else if (currentItem) {
      subCount++;
      heading.id = `toc${sectionCount}-${subCount}`;

      if (!subList) {
        subList = document.createElement('ul');
        currentItem.append(subList);
      }

      subList.append(createItem(document, heading.id, text, platform));
    }
  }

  const section = document.createElement('section');
  section.id = TOC_SECTION_ID;

  let title: HTMLElement;

  if (platform === 'canada') {
    title = document.createElement('gcds-heading');
    title.setAttribute('tag', 'h2');
    title.textContent = TOC_TITLES[language];
    list.className = 'list-disc mb-300';
  } else {
    title = document.createElement('h2');
    title.id = 'toc';
    title.textContent = TOC_TITLES[language];
  }

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', TOC_TITLES[language]);
  nav.append(title, list);
  section.append(nav);

  const h1 = body.querySelector('h1, gcds-heading[tag="h1"]');

  if (h1) {
    // Keep any introductory content between the h1 and the first h2 above the TOC
    const firstH2 = headings.find(
      (heading) =>
        heading.tagName === 'H2' &&
        Boolean(h1.compareDocumentPosition(heading) & document.defaultView!.Node.DOCUMENT_POSITION_FOLLOWING),
    );

    if (firstH2) {
      firstH2.before(section);
    } else {
      h1.after(section);
    }
  } else {
    body.prepend(section);
  }
}

function createItem(
  document: Document,
  id: string,
  text: string,
  platform: TocPlatform,
): HTMLLIElement {
  const item = document.createElement('li');
  const anchor = document.createElement(platform === 'canada' ? 'gcds-link' : 'a');

  anchor.setAttribute('href', `#${id}`);
  anchor.textContent = text;
  item.append(anchor);

  return item;
}
