import * as vscode from 'vscode';
import { clipboardHtmlFragment } from './paste-html.ts';

export const pasteHtmlKind = vscode.DocumentDropOrPasteEditKind.Empty.append(
  'text',
  'html',
  'htmlCleaner',
);

export const pasteHtmlProvider: vscode.DocumentPasteEditProvider = {
  async provideDocumentPasteEdits(_document, _ranges, dataTransfer, context, token) {
    if (
      context.triggerKind !== vscode.DocumentPasteTriggerKind.PasteAs ||
      context.only?.value !== pasteHtmlKind.value
    ) {
      return;
    }

    const item = dataTransfer.get('text/html');
    if (!item) {
      return;
    }

    try {
      const html = clipboardHtmlFragment(await item.asString());
      if (token.isCancellationRequested) {
        return;
      }

      if (!html.trim()) {
        throw new Error('The clipboard HTML fragment is empty.');
      }

      return [new vscode.DocumentPasteEdit(html, 'Paste as HTML', pasteHtmlKind)];
    } catch (error) {
      if (!token.isCancellationRequested) {
        void vscode.window.showErrorMessage(
          `Could not paste clipboard HTML: ${error instanceof Error ? error.message : String(error)}. Try pasting as plain text.`,
        );
      }
      return;
    }
  },
};
