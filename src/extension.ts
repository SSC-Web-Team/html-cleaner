import * as vscode from 'vscode';
import { cleanHtml, generateFootnotes, generateToc } from './index.ts';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('html-cleaner.cleanHtml', async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const language = await vscode.window.showQuickPick(
      [
        { label: 'English', value: 'en' as const },
        { label: 'French', value: 'fr' as const },
      ],
      { placeHolder: 'Select the language of this HTML' },
    );

    if (!language) {
      return;
    }

    const platform = await vscode.window.showQuickPick(
      [
        { label: 'MySSC+ / SG', value: 'myssc' as const },
        { label: 'Canada.ca', value: 'canada' as const },
      ],
      { placeHolder: 'Select the platform for this HTML' },
    );

    if (!platform) {
      return;
    }

    const { document } = editor;
    const html = document.getText();
    const cleaned = cleanHtml(html, language.value, platform.value);
    const range = new vscode.Range(document.positionAt(0), document.positionAt(html.length));

    const success = await editor.edit((editBuilder) => {
      editBuilder.replace(range, cleaned);
    });

    if (success) {
      vscode.window.showInformationMessage('HTML cleaned successfully.');
    }
  });

  const tocDisposable = vscode.commands.registerCommand('html-cleaner.generateToc', async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const language = await vscode.window.showQuickPick(
      [
        { label: 'English', value: 'en' as const },
        { label: 'French', value: 'fr' as const },
      ],
      { placeHolder: 'Select the language of the table of contents' },
    );

    if (!language) {
      return;
    }

    const platform = await vscode.window.showQuickPick(
      [
        { label: 'MySSC+ / SG', value: 'myssc' as const },
        { label: 'Canada.ca', value: 'canada' as const },
      ],
      { placeHolder: 'Select the platform for this table of contents' },
    );

    if (!platform) {
      return;
    }

    const { document } = editor;
    const html = document.getText();
    const result = generateToc(html, language.value, platform.value);
    const range = new vscode.Range(document.positionAt(0), document.positionAt(html.length));

    const success = await editor.edit((editBuilder) => {
      editBuilder.replace(range, result);
    });

    if (success) {
      vscode.window.showInformationMessage('Table of contents generated successfully.');
    }
  });

  const footnotesDisposable = vscode.commands.registerCommand(
    'html-cleaner.generateFootnotes',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      const language = await vscode.window.showQuickPick(
        [
          { label: 'English', value: 'en' as const },
          { label: 'French', value: 'fr' as const },
        ],
        { placeHolder: 'Select the language of the footnotes' },
      );

      if (!language) {
        return;
      }

      const platform = await vscode.window.showQuickPick(
        [
          { label: 'MySSC+ / SG', value: 'myssc' as const },
          { label: 'Canada.ca', value: 'canada' as const },
        ],
        { placeHolder: 'Select the platform for these footnotes' },
      );

      if (!platform) {
        return;
      }

      const { document } = editor;
      const html = document.getText();
      const result = generateFootnotes(html, language.value, platform.value);

      if (result === null) {
        vscode.window.showWarningMessage('No footnotes found. Each footnote needs a reference in the text that links to it.');
        return;
      }

      const range = new vscode.Range(document.positionAt(0), document.positionAt(html.length));
      const success = await editor.edit((editBuilder) => {
        editBuilder.replace(range, result);
      });

      if (success) {
        vscode.window.showInformationMessage('Footnotes generated successfully.');
      }
    },
  );

  context.subscriptions.push(disposable, tocDisposable, footnotesDisposable);
}

export function deactivate() {}
