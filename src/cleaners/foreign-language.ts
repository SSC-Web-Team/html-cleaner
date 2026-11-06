import englishDictionary from 'dictionary-en';
import frenchDictionary from 'dictionary-fr';
import nspell from 'nspell';

export type ContentLanguage = 'en' | 'fr';

export type ForeignLanguageOccurrence = {
  word: string;
  context: string;
  languageTag: 'fr-CA' | 'en-CA';
};

type TextSelection = {
  node: Text;
  start: number;
  end: number;
};

type TextRunSegment = TextSelection & {
  runStart: number;
};

type TextRun = {
  text: string;
  segments: TextRunSegment[];
  lineBreaks: number[];
};

type MatchedOccurrence = ForeignLanguageOccurrence & {
  segments: TextSelection[];
};

const englishSpell = nspell({
  aff: Buffer.from(englishDictionary.aff),
  dic: Buffer.from(englishDictionary.dic),
});
const frenchSpell = nspell({
  aff: Buffer.from(frenchDictionary.aff),
  dic: Buffer.from(frenchDictionary.dic),
});
const wordPattern = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
const emailPattern = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu;
const sentencePattern = /[^.!?…]+(?:[.!?…]+|$)/gu;

export function findForeignLanguageOccurrences(
  document: Document,
  contentLanguage: ContentLanguage,
): ForeignLanguageOccurrence[] {
  return getMatchedOccurrences(document, contentLanguage).map(({ word, context, languageTag }) => ({
    word,
    context,
    languageTag,
  }));
}

export function wrapForeignLanguageOccurrences(
  document: Document,
  contentLanguage: ContentLanguage,
  selectedOccurrences: number[],
): void {
  const selected = new Set(selectedOccurrences);
  getMatchedOccurrences(document, contentLanguage)
    .filter((_, index) => selected.has(index))
    .reverse()
    .forEach((occurrence) => {
      const first = occurrence.segments[0];
      const last = occurrence.segments[occurrence.segments.length - 1];
      const range = document.createRange();
      range.setStart(first.node, first.start);
      range.setEnd(last.node, last.end);

      const wrapper = document.createElement('span');
      wrapper.setAttribute('lang', occurrence.languageTag);
      wrapper.append(range.extractContents());
      range.insertNode(wrapper);
    });
}

function getMatchedOccurrences(
  document: Document,
  contentLanguage: ContentLanguage,
): MatchedOccurrence[] {
  const contentSpell = contentLanguage === 'en' ? englishSpell : frenchSpell;
  const foreignSpell = contentLanguage === 'en' ? frenchSpell : englishSpell;
  const languageTag = contentLanguage === 'en' ? 'fr-CA' : 'en-CA';
  const occurrences: MatchedOccurrence[] = [];

  getTextRuns(document.body).forEach((run) => {
    const emailRanges = Array.from(run.text.matchAll(emailPattern), (email) => ({
      start: email.index,
      end: email.index + email[0].length,
    }));
    const foreignWords: Array<{ word: string; start: number; end: number }> = [];
    const contentWords: Array<{ start: number; end: number }> = [];
    wordPattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = wordPattern.exec(run.text))) {
      const word = match[0];
      const start = match.index;
      const end = start + word.length;

      if (word.length < 2 || emailRanges.some((email) => email.start < end && email.end > start)) {
        continue;
      }

      const isForeign = isCorrect(foreignSpell, word);
      const isContent = isCorrect(contentSpell, word);

      if (isForeign && !isContent) {
        foreignWords.push({ word, start, end });
      } else if (isContent && !isForeign) {
        contentWords.push({ start, end });
      }
    }

    sentencePattern.lastIndex = 0;

    for (const sentence of run.text.matchAll(sentencePattern)) {
      const sentenceStart = sentence.index;
      const sentenceEnd = sentenceStart + sentence[0].length;
      const foreignInSentence = foreignWords.filter(
        ({ start, end }) => start >= sentenceStart && end <= sentenceEnd,
      );
      const contentInSentence = contentWords.filter(
        ({ start, end }) => start >= sentenceStart && end <= sentenceEnd,
      );
      const includesEmail = emailRanges.some(
        (email) => email.start < sentenceEnd && email.end > sentenceStart,
      );
      const hasSentenceEnding = /[.!?…]+$/u.test(sentence[0].trimEnd());
      const includesLineBreak = run.lineBreaks.some(
        (lineBreak) => lineBreak >= sentenceStart && lineBreak < sentenceEnd,
      );

      if (
        (hasSentenceEnding || includesLineBreak) &&
        foreignInSentence.length >= 2 &&
        foreignInSentence.length > contentInSentence.length &&
        !includesEmail
      ) {
        let start = sentenceStart;
        let end = sentenceEnd;

        while (start < end && /\s/u.test(run.text[start])) {
          start++;
        }

        while (end > start && /\s/u.test(run.text[end - 1])) {
          end--;
        }

        occurrences.push(createOccurrence(run, start, end, languageTag));
        continue;
      }

      foreignInSentence.forEach(({ word, start, end }) => {
        occurrences.push(createOccurrence(run, start, end, languageTag, word));
      });
    }
  });

  return occurrences;
}

