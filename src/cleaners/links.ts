export function cleanLinks(document: Document): void {

	document.querySelectorAll('a').forEach(link => {

		link.removeAttribute('target');

		// Remove empty anchors
		if (
			link.attributes.length === 0 &&
			!link.textContent?.trim()
		) {
			link.remove();
		}
	});

	
}