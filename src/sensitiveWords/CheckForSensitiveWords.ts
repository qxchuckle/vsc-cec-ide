import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { detectSensitiveWords, initializeSensitiveWords, PASSWORD } from './DetectSensitiveWords';
import { customSensitiveWords } from './CustomSensitiveWords';

import { mint } from './DetectSensitiveWords';

export async function sensitiveWordDetectionInit(context: vscode.ExtensionContext) {
  initializeSensitiveWordsSearcher(context).then(() => { 
    detectSensitiveWords(context); // 初始化对敏感词的检测
    customSensitiveWords(context); // 自定义敏感词
  });
}

// 读取敏感词数据集，并建立ac自动机方便搜索
export function initializeSensitiveWordsSearcher(context: vscode.ExtensionContext) {
  return new Promise<void>(resolve => {
    const sensitiveWordsFilePath = getSensitiveWordsFilePath(context);
    fs.readFile(sensitiveWordsFilePath, 'utf-8', (err, data) => {
      if (err) {
        console.error(err);
        vscode.window.showErrorMessage('读取敏感词文件出错！');
        return;
      }
      mint.value = initializeSensitiveWords(data, PASSWORD);
      resolve();
    });
  });
}

// 获取敏感词文件路径
function getSensitiveWordsFilePath(context: vscode.ExtensionContext): string {
  let sensitiveWordsFilePath = path.join(context.extensionPath, 'resource', 'text', 'SensitiveWordsEncryption.txt');
  const customSensitiveWordsPath = path.join(context.extensionPath, 'resource', 'text', 'CustomSensitiveWords.txt');
  try {
    const data = fs.readFileSync(customSensitiveWordsPath, 'utf8');
    // 如果自定义敏感词文件不为空，则使用该文件
    if (!(data.trim() === "")) {
      sensitiveWordsFilePath = customSensitiveWordsPath;
    }
  } catch (err) { }
  return sensitiveWordsFilePath;
}
