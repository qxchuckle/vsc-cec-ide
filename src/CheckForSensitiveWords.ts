import * as vscode from 'vscode';
import Mint from 'mint-filter';
import * as path from 'path';
import * as fs from 'fs';
import { encrypt, decrypt } from './utils/EncryptionAndDecryption';
let statusBar: vscode.StatusBarItem; // 状态栏
let selectedWindow :vscode.TextEditor

const documentListeners: { [key: string]: vscode.Disposable } = {}; // 记录文件监听器
const fileStates: { [key: string]: boolean } = {}; // 记录文件状态
const mintCount : { [key: string]: number } = {}; //记录文件敏感词数量

export function sensitiveWordDetectionInit(context: vscode.ExtensionContext) {
  let sensitiveWordsFilePath = path.join(context.extensionPath, 'resource', 'text', 'SensitiveWordsEncryption.txt');
  const customSensitiveWordsPath = path.join(context.extensionPath, 'resource', 'text', 'CustomSensitiveWords.txt');
  try {
    const data = fs.readFileSync(customSensitiveWordsPath, 'utf8');
    // 如果自定义敏感词文件不为空，则使用该文件
    if (!(data.trim() === "")) {
      sensitiveWordsFilePath = customSensitiveWordsPath;
    }
  } catch (err) { }

  fs.readFile(sensitiveWordsFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error(err);
      vscode.window.showErrorMessage('读取敏感词文件出错！');
      return;
    }

    // 解密
    const password = 'chuckle';
    const decryptedText = decrypt(data, password);

    let sensitiveWordsArray = decryptedText.split('\n').map((word: string) => word.trim());
    const mint = new Mint(sensitiveWordsArray);

    const markCommand = vscode.commands.registerCommand('cec-ide.mark-sensitive-words', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && fileStates[editor.document.fileName]) {
        return; // 已经检测种的文件不重复进行检测
      }
      if (editor && mint) {
        setStatusbar("loading")
        activateDocumentChangeListener(editor.document, mint); // 注册文档更改监听器
        checkForSensitiveWords(editor, mint);
        fileStates[editor.document.fileName] = true; // 记录文件状态为已检测
      } else {
        vscode.window.showErrorMessage('没有活动的文本编辑器。');
      }
    });

    // 创建状态栏项
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    setStatusbar("default")
    statusBar.show();

    // 取消文档更改事件的监听
    vscode.workspace.onDidCloseTextDocument(closedDocument => {
      cleanUpDocument(closedDocument, () => {
        diagnosticCollection.delete(closedDocument.uri);
      });
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        selectedWindow = editor;
        if (mintCount[selectedWindow.document.fileName]){
          setStatusbar("listening",mintCount[selectedWindow.document.fileName])
        }
        else{
          setStatusbar("default")
        }
      }else{
        setStatusbar("default")
      }
    })


    const stopCommand = vscode.commands.registerCommand('cec-ide.stop-mark-sensitive-words', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        stopSensitiveWordDetection(editor.document);
      }
    });

    customSensitiveWords(context); // 自定义敏感词

    context.subscriptions.push(markCommand, stopCommand);
  });
}

function activateDocumentChangeListener(document: vscode.TextDocument, mint: Mint) {
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
      mintCount[editor.document.fileName] = diagnostics.length;
      setStatusbar("listening",mintCount[editor.document.fileName])
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
    cleanUpDocument(document);
  }
}

function stopSensitiveWordDetection(document: vscode.TextDocument) {
  setTimeout(()=>{
    setStatusbar("stop")
  },2000)
  cleanUpDocument(document, () => {
    diagnosticCollection.delete(document.uri);
    vscode.window.showInformationMessage(`已停止检测敏感词。`);
  });
}

function cleanUpDocument(document: vscode.TextDocument, callback?: () => void) {
  if (fileStates[document.fileName]) {
    setStatusbar("default")
    delete fileStates[document.fileName];
    delete mintCount[document.fileName]
    if (documentListeners[document.fileName]) {
      documentListeners[document.fileName].dispose();
      delete documentListeners[document.fileName];
    }
    if (callback) {
      callback();
    }
  }
}

function customSensitiveWords(context: vscode.ExtensionContext) {
  const customSensitiveWordsPath = path.join(context.extensionPath, 'resource', 'text', 'CustomSensitiveWords.txt');
  const password = 'chuckle';

  const uploadSensitiveWordsFile = vscode.commands.registerCommand('cec-ide.uploadSensitiveWordsFile', async () => {
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: 'Upload',
      filters: {
        'textFiles': ['txt']
      }
    };
    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri[0]) {
      const filePath = fileUri[0].fsPath;
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      fs.writeFile(customSensitiveWordsPath, encrypt(fileContent, password), 'utf8', (err) => {
        if (err) {
          vscode.window.showInformationMessage("自定义敏感词失败。");
          return;
        }
        vscode.window.showInformationMessage("自定义敏感词完成,请重启VSCode");
      });
    }
  });

  const resetSensitiveWordsFile = vscode.commands.registerCommand('cec-ide.resetSensitiveWordsFile', async () => {
    fs.writeFile(customSensitiveWordsPath, "", 'utf8', (err) => {
      if (err) {
        vscode.window.showInformationMessage("重置敏感词失败。");
        return;
      }
      vscode.window.showInformationMessage("重置敏感词完成,请重启VSCode");
    });
  });

  context.subscriptions.push(uploadSensitiveWordsFile, resetSensitiveWordsFile);
}

function setStatusbar(type: string,count?:number) {
  if (type==="default"){
    statusBar.command = 'cec-ide.mark-sensitive-words';
    statusBar.text = '$(cec-ide-line) CEC-IDE';
    statusBar.tooltip = '点击开始CEC敏感词检测';
  }
  else if(type==="loading"){
    statusBar.text = `$(cec-ide-line) 正在检测敏感词中...`;
    statusBar.tooltip = '点击停止检测'
    statusBar.command = 'cec-ide.stop-mark-sensitive-words'
  }
  else if(type==="listening"){
    statusBar.text = `$(cec-ide-line) 监听到${count}敏感词`;
    statusBar.tooltip = '点击停止监听'
    statusBar.command = 'cec-ide.stop-mark-sensitive-words'
  }
  else if(type==="stop"){
    statusBar.text = '$(cec-ide-line) 停止检测...';
    statusBar.command = undefined;
    statusBar.tooltip = '正在停止中';
  }
}