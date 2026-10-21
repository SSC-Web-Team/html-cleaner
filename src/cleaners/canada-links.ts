const CANADA_ORIGIN = 'https://www.canada.ca';

export function rewriteCanadaLinks(document: Document): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');

    if (!href) {
      return;
    }

    let linkUrl: URL;

    try {
      linkUrl = new URL(href);
    } catch {
      return;
    }

    if (linkUrl.origin !== CANADA_ORIGIN) {
      return;
    }

    anchor.setAttribute(
      'href',
      `/content/canadasite${linkUrl.pathname}${linkUrl.search}${linkUrl.hash}`,
    );
  });
}
