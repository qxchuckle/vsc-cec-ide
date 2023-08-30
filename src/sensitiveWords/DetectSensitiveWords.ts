import * as vscode from 'vscode';
import * as path from 'path';
import { Mint } from 'mint-filter';
import { decrypt } from '../utils/EncryptionAndDecryption';
import SensitivityStatusBar from './SensitivityStatusBar';
import { createCodeActionProvider } from './CodeActionProvider';

// 创建一个诊断集合对象
const diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('sensitiveWords');
// 记录文件监听器
const documentListeners: { [key: string]: vscode.Disposable } = {};
// 记录文件状态
const fileStates: { [key: string]: boolean } = {};
// 初始化敏感词状态栏
const statusBar = new SensitivityStatusBar(fileStates);

export const PASSWORD = 'chuckle';
export const mint = { value: null } as unknown as ref<Mint>;
const isDetectingSensitiveWords = { value: false } as unknown as ref<boolean>;

export function detectSensitiveWords(context: vscode.ExtensionContext) {
  const markCommand = vscode.commands.registerCommand('cec-ide.mark-sensitive-words', () => {
    markSensitiveWords(mint);
  });
  const stopCommand = vscode.commands.registerCommand('cec-ide.stop-mark-sensitive-words', () => {
    stopMarkSensitiveWords();
  });
  context.subscriptions.push(markCommand, stopCommand);

  // 注册 CodeActionProvider，指定诊断来源
  const codeActionProvider = createCodeActionProvider('敏感词检测', diagnosticCollection);
  context.subscriptions.push(codeActionProvider);

  // 取消文档更改事件的监听
  vscode.workspace.onDidCloseTextDocument(closedDocument => {
    cleanUpDocument(closedDocument, () => {
      statusBar.setStatusbar("default");
      diagnosticCollection.delete(closedDocument.uri);
    });
  });
}

// 获取敏感词
export function initializeSensitiveWords(data: string, password: string) {
  const decryptedText = decrypt(data, password); // 解密
  const sensitiveWordsArray = decryptedText.split('\n').map((word: string) => word.trim());
  const mint = new Mint(sensitiveWordsArray);
  return mint;
}

// 标记敏感词
export function markSensitiveWords(mint: ref<Mint>) {
  const editor = vscode.window.activeTextEditor;
  if (editor && fileStates[editor.document.fileName]) {
    return; // 已经检测中的文件不重复进行检测
  }
  if (editor && mint.value) {
    isDetectingSensitiveWords.value = true;
    if (detectionMarkDiagnosis(editor.document, mint)) {
      activateDocumentChangeListener(editor.document, mint); // 注册文档更改监听器
      fileStates[editor.document.fileName] = true; // 记录文件状态为已检测
    }
  } else {
    vscode.window.showErrorMessage('没有活动的文本编辑器。');
  }
}

// 激活文档更改监听器
function activateDocumentChangeListener(document: vscode.TextDocument, mint: ref<Mint>) {
  if (!documentListeners[document.fileName]) {
    const listener = vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === document && mint) {
        detectionMarkDiagnosis(document, mint);
      }
    });
    documentListeners[document.fileName] = listener;
  }
}

// 停止检测敏感词
export function stopMarkSensitiveWords() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    stopSensitiveWordDetection(editor.document);
  }
  isDetectingSensitiveWords.value = false;
}

// 停止敏感词检测、清除标记
function stopSensitiveWordDetection(document: vscode.TextDocument) {
  cleanUpDocument(document, () => {
    statusBar.setStatusbar("default");
    diagnosticCollection.delete(document.uri);
    vscode.window.showInformationMessage(`已停止检测敏感词。`);
  });
}

// 进行文档清理操作
function cleanUpDocument(document: vscode.TextDocument, callback?: () => void) {
  if (fileStates[document.fileName]) {
    delete fileStates[document.fileName];
    if (documentListeners[document.fileName]) {
      documentListeners[document.fileName].dispose();
      delete documentListeners[document.fileName];
    }
    if (callback) {
      callback();
    }
  }
}

