import * as vscode from 'vscode';
import { JinyEditorProvider } from './JinyEditorProvider';
import { JinyPreviewPanel } from './JinyPreviewPanel';
import { COMMANDS, ViewMode, CUSTOM_EDITOR_VIEW_TYPE } from './constants';

export function activate(context: vscode.ExtensionContext) {
  console.log('Jiny Markdown extension is now active!');

  // 1. Register Custom Editor Provider
  context.subscriptions.push(JinyEditorProvider.register(context));

  // 2. Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = COMMANDS.OPEN_PREVIEW;
  statusBarItem.text = '$(book) Jiny MD Preview';
  statusBarItem.tooltip = 'Click to open Jiny Markdown Side Preview (Cmd+Option+M / Ctrl+Alt+M)';
  context.subscriptions.push(statusBarItem);

  const updateStatusBarVisibility = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      statusBarItem.show();
    } else if (JinyEditorProvider.getActivePanel() || JinyPreviewPanel.currentPanel) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBarVisibility)
  );
  updateStatusBarVisibility();

  // Helper function to dispatch mode change to active custom editor or side preview
  const setMode = (mode: ViewMode) => {
    statusBarItem.text = `$(book) Jiny MD: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const activeCustom = JinyEditorProvider.getActivePanel();
    if (activeCustom) {
      activeCustom.webviewPanel.webview.postMessage({ type: 'setMode', mode });
    }
    if (JinyPreviewPanel.currentPanel) {
      JinyPreviewPanel.currentPanel.setMode(mode);
    }
  };

  // 3. Register Commands
  // Command: Open Custom Editor
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.OPEN_EDITOR, async (uri?: vscode.Uri) => {
      let targetUri = uri;
      if (!targetUri && vscode.window.activeTextEditor) {
        targetUri = vscode.window.activeTextEditor.document.uri;
      }
      if (targetUri) {
        await vscode.commands.executeCommand(
          'vscode.openWith',
          targetUri,
          CUSTOM_EDITOR_VIEW_TYPE
        );
      } else {
        vscode.window.showInformationMessage('Please select or open a markdown file first.');
      }
    })
  );

  // Command: Open Side Preview (Cmd+Alt+M / Ctrl+Alt+M)
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.OPEN_PREVIEW, async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        JinyPreviewPanel.createOrShow(context.extensionUri, editor.document);
      } else {
        const activeCustom = JinyEditorProvider.getActivePanel();
        if (activeCustom) {
          activeCustom.webviewPanel.webview.postMessage({ type: 'toggleSplit' });
        } else {
          vscode.window.showInformationMessage('No active Markdown editor found.');
        }
      }
    })
  );

  // Command: Toggle Split Mode (Cmd+K M / Ctrl+K M)
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.TOGGLE_SPLIT, () => {
      const activeCustom = JinyEditorProvider.getActivePanel();
      if (activeCustom) {
        activeCustom.webviewPanel.webview.postMessage({ type: 'toggleSplit' });
      } else if (JinyPreviewPanel.currentPanel) {
        JinyPreviewPanel.currentPanel.toggleSplit();
      } else if (vscode.window.activeTextEditor) {
        JinyPreviewPanel.createOrShow(context.extensionUri, vscode.window.activeTextEditor.document);
      }
    })
  );

  // Mode Switch Commands
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.SET_MODE_CODE, () => {
      setMode(ViewMode.CODE);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.SET_MODE_SPLIT, () => {
      setMode(ViewMode.SPLIT);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.SET_MODE_PREVIEW, () => {
      setMode(ViewMode.PREVIEW);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.CYCLE_MODE, () => {
      const activeCustom = JinyEditorProvider.getActivePanel();
      if (activeCustom) {
        const nextMode =
          activeCustom.mode === ViewMode.SPLIT
            ? ViewMode.PREVIEW
            : activeCustom.mode === ViewMode.PREVIEW
            ? ViewMode.CODE
            : ViewMode.SPLIT;
        setMode(nextMode);
      } else if (JinyPreviewPanel.currentPanel) {
        JinyPreviewPanel.currentPanel.cycleMode();
      } else if (vscode.window.activeTextEditor) {
        JinyPreviewPanel.createOrShow(context.extensionUri, vscode.window.activeTextEditor.document);
      }
    })
  );
}

export function deactivate() {}
