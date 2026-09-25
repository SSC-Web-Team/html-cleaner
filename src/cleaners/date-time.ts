import { JSDOM } from "jsdom";

const MONTHS_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const MONTHS_FR: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function createTimeElement(document: Document, dateTime: string, displayText: string): HTMLTimeElement {
  const time = document.createElement("time");

  time.className = "nowrap";
  time.setAttribute("datetime", dateTime);
  time.textContent = displayText;

  return time;
}

function getTextNodes(document: Document): Text[] {
  const textNodes: Text[] = [];
  const stack: Node[] = [document.body];

  while (stack.length > 0) {
    const node = stack.pop();

    if (!node) {
      continue;
    }

    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        textNodes.push(child as Text);
      } else {
        stack.push(child);
      }
    });
  }

  return textNodes;
}

function replaceMatchesInTextNode(
  document: Document,
  textNode: Text,
  patterns: Array<{
    regex: RegExp;
    formatter: (match: RegExpMatchArray) => { dateTime: string; displayText: string } | null;
  }>
): void {
  const text = textNode.textContent ?? "";
  const matches: Array<{ start: number; end: number; node: Node }> = [];

  patterns.forEach(({ regex, formatter }) => {
    const searchRegex = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);

    for (const match of text.matchAll(searchRegex)) {
      const replacement = formatter(match);

      if (!replacement) {
        continue;
      }

      const start = match.index ?? 0;
      const end = start + match[0].length;

      matches.push({
        start,
        end,
        node: createTimeElement(document, replacement.dateTime, replacement.displayText),
      });
    }
  });

  if (matches.length === 0) {
    return;
  }

  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach((match) => {
    if (match.start < lastIndex) {
      return;
    }

    if (match.start > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.start)));
    }

    fragment.appendChild(match.node);
    lastIndex = match.end;
  });

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  textNode.replaceWith(fragment);
}

function addDateTimeTagsToDocument(document: Document): void {
  const textNodes = getTextNodes(document);
  const enMonthNames = Object.keys(MONTHS_EN).join("|");
  const frMonthNames = Object.keys(MONTHS_FR).join("|");

  const patterns = [
    {
      regex: new RegExp(`\\b(${enMonthNames})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "gi"),
      formatter: (match: RegExpMatchArray) => {
        const [, month, day, year] = match;
        const monthNum = MONTHS_EN[month.toLowerCase()];
        const dayNum = parseInt(day, 10);
        const yearNum = parseInt(year, 10);

        return {
          dateTime: `${yearNum}-${pad(monthNum)}-${pad(dayNum)}`,
          displayText: match[0],
        };
      },
    },
    {
      regex: new RegExp(`\\b(\\d{1,2})(?:er)?\\s+(${frMonthNames})\\s+(\\d{4})\\b`, "gi"),
      formatter: (match: RegExpMatchArray) => {
        const [, day, month, year] = match;
        const monthNum = MONTHS_FR[month.toLowerCase()];
        const dayNum = parseInt(day, 10);
        const yearNum = parseInt(year, 10);

        return {
          dateTime: `${yearNum}-${pad(monthNum)}-${pad(dayNum)}`,
          displayText: match[0],
        };
      },
    },
    {
      regex: /\b(\d{1,2}):(\d{2})\s?(a\.m\.|p\.m\.|am|pm)?\b/gi,
      formatter: (match: RegExpMatchArray) => {
        const [, hourStr, minStr, ampm] = match;

        let hour = parseInt(hourStr, 10);
        const min = parseInt(minStr, 10);

        if (ampm) {
          const lower = ampm.toLowerCase();

          if (lower.startsWith("p") && hour < 12) {
            hour += 12;
          }

          if (lower.startsWith("a") && hour === 12) {
            hour = 0;
          }
        }

        return {
          dateTime: `${pad(hour)}:${pad(min)}`,
          displayText: match[0],
        };
      },
    },
    {
      regex: /\b(\d{1,2})\s*h(?:\s*(\d{2}))?\b/gi,
      formatter: (match: RegExpMatchArray) => {
        const [, hourStr, minStr] = match;
        const hour = parseInt(hourStr, 10);
        const min = minStr ? parseInt(minStr, 10) : 0;

        return {
          dateTime: `${pad(hour)}:${pad(min)}`,
          displayText: minStr ? `${hour}\u00A0h\u00A0${pad(min)}` : `${hour}\u00A0h`,
        };
      },
    },
  ];

  textNodes.forEach((textNode) => {
    replaceMatchesInTextNode(document, textNode, patterns);
  });
}

// Wraps dates (and optionally times)
export function addDateTimeTags(document: Document): void;
export function addDateTimeTags(html: string): string;
export function addDateTimeTags(input: string | Document): string | void {
  if (typeof input === "string") {
    const dom = new JSDOM(input);

    addDateTimeTagsToDocument(dom.window.document);

    return dom.window.document.body.innerHTML;
  }

  addDateTimeTagsToDocument(input);
}