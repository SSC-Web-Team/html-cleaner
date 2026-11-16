import { JSDOM } from 'jsdom';

export function clipboardHtmlFragment(html: string): string {
  const start = /<!--\s*StartFragment\s*-->/i.exec(html);
  const end = /<!--\s*EndFragment\s*-->/i.exec(html);

  if (start && end && end.index >= start.index + start[0].length) {
    return html.slice(start.index + start[0].length, end.index);
  }

  if (start || end) {
    throw new Error('The clipboard HTML has invalid fragment markers.');
  }

  if (/<(?:html|body)(?:\s|>)/i.test(html)) {
    return new JSDOM(html).window.document.body.innerHTML;
  }

  return html;
}