// 检测敏感词、标记诊断
function detectionMarkDiagnosis(document: vscode.TextDocument, mint: ref<Mint>) {
  const text = document.getText();
  let textWithoutPunctuation = text.replace(/[^\u4e00-\u9fa5]*/g, ''); // 只保留中文，用于检测 你#1a好 情况
  textWithoutPunctuation += "#" + text.replace(/[^a-zA-Z]*/g, ''); // 只保留英文，用于检测 a#你1b 情况
  textWithoutPunctuation += "#" + text.replace(/[^0-9]*/g, ''); // 只保留数字，用于检测 114514 情况
  const sensitiveWords = new Set(mint.value.filter(textWithoutPunctuation).words); // 使用 Set 来存储唯一的敏感词
  const diagnostics: vscode.Diagnostic[] = [];

  // 用于给敏感词正则插入标点符号匹配
  const regex = /(.)(?!$)/g;
  const maximumSpacingCharacters = 5; // 敏感词匹配时最多允许间隔干扰字符，若有换行，每行独立计算，最多匹配一个换行

  for (const word of sensitiveWords) {
    let replacement;
    let newWord; // 新敏感词能隔着标点符号匹配敏感词
    let REX;
    // 如果原来的敏感词是纯英文单词，则按单词严格匹配
    if (/^[A-Za-z]+$/.test(word)) {
      replacement = `$1(?:(?!\n)[^\na-zA-Z]){0,${maximumSpacingCharacters}}(?:\n(?:(?!\n)[^\na-zA-Z]){0,${maximumSpacingCharacters}})?`;
      newWord = word.replace(regex, replacement);
      REX = `(?<![a-zA-Z])${newWord}(?![a-zA-Z])`;
    } else {
      replacement = `$1(?:(?!\n)[^\n\\u4e00-\\u9fa5]){0,${maximumSpacingCharacters}}(?:\n(?:(?!\n)[^\n\\u4e00-\\u9fa5]){0,${maximumSpacingCharacters}})?`;
      newWord = word.replace(regex, replacement);
      REX = newWord;
    }
    const wordRegExp = new RegExp(`${REX}`, 'gi');
    let match;

    while ((match = wordRegExp.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      const diagnostic = new vscode.Diagnostic(range, '敏感词', vscode.DiagnosticSeverity.Warning);
      diagnostic.source = '敏感词检测';
      diagnostic.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), `${word}`)
      ];

      diagnostics.push(diagnostic);
      statusBar.setMintCount(document, diagnostics.length);
      statusBar.setStatusbar("listening", statusBar.getMintCount(document));
    }
  }

  diagnosticCollection.delete(document.uri);

  if (diagnostics.length > 0) {
    diagnosticCollection.set(document.uri, diagnostics);
  } else {
    vscode.window.showInformationMessage(`${path.basename(document.fileName)}中已没有敏感词，停止检测。`);
    cleanUpDocument(document, () => {
      statusBar.setStatusbar("default");
    });
  }
  return diagnostics.length;
}

// 刷新所有打开的编辑器的敏感词检测
export function restartSensitiveWordDetectionFunction() {
  const allDocuments = vscode.workspace.textDocuments;
  allDocuments.forEach(document => {
    if (!document) {
      return;
    }
    if (fileStates[document.fileName]) {
      delete fileStates[document.fileName];
      if (documentListeners[document.fileName]) {
        documentListeners[document.fileName].dispose();
        delete documentListeners[document.fileName];
      }
      if (detectionMarkDiagnosis(document, mint)) {
        activateDocumentChangeListener(document, mint); // 注册文档更改监听器
        fileStates[document.fileName] = true; // 记录文件状态为已检测
      }
    }
  });
}


