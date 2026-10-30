import * as vscode from 'vscode';
import { cleanHtml, generateFootnotes, generateToc } from './index.ts';
import { validateHtml } from './validator/nu-validator.ts';
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

  const diagnostics = vscode.languages.createDiagnosticCollection('html-cleaner-nu');

  const validate = vscode.commands.registerCommand('html-cleaner.validateHtml', async () => {
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

    const { document } = editor;

    try {
      const messages = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Validating with the Nu HTML Checker…',
        },
        () => validateHtml(document.getText(), language.value),
      );

      const found = messages
        .filter((m) => m.type === 'error' || m.type === 'info')
        .map((m) => {
          const line = Math.min((m.line ?? 1) - 1, document.lineCount - 1);
          const start = Math.max((m.column ?? 1) - 1, 0);
          const end = Math.max(m.endColumn ?? start + 1, start + 1);
          const severity =
            m.type === 'error'
              ? vscode.DiagnosticSeverity.Error
              : m.subType === 'warning'
                ? vscode.DiagnosticSeverity.Warning
                : vscode.DiagnosticSeverity.Information;
          const diagnostic = new vscode.Diagnostic(
            new vscode.Range(line, start, line, end),
            m.message,
            severity,
          );
          diagnostic.source = 'Nu HTML Checker';
          return diagnostic;
        });

      diagnostics.set(document.uri, found);
      vscode.window.showInformationMessage(
        found.length === 0
          ? 'Nu HTML Checker: no issues found.'
          : `Nu HTML Checker: ${found.length} message(s) found. See the Problems panel: Windows: \`Ctrl+Shift+M\` / macOS: \`Cmd+Shift+M\`.`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Nu HTML Checker failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  context.subscriptions.push(disposable, tocDisposable, footnotesDisposable, validate, diagnostics);
}

export function deactivate() {}
