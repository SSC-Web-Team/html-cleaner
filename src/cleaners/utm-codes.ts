const UTM_SOURCE = 'myssc';
const UTM_MEDIUM = 'homepage';
const UTM_CAMPAIGNS = new Set([
  'promo_block',
  'upcoming_events',
  'latest_news',
  'get_help',
]);
const URL_BASE = 'https://html-cleaner.invalid';

export function removeMySscUtmCodes(document: Document): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');

    if (!href) {
      return;
    }

    let linkUrl: URL;

    try {
      linkUrl = new URL(href, URL_BASE);
    } catch {
      return;
    }

    if (
      (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') ||
      linkUrl.searchParams.get('utm_source') !== UTM_SOURCE ||
      linkUrl.searchParams.get('utm_medium') !== UTM_MEDIUM ||
      !UTM_CAMPAIGNS.has(linkUrl.searchParams.get('utm_campaign') ?? '')
    ) {
      return;
    }

    linkUrl.searchParams.delete('utm_source');
    linkUrl.searchParams.delete('utm_medium');
    linkUrl.searchParams.delete('utm_campaign');

    if (/^[a-z][a-z\d+.-]*:/i.test(href)) {
      anchor.setAttribute('href', linkUrl.href);
    } else if (href.startsWith('//')) {
      anchor.setAttribute(
        'href',
        `//${linkUrl.host}${linkUrl.pathname}${linkUrl.search}${linkUrl.hash}`,
      );
    } else {
      const pathname = href.startsWith('?')
        ? ''
        : href.startsWith('/')
          ? linkUrl.pathname
          : linkUrl.pathname.slice(1);

      anchor.setAttribute('href', `${pathname}${linkUrl.search}${linkUrl.hash}`);
    }
  });
}
