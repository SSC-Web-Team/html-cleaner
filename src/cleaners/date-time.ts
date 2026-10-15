import { SHOW_TEXT } from '../utils/constants.ts';

const MONTHS_EN = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const NBSP = '\u00A0';
const pad = (n: number | string) => String(n).padStart(2, '0');
const stripAccents = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '');

// Unaccented spellings (fevrier, aout, decembre) are accepted too
const monthNumber = (month: string, months: string[]) =>
  months.map(stripAccents).indexOf(stripAccents(month.toLowerCase())) + 1;

const monthNames = (months: string[]) => [...months, ...months.map(stripAccents)].join('|');

const PERIOD = '[ap]\\.?m\\.?';
const HOUR_12 = '(?:1[0-2]|0?[1-9])';

const to24Hours = (hour: string, period = '') => {
  let hours = Number(hour);

  if (/^p/i.test(period) && hours < 12) {
    hours += 12;
  } else if (/^a/i.test(period) && hours === 12) {
    hours = 0;
  }

  return hours;
};

type Rule = {
  regex: RegExp;
  format: (match: RegExpMatchArray) => { dateTime: string; text: string };
};

const rules: Rule[] = [
  // English date: "September 30, 2026"
  {
    regex: new RegExp(`\\b(${monthNames(MONTHS_EN)})\\s+(\\d{1,2})(,?)\\s+(\\d{4})\\b`, 'gi'),
    format: ([, month, day, comma, year]) => ({
      dateTime: `${year}-${pad(monthNumber(month, MONTHS_EN))}-${pad(day)}`,
      text: `${month}${NBSP}${day}${comma} ${year}`,
    }),
  },
  // French date: "30 septembre 2026" / "1er septembre 2026"
  {
    regex: new RegExp(`\\b(\\d{1,2})(er)?\\s+(${monthNames(MONTHS_FR)})\\s+(\\d{4})\\b`, 'gi'),
    format: ([, day, er = '', month, year]) => ({
      dateTime: `${year}-${pad(monthNumber(month, MONTHS_FR))}-${pad(day)}`,
      text: `${day}${er}${NBSP}${month} ${year}`,
    }),
  },
  // English date without a year: "October 26"
  {
    regex: new RegExp(`\\b(${monthNames(MONTHS_EN)})\\s+(\\d{1,2})\\b`, 'gi'),
    format: ([, month, day]) => ({
      dateTime: `${pad(monthNumber(month, MONTHS_EN))}-${pad(day)}`,
      text: `${month}${NBSP}${day}`,
    }),
  },
  // First hour of an English time range, which shares the period of the end time: "1" in "1 to 2 pm"
  {
    regex: new RegExp(
      `\\b(${HOUR_12})(?=\\s+(?:to|and|-|–)\\s+${HOUR_12}(?::\\d{2})?\\s?(${PERIOD})(?!\\w))`,
      'gi',
    ),
    format: ([, hour, period]) => ({
      dateTime: `${pad(to24Hours(hour, period))}:00`,
      text: `${hour} ${period}`,
    }),
  },
  // English time: "3:30 p.m."
  {
    regex: new RegExp(`\\b(\\d{1,2}):(\\d{2})(?:\\s?(${PERIOD}))?(?!\\w)`, 'gi'),
    format: ([text, hour, minutes, period]) => ({
      dateTime: `${pad(to24Hours(hour, period))}:${minutes}`,
      text,
    }),
  },
  // English time without minutes: "2 pm"
  {
    regex: new RegExp(`(?<![\\d:])\\b(${HOUR_12})\\s?(${PERIOD})(?!\\w)`, 'gi'),
    format: ([text, hour, period]) => ({
      dateTime: `${pad(to24Hours(hour, period))}:00`,
      text,
    }),
  },
  // French time: "15 h 30" / "15h30" / "15 h"
  {
    regex: /\b(\d{1,2})\s*h(?:\s*(\d{2}))?\b/gi,
    format: ([, hour, minutes]) => ({
      dateTime: `${pad(hour)}:${minutes ?? '00'}`,
      text: minutes ? `${hour}${NBSP}h${NBSP}${minutes}` : `${hour}${NBSP}h`,
    }),
  },
];

function getTextNodes(document: Document): Text[] {
  const walker = document.createTreeWalker(document.body, SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  return textNodes;
}

export function addDateTimeTags(document: Document): void {
  rules.forEach(({ regex, format }) => {
    getTextNodes(document).forEach((textNode) => {
      // Skip text that is already tagged
      if (textNode.parentElement?.closest('time')) {
        return;
      }

      const matches = [...textNode.data.matchAll(regex)];

      if (matches.length === 0) {
        return;
      }

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      matches.forEach((match) => {
        const { dateTime, text } = format(match);
        const time = document.createElement('time');

        time.className = 'nowrap';
        time.setAttribute('datetime', dateTime);
        time.textContent = text;

        fragment.append(textNode.data.slice(lastIndex, match.index), time);
        lastIndex = match.index + match[0].length;
      });

      fragment.append(textNode.data.slice(lastIndex));
      textNode.replaceWith(fragment);
    });
  });
}
