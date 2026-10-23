import type { ContentLanguage } from '../index.ts';

export const NU_VALIDATOR_URL = 'https://validator.w3.org/nu/';

export interface ValidationMessage {
  type: 'error' | 'info' | 'non-document-error';
  subType?: 'warning' | 'fatal';
  message: string;
  // 1-based, relative to the user's original text
  line?: number;
  column?: number;
  endColumn?: number;
}

interface NuMessage {
  type: ValidationMessage['type'];
  subType?: ValidationMessage['subType'];
  message: string;
  lastLine?: number;
  firstLine?: number;
  firstColumn?: number;
  lastColumn?: number;
}

const FULL_DOCUMENT = /<!doctype|<html[\s>]/i;

// Fragments are wrapped so the checker doesn't report missing doctype/title/lang
function wrapFragment(html: string, language: ContentLanguage) {
  const prefix = `<!DOCTYPE html>\n<html lang="${language}">\n<head><title>Fragment</title></head>\n<body>\n`;
  return { body: `${prefix}${html}\n</body>\n</html>\n`, offset: prefix.split('\n').length - 1 };
}

export async function validateHtml(
  html: string,
  language: ContentLanguage = 'en',
  options: { url?: string; signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<ValidationMessage[]> {
  const isFragment = !FULL_DOCUMENT.test(html);
  const { body, offset } = isFragment ? wrapFragment(html, language) : { body: html, offset: 0 };
  const doFetch = options.fetchImpl ?? fetch;

  const response = await doFetch(`${options.url ?? NU_VALIDATOR_URL}?out=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'User-Agent': 'html-cleaner-vscode-extension',
    },
    body,
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Nu HTML Checker responded with ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { messages?: NuMessage[] };

  return (data.messages ?? []).map((m) => {
    const last = m.lastLine === undefined ? undefined : Math.max(1, m.lastLine - offset);
    const first = m.firstLine === undefined ? last : Math.max(1, m.firstLine - offset);
    return {
      type: m.type,
      subType: m.subType,
      message: m.message,
      line: first,
      column: m.firstColumn ?? (m.lastColumn === undefined ? undefined : 1),
      endColumn: m.lastColumn,
    };
  });
}
