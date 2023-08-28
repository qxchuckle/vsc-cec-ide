import * as vscode from 'vscode';
import Mint from 'mint-filter';
import * as path from 'path';
import * as fs from 'fs';
import { encrypt, decrypt } from './utils/EncryptionAndDecryption';

const documentListeners: { [key: string]: vscode.Disposable } = {}; // 记录文件监听器
const fileStates: { [key: string]: boolean } = {}; // 记录文件状态

export function sensitiveWordDetectionInit(context: vscode.ExtensionContext) {
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
      if (editor && mint) {
        activateDocumentChangeListener(editor.document); // 注册文档更改监听器
        checkForSensitiveWords(editor, mint);
        fileStates[editor.document.fileName] = true; // 记录文件状态为已检测
      } else {
        vscode.window.showErrorMessage('没有活动的文本编辑器。');
      }
    });

    function activateDocumentChangeListener(document: vscode.TextDocument) {
      if (!documentListeners[document.fileName]) {
        const listener = vscode.workspace.onDidChangeTextDocument(event => {
          const editor = vscode.window.activeTextEditor;
          if (editor && editor.document === document && mint) {
            checkForSensitiveWords(editor, mint);
          }
        });
        documentListeners[document.fileName] = listener;
      }
    }

    // 取消文档更改事件的监听
    vscode.workspace.onDidCloseTextDocument(closedDocument => {
      if (documentListeners[closedDocument.fileName]) {
        documentListeners[closedDocument.fileName].dispose();
        delete documentListeners[closedDocument.fileName];
        delete fileStates[closedDocument.fileName];
        diagnosticCollection.delete(closedDocument.uri);
      }
    });

    context.subscriptions.push(markCommand);
  });
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
        new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), '这个词涉及了色情、政治、暴力等内容')
      ];

      diagnostics.push(diagnostic);
    }
  }

  diagnosticCollection.delete(document.uri);

  if (diagnostics.length > 0) {
    diagnosticCollection.set(document.uri, diagnostics);
    if (!fileStates[editor.document.fileName]) {
      vscode.window.showInformationMessage(`开始检测，共有${diagnostics.length}个敏感词。`);
    }
  } else {
    if (documentListeners[document.fileName]) {
      vscode.window.showInformationMessage(`${document.fileName}中已经没有敏感词，停止检测。`);
    } else {
      vscode.window.showInformationMessage(`${document.fileName}中没有敏感词。`);
    }
    documentListeners[document.fileName].dispose();
    delete documentListeners[document.fileName];
    delete fileStates[document.fileName];
  }
}

