export type FootnoteLanguage = 'en' | 'fr';
export type FootnotePlatform = 'myssc' | 'canada';

interface Footnote {
  id: string;
  label: string;
  refs: Element[];
  content: HTMLParagraphElement[];
  sources: Element[];
}

const LABELS: Record<
  FootnoteLanguage,
  { heading: string; note: string; returnTo: string; first: string; referrer: string }
> = {
  en: {
    heading: 'Footnotes',
    note: 'Footnote',
    returnTo: 'Return to {first}footnote ',
    first: 'first',
    referrer: ' referrer',
  },
  fr: {
    heading: 'Notes de bas de page',
    note: 'Note de bas de page',
    returnTo: 'Retour à la {first}référence de la note de bas de page ',
    first: 'première',
    referrer: '',
  },
};

const INLINE_WRAPPERS = new Set(['SUP', 'STRONG', 'B', 'EM', 'I', 'U', 'SPAN']);

// Returns true when at least one footnote was converted
export function addFootnotes(
  document: Document,
  language: FootnoteLanguage,
  platform: FootnotePlatform,
): boolean {
  const notes = collectWordFootnotes(document);
  const footnotes = [collectWordFootnotes, collectListFootnotes, collectWetFootnotes]
    .map((collect) => collect(document))
    .find((found) => found.length > 0);

  if (!footnotes) {
    return false;
  }

  cleanUpSources(document, footnotes);

  for (const note of footnotes) {
    note.refs.forEach((ref, index) => {
      const replacement =
        platform === 'canada'
          ? createWetReference(document, note, index, language)
          : createMysscReference(document, note);

      trimTrailingSpace(ref);
      ref.replaceWith(replacement);
    });
  }

  if (platform === 'canada') {
    document.body.append(createWetSection(document, footnotes, language));
  }

  return true;
}

function collectWordFootnotes(document: Document): Footnote[] {
  const notes = new Map<string, Footnote>();

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#_ftnref"]').forEach((anchor) => {
    const id = /^#_ftnref(\d+)$/.exec(anchor.getAttribute('href') ?? '')?.[1];

    if (!id || notes.has(id)) {
      return;
    }

    const wrapper = anchor.closest('div[id^="ftn"]');
    const block = wrapper ?? anchor.closest('p, li');

    if (!block) {
      return;
    }

    const paragraphs = block.tagName === 'P' ? [block] : Array.from(block.querySelectorAll('p'));
    const content = paragraphs.flatMap((paragraph) => {
      const clone = paragraph.cloneNode(true) as HTMLElement;
      const marker = clone.querySelector(`a[href="#_ftnref${id}"]`);

      if (marker) {
        outermostWrapper(marker).remove();
      }

      return toParagraph(paragraph.ownerDocument, clone.innerHTML);
    });

    if (content.length === 0) {
      return;
    }

    notes.set(id, { id, label: id, refs: [], content, sources: [block] });
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#_ftn"]').forEach((anchor) => {
    const id = /^#_ftn(\d+)$/.exec(anchor.getAttribute('href') ?? '')?.[1];

    if (id) {
      notes.get(id)?.refs.push(outermostWrapper(anchor));
    }
  });

  return Array.from(notes.values()).filter((note) => note.refs.length > 0);
}

// List format: <li id="ftn1"><p><a href="#ref-ftn1">^</a></p><div><p>Text</p></div></li>
function collectListFootnotes(document: Document): Footnote[] {
  const notes: Footnote[] = [];

  document.querySelectorAll<HTMLElement>('li[id^="ftn"]').forEach((item) => {
    const id = /^ftn(\d+)$/.exec(item.id)?.[1];

    if (!id || !item.querySelector(`a[href="#ref-ftn${id}"]`)) {
      return;
    }

    const content = Array.from(item.querySelectorAll('p'))
      .filter((paragraph) => !paragraph.querySelector('a[href^="#ref-ftn"]'))
      .flatMap((paragraph) => toParagraph(document, paragraph.innerHTML));
    const refs = new Set<Element>();

    document.querySelectorAll(`[id="ref-ftn${id}"], a[href="#ftn${id}"]`).forEach((candidate) => {
      if (item.contains(candidate)) {
        return;
      }

      const anchor = candidate.tagName === 'A' ? candidate : candidate.querySelector('a');

      refs.add(outermostWrapper(anchor ?? candidate));
    });

    if (content.length > 0 && refs.size > 0) {
      notes.push({ id, label: id, refs: Array.from(refs), content, sources: [item] });
    }
  });

  return notes;
}

