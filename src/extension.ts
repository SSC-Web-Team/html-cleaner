import * as vscode from 'vscode';
import { cleanHtml } from './index.ts';
import { validateHtml } from './validator/nu-validator.ts';

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

  context.subscriptions.push(disposable, validate, diagnostics);
}

export function deactivate() {}
