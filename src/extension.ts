import * as vscode from 'vscode';
import { cleanHtml } from './index.ts';
import { getEmphasisOccurrences, type EmphasisAction } from './cleaners/emphasis.ts';

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
    const emphasisOccurrences = getEmphasisOccurrences(cleaned);
    const emphasisActions: EmphasisAction[] = [];
    const range = new vscode.Range(document.positionAt(0), document.positionAt(html.length));

    if (emphasisOccurrences.length > 0) {
      const applied = await editor.edit((editBuilder) => {
        editBuilder.replace(range, cleaned);
      });

      if (!applied) {
        vscode.window.showErrorMessage('Unable to apply HTML cleanup before reviewing emphasis tags.');
        return;
      }
    }

    const cleanedVersion = document.version;

    for (const [index, emphasis] of emphasisOccurrences.entries()) {
      if (document.version !== cleanedVersion || document.getText() !== cleaned) {
        vscode.window.showWarningMessage(
          'The document changed while reviewing emphasis tags. HTML cleanup was not completed.',
        );
        return;
      }

      const selection = new vscode.Range(
        document.positionAt(emphasis.start),
        document.positionAt(emphasis.end),
      );
      editor.selection = new vscode.Selection(selection.start, selection.end);
      editor.revealRange(selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

      const text = emphasis.text;
      const preview = text.length > 80 ? `${text.slice(0, 77)}...` : text;
      const action = await vscode.window.showQuickPick(
        [
          { label: 'Update to <i>', value: 'i' as const },
          { label: 'Update to <cite>', value: 'cite' as const },
          { label: 'Update to <strong>', value: 'strong' as const },
          { label: 'Unwrap', value: 'unwrap' as const },
        ],
        {
          placeHolder: `Choose what to do with: ${preview || '(empty emphasis)'}`,
          title: `Emphasis ${index + 1} of ${emphasisOccurrences.length}`,
        },
      );

      if (!action) {
        if (document.version === cleanedVersion && document.getText() === cleaned) {
          const currentRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(cleaned.length),
          );
          const restored = await editor.edit((editBuilder) => {
            editBuilder.replace(currentRange, html);
          });

          if (!restored) {
            vscode.window.showErrorMessage('Unable to restore the document after cancelling.');
            return;
          }
        }

        return;
      }

      emphasisActions.push(action.value);
    }

    if (
      emphasisOccurrences.length > 0 &&
      (document.version !== cleanedVersion || document.getText() !== cleaned)
    ) {
      vscode.window.showWarningMessage(
        'The document changed while reviewing emphasis tags. HTML cleanup was not completed.',
      );
      return;
    }

    const finalHtml = cleanHtml(html, language.value, platform.value, emphasisActions);
    const finalRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length),
    );

    const success = await editor.edit((editBuilder) => {
      editBuilder.replace(finalRange, finalHtml);
    });

    if (success) {
      vscode.window.showInformationMessage('HTML cleaned successfully.');
    } else {
      vscode.window.showErrorMessage('Unable to apply the completed HTML cleanup.');
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
