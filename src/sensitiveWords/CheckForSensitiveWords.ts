import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createCodeActionProvider } from '../CodeActionProvider';
import { detectSensitiveWords } from './DetectSensitiveWords';
import { customSensitiveWords } from './CustomSensitiveWords';

export function sensitiveWordDetectionInit(context: vscode.ExtensionContext) {
  const sensitiveWordsFilePath = getSensitiveWordsFilePath(context);
  fs.readFile(sensitiveWordsFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error(err);
      vscode.window.showErrorMessage('读取敏感词文件出错！');
      return;
    }
    detectSensitiveWords(context, data); // 初始化对敏感词的检测
    // 注册 CodeActionProvider，指定诊断来源
    const codeActionProvider = createCodeActionProvider('敏感词检测');
    context.subscriptions.push(codeActionProvider);
    customSensitiveWords(context); // 自定义敏感词
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
