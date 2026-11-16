import * as assert from 'node:assert/strict';
import { setup, suite, test } from 'mocha';
import * as vscode from 'vscode';
import { pasteHtmlKind, pasteHtmlProvider } from './paste-provider.ts';

suite('Rich HTML paste', () => {
  let document: vscode.TextDocument;
  const automatic: vscode.DocumentPasteEditContext = {
    triggerKind: vscode.DocumentPasteTriggerKind.Automatic,
    only: undefined,
  };
  const pasteAs: vscode.DocumentPasteEditContext = {
    triggerKind: vscode.DocumentPasteTriggerKind.PasteAs,
    only: pasteHtmlKind,
  };
  const ranges = [new vscode.Range(0, 0, 0, 0)];
  const token = new vscode.CancellationTokenSource().token;

  setup(async () => {
    document = await vscode.workspace.openTextDocument({ language: 'html', content: '' });
  });

  test('registers the paste command', async () => {
    const extension = vscode.extensions.all.find(
      (candidate) => candidate.packageJSON.name === 'html-cleaner',
    );
    assert.ok(extension);
    await extension.activate();
    assert.equal(extension.isActive, true);
  });

  test('command requests the HTML paste kind', async () => {
    const extension = vscode.extensions.all.find(
      (candidate) => candidate.packageJSON.name === 'html-cleaner',
    );
    assert.ok(extension);
    await extension.activate();

    const original = Object.getOwnPropertyDescriptor(vscode.commands, 'executeCommand');
    assert.ok(original);
    const executeCommand = vscode.commands.executeCommand;
    const calls: unknown[][] = [];

    try {
      await vscode.window.showTextDocument(document);
      Object.defineProperty(vscode.commands, 'executeCommand', {
        ...original,
        value: async (...args: unknown[]) => {
          calls.push(args);
        },
      });
      await executeCommand('html-cleaner.pasteRichTextAsHtml');
      assert.deepEqual(calls, [['editor.action.pasteAs', { kind: pasteHtmlKind.value }]]);
    } finally {
      Object.defineProperty(vscode.commands, 'executeCommand', original);
    }
  });

  test('provides the selected HTML fragment for the command', async () => {
    const data = new vscode.DataTransfer();
    data.set(
      'text/html',
      new vscode.DataTransferItem(
        '<html><body><!--StartFragment--><p>Hello <b>Word</b></p><!--EndFragment--></body></html>',
      ),
    );
    data.set('text/plain', new vscode.DataTransferItem('Hello Word'));

    const edits = await pasteHtmlProvider.provideDocumentPasteEdits!(
      document,
      ranges,
      data,
      pasteAs,
      token,
    );

    assert.equal(edits?.length, 1);
    assert.equal(edits[0].insertText, '<p>Hello <b>Word</b></p>');
    assert.equal(edits[0].kind.value, pasteHtmlKind.value);
  });

  test('does not replace a plain-text paste', async () => {
    const data = new vscode.DataTransfer();
    data.set('text/plain', new vscode.DataTransferItem('plain text'));

    const edits = await pasteHtmlProvider.provideDocumentPasteEdits!(
      document,
      ranges,
      data,
      pasteAs,
      token,
    );
    assert.equal(edits, undefined);
  });

  test('does not interfere with normal paste or the generic Paste As menu', async () => {
    const data = new vscode.DataTransfer();
    data.set('text/html', new vscode.DataTransferItem('<p>Word</p>'));

    for (const context of [
      automatic,
      { triggerKind: vscode.DocumentPasteTriggerKind.PasteAs, only: undefined },
    ]) {
      const edits = await pasteHtmlProvider.provideDocumentPasteEdits!(
        document,
        ranges,
        data,
        context,
        token,
      );
      assert.equal(edits, undefined);
    }
  });

  test('does not return an edit after cancellation', async () => {
    const data = new vscode.DataTransfer();
    data.set('text/html', new vscode.DataTransferItem('<p>Word</p>'));
    const source = new vscode.CancellationTokenSource();
    source.cancel();

    try {
      const edits = await pasteHtmlProvider.provideDocumentPasteEdits!(
        document,
        ranges,
        data,
        pasteAs,
        source.token,
      );
      assert.equal(edits, undefined);
    } finally {
      source.dispose();
    }
  });
});
