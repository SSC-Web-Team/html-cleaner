# HTML Cleaner

VS Code extension for cleaning, formatting, and validating HTML code with specialized support for Word-pasted content and bilingual (English/French) document processing. The extension is optimized for MySSC+, Serving Government and Canada.ca.

## Install the extension from a VSIX file

1. Download or save the HTML Cleaner extension package (`.vsix` file) to an easily accessible location, such as your Downloads folder. Do not unzip it.
2. Open Visual Studio Code.
3. Select the **Extensions** icon in the left-side Activity Bar (four small squares).
4. Select the **...** menu at the top of the Extensions view.
5. Select **Install from VSIX...**.
6. Select the `.vsix` file you saved in step 1, then select **Install**.
7. When VS Code prompts you to reload, select **Reload**.

The HTML Cleaner commands are ready after VS Code reloads.

## Use HTML Cleaner

1. Open an HTML file in VS Code, or create a new file and paste in your HTML.
2. Save a copy before running if you need to preserve the original.
3. Press `Ctrl+Shift+P` on Windows or Linux, or `Cmd+Shift+P` on macOS to open the Command Palette.
4. Start typing `HTML Cleaner` and choose the command you need from the list below:

| Command                                           | Description                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **HTML Cleaner: Paste Rich Text as HTML**         | Paste formatted content from Microsoft Word directly into VS Code as clean HTML.                  |
| **HTML Cleaner: Clean HTML**                      | Comprehensive HTML cleanup and formatting with platform-specific options.                         |
| **HTML Cleaner: Review EN-FR words**              | Review, skip, or correct words flagged as potentially foreign and add language attributes.        |
| **HTML Cleaner: Generate TOC**                    | Automatically generate a Table of Contents from heading elements.                                 |
| **HTML Cleaner: Generate Footnotes**              | Automatically generate footnotes from marked references.                                          |
| **HTML Cleaner: Validate HTML (Nu HTML Checker)** | Comprehensive HTML validation using the [Nu HTML Checker](https://validator.w3.org/nu/#textarea). |

**Note:** Commands replace the contents of the active editor. Use **Edit: Undo** (`Ctrl+Z` or `Cmd+Z`) immediately if a result is not what you expected.

## Requirements

- VS Code 1.125.0 or later
- For the **Paste Rich Text as HTML** feature: `editor.pasteAs.enabled` setting (enabled by default)

## Extension Settings

This extension works with standard VS Code settings:

- `editor.pasteAs.enabled` - Enable/disable paste-as functionality

## Tips

- **For best results with Word content:** Copy complete sections or tables from Word, not individual words.
- **Review before finalizing:** Always review the cleaned output, as complex layouts may require manual adjustments.
- **Bilingual support:** Use the "Review EN-FR words" feature to ensure consistency in English-French documents.
- **Validation:** Run HTML validation after major edits to catch potential issues early.

## How to create a VSIX package from this project

Use these steps if you have the source code rather than a pre-built `.vsix` file. This requires a current [Node.js LTS](https://nodejs.org/) installation.

### Prerequisites

- Node.js LTS or later
- npm (included with Node.js)

### Steps

1. Open a terminal in the project folder.
2. Install project dependencies:

   ```bash
   npm install
   ```

3. Compile the TypeScript source code:

   ```bash
   npm run vscode:prepublish
   ```

4. Install the VSIX packaging tool:

   ```bash
   npm install -g @vscode/vsce
   ```

5. Create the installable package:

   ```bash
   vsce package
   ```

6. The newly created `.vsix` file will be saved in the project root directory (e.g., `html-cleaner-1.0.0.vsix`).

7. Follow the instructions in [Install the extension from a VSIX file](#install-the-extension-from-a-vsix-file) to install the extension.

## Test changes during development

### Quick integration testing (Extension Development Host)

To test an edited copy without creating a VSIX package:

1. Open this project folder in VS Code.
2. Press `F5`.
3. A new **Extension Development Host** window opens.
4. In that new window, open an HTML file and use the HTML Cleaner commands.

Close the Extension Development Host window to stop the development session.

### Unit testing with Vitest

Run the project's unit tests to verify changes:

**Run all tests:**

```bash
npm run test:vitest
```

**Run tests in watch mode** (automatically re-run when files change):

```bash
npm run test:vitest -- --watch
```

**Run a specific test file:**

```bash
npm run test:vitest -- src/cleaners/attributes.test.ts
```

**Run tests matching a pattern:**

```bash
npm run test:vitest -- --grep "clean"
```

Test files are located in `src/` alongside their corresponding source files (e.g., `attributes.test.ts`).

### Full validation before packaging

Before creating a VSIX package, run the complete validation suite:

```bash
npm run lint       # Check code with oxlint
npm run fmt:check  # Verify formatting with oxfmt
npm run test:vitest # Run all unit tests
npm run compile    # Compile TypeScript
```

Or use the pre-configured test command:

```bash
npm run pretest
```

This runs linting, formatting checks, and compilation automatically before testing.

## Uninstall

1. Open the **Extensions** view in VS Code.
2. Search for **HTML Cleaner**.
3. Select the gear icon beside the extension and select **Uninstall**.
4. Reload VS Code when prompted.

## Troubleshooting

- **"Install from VSIX..." is missing:** Open the Extensions view first, then select its **...** menu rather than the main VS Code menu.
- **No HTML Cleaner commands appear:** Reload VS Code, then confirm the extension is enabled in the Extensions view.
- **A command changes the wrong content:** HTML Cleaner always works on the currently active editor tab. Click the intended HTML document first.

## Release Notes

### 1.0.0

Initial release with comprehensive HTML cleaning and formatting capabilities:

- Paste Rich Text as HTML from Word and other applications
- Clean and format HTML markup
- Bilingual spell checking (English/French)
- Table of Contents generation
- Footnotes generation
- HTML validation using Nu Checker

## About

Developed by **SSC-Web-Team** for web content management and HTML document processing.

---

**Enjoy cleaner HTML!** ✨
