import * as vscode from 'vscode';
import * as path from 'path';

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  document: vscode.TextDocument
): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css'));
  const katexCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'katex.min.css'));
  const nonce = getNonce();

  const docDir = vscode.Uri.file(path.dirname(document.uri.fsPath));
  const baseUri = webview.asWebviewUri(docDir).toString();
  const text = document.getText();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; img-src ${webview.cspSource} https: http: data: blob: vscode-webview:; font-src ${webview.cspSource} data:;">
  <link rel="stylesheet" href="${katexCssUri}">
  <link rel="stylesheet" href="${styleUri}">
  <title>Jiny Markdown Preview</title>
</head>
<body>
  <div id="app" class="pure-preview-app">
    <main id="preview-scroll" class="preview-scroll-container">
      <div id="preview-gutter" class="preview-gutter"></div>
      <article id="preview-content" class="preview-content" contenteditable="true" spellcheck="false"></article>
    </main>
  </div>

  <script nonce="${nonce}">
    window.__INITIAL_TEXT__ = ${JSON.stringify(text)};
    window.__INITIAL_BASE_URI__ = ${JSON.stringify(baseUri)};
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