function getTextRuns(root: Node): TextRun[] {
  const blockTags = new Set([
    'address',
    'article',
    'aside',
    'blockquote',
    'dd',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hr',
    'li',
    'main',
    'nav',
    'ol',
    'p',
    'section',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
  ]);
  const ignoredTags = 'script, style, code, pre, textarea, [lang], a[href^="mailto:" i]';
  const runs: TextRun[] = [];
  let text = '';
  let segments: TextRunSegment[] = [];
  let lineBreaks: number[] = [];

  const flush = () => {
    if (segments.length > 0) {
      runs.push({ text, segments, lineBreaks });
    }

    text = '';
    segments = [];
    lineBreaks = [];
  };

  const visit = (node: Node) => {
    if (node.nodeType === 3) {
      const textNode = node as Text;

      if (textNode.data.length > 0) {
        const runStart = text.length;
        text += textNode.data;
        segments.push({
          node: textNode,
          start: 0,
          end: textNode.data.length,
          runStart,
        });
      }

      return;
    }

    if (node.nodeType !== 1) {
      return;
    }

    const element = node as Element;

    if (element.matches(ignoredTags)) {
      flush();
      return;
    }

    const tagName = element.tagName.toLowerCase();

    if (blockTags.has(tagName)) {
      flush();
    }

    if (tagName === 'br') {
      lineBreaks.push(text.length);
      text += '\n';
      return;
    }

    Array.from(element.childNodes).forEach(visit);

    if (blockTags.has(tagName)) {
      flush();
    }
  };

  Array.from(root.childNodes).forEach(visit);
  flush();

  return runs;
}

function createOccurrence(
  run: TextRun,
  start: number,
  end: number,
  languageTag: ForeignLanguageOccurrence['languageTag'],
  displayText = run.text.slice(start, end),
): MatchedOccurrence {
  const segments = run.segments.flatMap((segment) => {
    const segmentEnd = segment.runStart + segment.end - segment.start;
    const selectionStart = Math.max(start, segment.runStart);
    const selectionEnd = Math.min(end, segmentEnd);

    if (selectionStart >= selectionEnd) {
      return [];
    }

    return [
      {
        node: segment.node,
        start: segment.start + selectionStart - segment.runStart,
        end: segment.start + selectionEnd - segment.runStart,
      },
    ];
  });

  return {
    word: displayText.replaceAll(/\s+/g, ' ').trim(),
    context: getContext(run.text, start, end),
    languageTag,
    segments,
  };
}

function getContext(text: string, start: number, end: number): string {
  const contextStart = Math.max(0, start - 30);
  const contextEnd = Math.min(text.length, end + 30);

  return `${contextStart > 0 ? '...' : ''}${text.slice(contextStart, contextEnd)}${
    contextEnd < text.length ? '...' : ''
  }`
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function isCorrect(spell: ReturnType<typeof nspell>, word: string): boolean {
  return spell.correct(word) || spell.correct(word.toLowerCase());
}
