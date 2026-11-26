import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewContent } from './getWebviewContent';
import { CUSTOM_EDITOR_VIEW_TYPE, ViewMode } from './constants';

export class JinyEditorProvider implements vscode.CustomTextEditorProvider {
  private static activePanel: { webviewPanel: vscode.WebviewPanel; mode: ViewMode } | undefined;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new JinyEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      CUSTOM_EDITOR_VIEW_TYPE,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    );
    return providerRegistration;
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const defaultMode = (vscode.workspace.getConfiguration('jinyMarkdown').get<string>('defaultMode') || 'split') as ViewMode;
    let currentMode = defaultMode;

    const docDir = vscode.Uri.file(path.dirname(document.uri.fsPath));
    const parentDir = vscode.Uri.file(path.resolve(path.dirname(document.uri.fsPath), '..'));
    const grandParentDir = vscode.Uri.file(path.resolve(path.dirname(document.uri.fsPath), '../..'));
    const workspaceRoots = vscode.workspace.workspaceFolders?.map(f => f.uri) || [];

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        docDir,
        parentDir,
        grandParentDir,
        ...workspaceRoots
      ]
    };

    JinyEditorProvider.activePanel = { webviewPanel, mode: currentMode };

    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        JinyEditorProvider.activePanel = { webviewPanel, mode: currentMode };
      }
    });

    webviewPanel.onDidDispose(() => {
      if (JinyEditorProvider.activePanel?.webviewPanel === webviewPanel) {
        JinyEditorProvider.activePanel = undefined;
      }
    });

    const getBaseUri = () => webviewPanel.webview.asWebviewUri(docDir).toString();

    // Handle incoming messages from the webview BEFORE setting HTML
    webviewPanel.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'ready':
          webviewPanel.webview.postMessage({
            type: 'init',
            text: document.getText(),
            baseUri: getBaseUri()
          });
          break;

        case 'updateText':
          this.updateTextDocument(document, message.text);
          break;
      }
    });

    // Synchronize changes made outside webview
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({
          type: 'update',
          text: document.getText(),
          baseUri: getBaseUri()
        });
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Set HTML with embedded initial content
    webviewPanel.webview.html = getWebviewContent(
      webviewPanel.webview,
      this.context.extensionUri,
      document
    );
  }

  private updateTextDocument(document: vscode.TextDocument, text: string) {
    if (document.getText() === text) {
      return;
    }

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );

    edit.replace(document.uri, fullRange, text);
    vscode.workspace.applyEdit(edit);
  }

  public static getActivePanel() {
    return this.activePanel;
  }
}
