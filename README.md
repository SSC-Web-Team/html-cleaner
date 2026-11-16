# html-cleaner README

This is the README for your extension "html-cleaner". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

### Paste from Word as HTML

1. Select and copy the content in Word
2. In VS Code, open an HTML file or set the editor's language mode to **HTML** (using the language indicator in the bottom-right corner). An unsaved HTML editor works too
3. Place the cursor where you want the HTML, or select the text to replace
4. Open the Command Palette with **Ctrl+Shift+P** (Windows/Linux) or **Cmd+Shift+P** (macOS), and run **HTML Cleaner: Paste Rich Text as HTML**. No Word file needs to be saved

The extension uses the HTML supplied by the clipboard. It also works with rich HTML copied from other applications.

The command needs HTML on the clipboard and the VS Code setting `editor.pasteAs.enabled` enabled (it is already enabled by default); if no HTML is available, nothing is inserted. Plain-text clipboard content can be pasted normally.

The pasted HTML can contain Word-specific styles and markup. Review the result, especially lists, images, tables and complex layouts: some Word formatting depends on styles or local image files that are not included in the pasted fragment. The extension cannot recover formatting if the source application or clipboard does not provide HTML. To clean the markup afterward, run **HTML Cleaner: Clean HTML** from the Command Palette and choose the language and platform. Review its output, since cleanup can change formatting.

Normal paste and your existing VS Code paste settings are unchanged.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
