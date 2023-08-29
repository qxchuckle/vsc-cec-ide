import * as vscode from 'vscode';
import Mint from 'mint-filter';
import * as path from 'path';
import * as fs from 'fs';
import { encrypt, decrypt } from './utils/EncryptionAndDecryption';
let statusBar: vscode.StatusBarItem; // 状态栏

const documentListeners: { [key: string]: vscode.Disposable } = {}; // 记录文件监听器
const fileStates: { [key: string]: boolean } = {}; // 记录文件状态

export function sensitiveWordDetectionInit(context: vscode.ExtensionContext,) {
  fs.readFile(path.join(context.extensionPath, 'resource', 'text', 'SensitiveWordsEncryption.txt'), 'utf-8', (err, data) => {
    if (err) {
      console.error(err);
      vscode.window.showErrorMessage('敏感词检测出错！');
      return;
    }

    // 解密
    const password = 'chuckle';
    const decryptedText = decrypt(data, password);

    let sensitiveWordsArray = decryptedText.split('\n').map((word: string) => word.trim());
    const mint = new Mint(sensitiveWordsArray);

    const markCommand = vscode.commands.registerCommand('cec-ide.mark-sensitive-words', () => {
      const editor = vscode.window.activeTextEditor;
      if( editor && fileStates[editor.document.fileName]){
        return; // 已经检测种的文件不重复进行检测
      }
      if (editor && mint) {
        activateDocumentChangeListener(editor.document, mint); // 注册文档更改监听器
        checkForSensitiveWords(editor, mint);
        fileStates[editor.document.fileName] = true; // 记录文件状态为已检测
      } else {
        vscode.window.showErrorMessage('没有活动的文本编辑器。');
      }
    });
    const stopmarkCommand = vscode.commands.registerCommand('cec-ide.stop-mark-sensitive-words', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        stopSensitiveWordDetection(editor.document)
      }
    })

    // 创建状态栏项
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(cec-ide-line) CEC-IDE'; // 默认状态
    statusBar.command = 'cec-ide.mark-sensitive-words'; // 点击状态栏时触发命令
    statusBar.tooltip = '点击开始CEC敏感词检测';
    statusBar.show();

    // 取消文档更改事件的监听
    vscode.workspace.onDidCloseTextDocument(closedDocument => {
      if (documentListeners[closedDocument.fileName]) {
        delete fileStates[closedDocument.fileName];
        documentListeners[closedDocument.fileName].dispose();
        delete documentListeners[closedDocument.fileName];
        diagnosticCollection.delete(closedDocument.uri);
      }
    });

    context.subscriptions.push(markCommand, stopmarkCommand, statusBar);
  });
}

function activateDocumentChangeListener(document: vscode.TextDocument, mint: Mint) {
  if (!documentListeners[document.fileName]) {
    const listener = vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === document && mint) {
        statusBar.text = '$(cec-ide-line) 监听中';
        statusBar.tooltip = '点击停止监听'
        statusBar.command = 'cec-ide.stop-mark-sensitive-words'
        checkForSensitiveWords(editor, mint);
      }
    });
    documentListeners[document.fileName] = listener;
  }
}

const diagnosticCollection = vscode.languages.createDiagnosticCollection('sensitiveWords');

export function checkForSensitiveWords(editor: vscode.TextEditor, mint: Mint) {
  const document = editor.document;
  const text = document.getText();
  const sensitiveWords = new Set(mint.filter(text).words); // 使用 Set 来存储唯一的敏感词
  const diagnostics: vscode.Diagnostic[] = [];

  for (const word of sensitiveWords) {
    const wordRegExp = new RegExp(word, 'gi');
    let match;

    while ((match = wordRegExp.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + word.length);
      const range = new vscode.Range(startPos, endPos);

      const diagnostic = new vscode.Diagnostic(range, '敏感词', vscode.DiagnosticSeverity.Warning);
      diagnostic.source = '敏感词检测';
      diagnostic.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), `${word}`)
      ];

      diagnostics.push(diagnostic);
      statusBar.text = `$(cec-ide-line) 监听到${diagnostics.length}敏感词`;
      statusBar.tooltip = '点击停止监听'
      statusBar.command = 'cec-ide.stop-mark-sensitive-words'
    }
  }

  diagnosticCollection.delete(document.uri);

  if (diagnostics.length > 0) {
    diagnosticCollection.set(document.uri, diagnostics);
    if (!fileStates[editor.document.fileName]) {
      const stopAction: vscode.MessageItem = { title: '停止检测' };
      vscode.window.showInformationMessage(
          `开始检测${path.basename(document.fileName)}，共有${diagnostics.length}个敏感词。`,
          stopAction
        )
        .then((selectedAction) => {
          if (selectedAction === stopAction) {
            stopSensitiveWordDetection(editor.document);
          }
        });
    }
  } else {
    vscode.window.showInformationMessage(`${path.basename(document.fileName)}中已没有敏感词，停止检测。`);
    delete fileStates[document.fileName];
    documentListeners[document.fileName].dispose();
    delete documentListeners[document.fileName];
  }
}

function stopSensitiveWordDetection(document: vscode.TextDocument){
  statusBar.text = '$(cec-ide-line) 停止监听...'; // 更新状态栏消息
  statusBar.tooltip = 'CEC自主研发'
  statusBar.command = undefined;
  setTimeout(() => {
    statusBar.text = '$(cec-ide-line) CEC-IDE'; // 回到默认状态
    statusBar.command = 'cec-ide.mark-sensitive-words';
  },2000)
  if (fileStates[document.fileName]) {
    delete fileStates[document.fileName];
    if (documentListeners[document.fileName]) {
      documentListeners[document.fileName].dispose();
      delete documentListeners[document.fileName];
    }
    diagnosticCollection.delete(document.uri);
    vscode.window.showInformationMessage(`已停止检测敏感词。`);
  }
}
