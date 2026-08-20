import { JSDOM } from 'jsdom';

import { cleanFormatting } from './formatting';
import { cleanLinks } from './links';
import { cleanTables } from './tables';
import { cleanLists } from './lists';

export function cleanHtml(html: string): string {

	// Simple text-based cleanup
	html = html.trim();

	// Parse HTML
	const dom = new JSDOM(html);
	const document = dom.window.document;
    

	// Run cleanup modules
	cleanFormatting(document);
	cleanLinks(document);
	cleanTables(document);
	cleanLists(document);

    const result = document.body.innerHTML;

console.log(result);

return result;

   
}