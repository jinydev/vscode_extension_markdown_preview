import * as vscode from 'vscode';

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  documentUri?: vscode.Uri
): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css'));
  const katexCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'katex.min.css'));
  const nonce = getNonce();

  let baseTag = '';
  if (documentUri) {
    const docDir = vscode.Uri.joinPath(documentUri, '..');
    const baseUri = webview.asWebviewUri(docDir).toString();
    baseTag = `<base href="${baseUri}/">`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: http: data: blob: vscode-webview:; font-src ${webview.cspSource};">
  ${baseTag}
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
