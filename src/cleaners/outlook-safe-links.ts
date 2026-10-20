const SAFE_LINK_HOST = /^[a-z0-9-]+\.safelinks\.protection\.outlook\.com$/i;

export function unwrapOutlookSafeLinks(document: Document): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    let safeLink: URL;

    try {
      safeLink = new URL(anchor.href);
    } catch {
      return;
    }

    if (!SAFE_LINK_HOST.test(safeLink.hostname)) {
      return;
    }

    const destination = safeLink.searchParams.get('url');

    if (!destination) {
      return;
    }

    try {
      const destinationUrl = new URL(destination);

      if (destinationUrl.protocol !== 'http:' && destinationUrl.protocol !== 'https:') {
        return;
      }
    } catch {
      return;
    }

    anchor.href = destination;
  });
}
