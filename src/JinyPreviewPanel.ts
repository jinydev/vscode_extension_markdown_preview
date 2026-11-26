import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewContent } from './getWebviewContent';
import { ViewMode } from './constants';

export class JinyPreviewPanel {
  public static currentPanel: JinyPreviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private document: vscode.TextDocument;
  private disposables: vscode.Disposable[] = [];
  private currentMode: ViewMode = ViewMode.SPLIT;

  public static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (JinyPreviewPanel.currentPanel) {
      JinyPreviewPanel.currentPanel.document = document;
      JinyPreviewPanel.currentPanel.panel.reveal(column);
      JinyPreviewPanel.currentPanel.update();
      return JinyPreviewPanel.currentPanel;
    }

    const docDir = vscode.Uri.file(path.dirname(document.uri.fsPath));
    const parentDir = vscode.Uri.file(path.resolve(path.dirname(document.uri.fsPath), '..'));
    const grandParentDir = vscode.Uri.file(path.resolve(path.dirname(document.uri.fsPath), '../..'));
    const workspaceRoots = vscode.workspace.workspaceFolders?.map(f => f.uri) || [];

    const panel = vscode.window.createWebviewPanel(
      'jinyMarkdown.preview',
      `Preview: ${document.fileName.split('/').pop()}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
          vscode.Uri.joinPath(extensionUri, 'media'),
          docDir,
          parentDir,
          grandParentDir,
          ...workspaceRoots
        ]
      }
    );

    JinyPreviewPanel.currentPanel = new JinyPreviewPanel(panel, extensionUri, document);
    return JinyPreviewPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document: vscode.TextDocument
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.document = document;

    const defaultMode = (vscode.workspace.getConfiguration('jinyMarkdown').get<string>('defaultMode') || 'split') as ViewMode;
    this.currentMode = defaultMode;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Register message handler BEFORE assigning HTML
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'ready':
            this.update();
            break;
          case 'updateText':
            this.updateTextDocument(message.text);
            break;
        }
      },
      null,
      this.disposables
    );

    // Track active text editor document changes
    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === this.document.uri.toString()) {
          this.update();
        }
      },
      null,
      this.disposables
    );

    // Track scroll in active editor and scroll the preview
    vscode.window.onDidChangeTextEditorVisibleRanges(
      (e) => {
        if (e.textEditor.document.uri.toString() === this.document.uri.toString()) {
          const firstVisibleLine = e.visibleRanges[0]?.start.line;
          if (firstVisibleLine !== undefined) {
            this.panel.webview.postMessage({
              type: 'scrollToLine',
              line: firstVisibleLine + 1
            });
          }
        }
      },
      null,
      this.disposables
    );

    // Set HTML with embedded initial content
    this.panel.webview.html = getWebviewContent(
      this.panel.webview,
      this.extensionUri,
      this.document
    );

    // Trigger immediate update
    this.update();
  }

  public setMode(mode: ViewMode) {
    this.currentMode = mode;
    this.panel.webview.postMessage({
      type: 'setMode',
      mode
    });
  }

  public toggleSplit() {
    this.panel.webview.postMessage({
      type: 'toggleSplit'
    });
  }

  public cycleMode() {
    const nextMode =
      this.currentMode === ViewMode.SPLIT
        ? ViewMode.PREVIEW
        : this.currentMode === ViewMode.PREVIEW
        ? ViewMode.CODE
        : ViewMode.SPLIT;
    this.setMode(nextMode);
  }

  public update() {
    const docDir = path.dirname(this.document.uri.fsPath);
    const baseUri = this.panel.webview.asWebviewUri(vscode.Uri.file(docDir)).toString();

    this.panel.webview.postMessage({
      type: 'update',
      text: this.document.getText(),
      baseUri
    });
  }

  private updateTextDocument(text: string) {
    if (this.document.getText() === text) {
      return;
    }

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      this.document.positionAt(0),
      this.document.positionAt(this.document.getText().length)
    );

    edit.replace(this.document.uri, fullRange, text);
    vscode.workspace.applyEdit(edit);
  }

  public dispose() {
    JinyPreviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
