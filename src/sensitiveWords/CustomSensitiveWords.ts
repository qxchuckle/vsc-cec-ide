import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { encrypt } from '../utils/EncryptionAndDecryption';

import { initializeSensitiveWordsSearcher } from './CheckForSensitiveWords';
import { isDetectingSensitiveWords, markSensitiveWords, stopMarkSensitiveWords, mint } from './DetectSensitiveWords';

export function customSensitiveWords(context: vscode.ExtensionContext) {
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
        initializeSensitiveWordsSearcher(context).then(() => {
          vscode.window.showInformationMessage('自定义敏感词完成');
          if (isDetectingSensitiveWords) {
            // 重启敏感词检测功能
            stopMarkSensitiveWords();
            markSensitiveWords(mint);
          }
        });
      });
    }
  });

  const resetSensitiveWordsFile = vscode.commands.registerCommand('cec-ide.resetSensitiveWordsFile', async () => {
    fs.writeFile(customSensitiveWordsPath, "", 'utf8', (err) => {
      if (err) {
        vscode.window.showInformationMessage("重置敏感词失败。");
        return;
      }
      initializeSensitiveWordsSearcher(context).then(() => {
        vscode.window.showInformationMessage('重置敏感词完成');
        if (isDetectingSensitiveWords) {
          // 重启敏感词检测功能
          stopMarkSensitiveWords();
          markSensitiveWords(mint);
        }
      });
    });
  });

  context.subscriptions.push(uploadSensitiveWordsFile, resetSensitiveWordsFile);
}