export function cleanTables(document: Document): void {

	document.querySelectorAll('table').forEach(table => {

		table.removeAttribute('width');
		table.removeAttribute('border');
		table.removeAttribute('cellpadding');
		table.removeAttribute('cellspacing');

		if (!table.classList.contains('table')) {
			table.classList.add('table');
		}

		if (!table.classList.contains('table-bordered')) {
			table.classList.add('table-bordered');
		}
	});
}
