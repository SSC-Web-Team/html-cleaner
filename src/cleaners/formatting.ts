const SHOW_TEXT = 4;
const SHOW_COMMENT = 128;

export function cleanFormatting(document: Document): void {
  // Remove deleted content
  document.querySelectorAll("del").forEach((el) => {
    el.remove();
  });

  // Remove scripts and style blocks
  document.querySelectorAll("script, style").forEach((el) => {
    el.remove();
  });

  // Remove Office namespace tags
  ["o\\:p", "w\\:sdt", "v\\:shape"].forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.remove();
    });
  });

  // Remove HTML comments
  const comments: Comment[] = [];

  const commentWalker = document.createTreeWalker(document.body, SHOW_COMMENT);

  let node: Node | null;

  while ((node = commentWalker.nextNode())) {
    comments.push(node as Comment);
  }

  comments.forEach((comment) => comment.remove());

  // Clean attributes
  document.querySelectorAll("*").forEach((el) => {
    const className = el.getAttribute("class");

    // Remove Word classes
    if (className?.includes("Mso")) {
      el.removeAttribute("class");
    }

    // Remove styles
    if (el.hasAttribute("style")) {
      el.removeAttribute("style");
    }

    // Remove language attributes
    if (el.hasAttribute("lang")) {
      el.removeAttribute("lang");
    }

    // Remove empty attributes
    Array.from(el.attributes).forEach((attr) => {
      if (!attr.value.trim()) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Remove empty spans
  document.querySelectorAll("span").forEach((span) => {
    if (!span.textContent?.trim() && span.children.length === 0) {
      span.remove();
    }
  });

  // Unwrap spans with no attributes
  document.querySelectorAll("span").forEach((span) => {
    if (span.attributes.length === 0) {
      while (span.firstChild) {
        span.parentNode?.insertBefore(span.firstChild, span);
      }

      span.remove();
    }
  });

  // Unwrap font tags
  document.querySelectorAll("font").forEach((font) => {
    while (font.firstChild) {
      font.parentNode?.insertBefore(font.firstChild, font);
    }

    font.remove();
  });

  // Remove empty paragraphs
  document.querySelectorAll("p").forEach((el) => {
    if (!el.textContent?.trim() && el.children.length === 0) {
      el.remove();
    }
  });

  // Remove empty divs
  document.querySelectorAll("div").forEach((el) => {
    if (!el.textContent?.trim() && el.children.length === 0) {
      el.remove();
    }
  });

  // Remove empty headings
  document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((el) => {
    if (!el.textContent?.trim() && el.children.length === 0) {
      el.remove();
    }
  });

  // Remove empty formatting tags
  document.querySelectorAll("strong, b, em, i, u").forEach((el) => {
    if (!el.textContent?.trim() && el.children.length === 0) {
      el.remove();
    }
  });

  // Remove empty anchors
  document.querySelectorAll("a").forEach((a) => {
    if (!a.textContent?.trim() && !a.querySelector("img")) {
      a.remove();
    }
  });

  // Remove Word TOC bookmarks
  document.querySelectorAll("a[name]").forEach((a) => {
    const name = a.getAttribute("name");

    if (name && name.startsWith("_Toc")) {
      a.remove();
    }
  });

  // Normalize text nodes
  const textNodes: Text[] = [];

  const textWalker = document.createTreeWalker(document.body, SHOW_TEXT);

  while ((node = textWalker.nextNode())) {
    textNodes.push(node as Text);
  }

  textNodes.forEach((textNode) => {
    textNode.textContent =
      textNode.textContent
        ?.replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim() ?? "";
  });

  // Remove any remaining empty elements
  document.querySelectorAll("*").forEach((el) => {
    const exemptTags = ["img", "table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li"];

    if (exemptTags.includes(el.tagName.toLowerCase())) {
      return;
    }

    if (!el.textContent?.trim() && el.children.length === 0) {
      el.remove();
    }
  });

  // Merge adjacent text nodes
  document.body.normalize();
}
