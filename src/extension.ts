import * as vscode from "vscode";
import { cleanHtml } from "./index.ts";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("html-cleaner.cleanHtml", async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { document } = editor;
    const html = document.getText();
    const cleaned = cleanHtml(html);
    const range = new vscode.Range(document.positionAt(0), document.positionAt(html.length));

    const success = await editor.edit((editBuilder) => {
      editBuilder.replace(range, cleaned);
    });

    if (success) {
      try {
        await vscode.commands.executeCommand("editor.action.formatDocument");
      } catch (error) {
        vscode.window.showErrorMessage("Unable to format the cleaned HTML.");
      }

      vscode.window.showInformationMessage("HTML cleaned successfully.");
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