// Source already in WET format (e.g. to convert it to MySSC+)
function collectWetFootnotes(document: Document): Footnote[] {
  const notes: Footnote[] = [];

  document.querySelectorAll<HTMLElement>('aside.wb-fnote dd[id^="fn"]').forEach((definition) => {
    const id = definition.id.slice(2);
    const content = Array.from(
      definition.querySelectorAll<HTMLParagraphElement>('p:not(.fn-rtn)'),
    ).flatMap((paragraph) => toParagraph(document, paragraph.innerHTML));
    const refs = Array.from(
      document.querySelectorAll<HTMLElement>('sup[id$="-rf"]'),
    ).filter((sup) => sup.querySelector('a')?.getAttribute('href') === `#fn${id}`);

    if (content.length === 0 || refs.length === 0) {
      return;
    }

    const link = refs[0].querySelector('a')!.cloneNode(true) as HTMLElement;

    link.querySelectorAll('.wb-inv').forEach((hidden) => hidden.remove());

    notes.push({
      id,
      label: link.textContent?.trim() || id,
      refs,
      content,
      sources: [definition.closest('aside.wb-fnote')!],
    });
  });

  return notes;
}

function toParagraph(document: Document, html: string): HTMLParagraphElement[] {
  const paragraph = document.createElement('p');

  paragraph.innerHTML = html.replace(/^(\s|&nbsp;|&#160;)+/, '').trim();

  return paragraph.textContent?.trim() ? [paragraph] : [];
}

function outermostWrapper(element: Element): Element {
  let current = element;
  const text = element.textContent?.trim();

  while (
    current.parentElement &&
    INLINE_WRAPPERS.has(current.parentElement.tagName) &&
    current.parentElement.textContent?.trim() === text
  ) {
    current = current.parentElement;
  }

  return current;
}

function trimTrailingSpace(element: Element): void {
  const previous = element.previousSibling;

  if (previous?.nodeType === 3) {
    previous.textContent = previous.textContent?.replace(/ +$/, '') ?? '';
  }
}

function cleanUpSources(document: Document, notes: Footnote[]): void {
  const parents = new Set<Element>();

  for (const source of notes.flatMap((note) => note.sources)) {
    const previous = source.previousElementSibling;

    if (previous?.tagName === 'HR') {
      previous.remove();
    }

    if (source.parentElement && source.parentElement !== document.body) {
      parents.add(source.parentElement);
    }

    source.remove();
  }

  // Word wraps its footnotes in a div that only holds an hr and the notes
  parents.forEach((parent) => {
    parent.querySelectorAll(':scope > hr').forEach((rule) => rule.remove());

    if (['DIV', 'UL', 'OL'].includes(parent.tagName) && !parent.textContent?.trim() && parent.children.length === 0) {
      parent.remove();
    }
  });
}

function createWetReference(
  document: Document,
  note: Footnote,
  index: number,
  language: FootnoteLanguage,
): HTMLElement {
  const sup = document.createElement('sup');
  const anchor = document.createElement('a');
  const hidden = document.createElement('span');

  sup.id = referenceId(note, index);
  anchor.className = 'fn-lnk';
  anchor.setAttribute('href', `#fn${note.id}`);
  hidden.className = 'wb-inv';
  hidden.textContent = `${LABELS[language].note} `;
  anchor.append(hidden, note.label);
  sup.append(anchor);

  return sup;
}

function referenceId(note: Footnote, index: number): string {
  return note.refs.length === 1 ? `fn${note.id}-rf` : `fn${note.id}-${index + 1}-rf`;
}

function createMysscReference(document: Document, note: Footnote): HTMLElement {
  const element = document.createElement('footnotes');

  element.setAttribute('data-value', /[^\d\s]+$/.exec(note.label)?.[0] ?? '');
  element.setAttribute('data-text', note.content.map((paragraph) => paragraph.outerHTML).join(''));
  element.textContent = '\u00a0';

  return element;
}

function createWetSection(
  document: Document,
  notes: Footnote[],
  language: FootnoteLanguage,
): HTMLElement {
  const labels = LABELS[language];
  const aside = document.createElement('aside');
  const heading = document.createElement('h2');
  const list = document.createElement('dl');

  aside.className = 'wb-fnote';
  aside.setAttribute('role', 'note');
  heading.id = 'fn';
  heading.textContent = labels.heading;

  for (const note of notes) {
    const term = document.createElement('dt');
    const definition = document.createElement('dd');
    const back = document.createElement('p');
    const anchor = document.createElement('a');
    const hidden = document.createElement('span');
    const hiddenReferrer = document.createElement('span');
    const hasMany = note.refs.length > 1;

    term.textContent = `${labels.note} ${note.label}`;
    definition.id = `fn${note.id}`;
    back.className = 'fn-rtn';
    anchor.setAttribute('href', `#${referenceId(note, 0)}`);
    hidden.className = 'wb-inv';

    const [before, after] = labels.returnTo.split('{first}');

    hidden.append(before);

    if (hasMany) {
      hidden.append(document.createElement('span'));
      hidden.lastElementChild!.textContent = labels.first;
    }

    hidden.append(hasMany ? ` ${after}` : after);
    anchor.append(hidden, note.label);

    if (labels.referrer) {
      hiddenReferrer.className = 'wb-inv';
      hiddenReferrer.textContent = labels.referrer;
      anchor.append(hiddenReferrer);
    }

    back.append(anchor);
    definition.append(...note.content, back);
    list.append(term, definition);
  }

  aside.append(heading, list);

  return aside;
}
