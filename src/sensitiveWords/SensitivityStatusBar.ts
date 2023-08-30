import * as vscode from 'vscode';

class SensitivityStatusBar {
  private statusBar: vscode.StatusBarItem; // 状态栏
  private mintCount: { [key: string]: number } = {}; // 记录文件敏感词数量

  constructor(private fileStates: { [key: string]: boolean }) {
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.setStatusbar("default");
    this.statusBar.show();
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!editor) {
        return;
      }
      if (this.mintCount[editor.document.fileName] && this.fileStates[editor.document.fileName]) {
        this.setStatusbar("listening", this.mintCount[editor.document.fileName]);
      } else {
        this.setStatusbar("default");
      }
    });
  }

  public setStatusbar(type: string, count?: number): void {
    if (type === "default") {
      this.statusBar.command = 'cec-ide.mark-sensitive-words';
      this.statusBar.text = `$(cec-ide-line) 敏感词检测`;
      this.statusBar.tooltip = '点击进行敏感词检测';
    } else if (type === "listening") {
      this.statusBar.text = `$(cec-ide-line) 检测到 ${count} 敏感词`;
      this.statusBar.tooltip = '点击停止检测';
      this.statusBar.command = 'cec-ide.stop-mark-sensitive-words';
    }
  }

  public setMintCount(document: vscode.TextDocument, count: number): void {
    this.mintCount[document.fileName] = count;
  }

  public getMintCount(document: vscode.TextDocument): number {
    return this.mintCount[document.fileName];
  }
}

export default SensitivityStatusBar;
