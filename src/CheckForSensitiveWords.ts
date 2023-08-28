import * as vscode from 'vscode';
import Mint from 'mint-filter';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('sensitiveWords');

export function checkForSensitiveWords(editor: vscode.TextEditor, mint: Mint) {
  const document = editor.document;
  const text = document.getText();
  const sensitiveWords = new Set(mint.filter(text).words); // fix: https://github.com/qxchuckle/vsc-cec-ide/issues/25 把敏感词的列表转成 Set 来去重，防止每个词被提示多次
  const diagnostics: vscode.Diagnostic[] = [];
  
  // 使用正则表达式来匹配所有敏感词的出现位置
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
  
  diagnosticCollection.clear();
  
  if (diagnostics.length > 0) {
    diagnosticCollection.set(document.uri, diagnostics);
    vscode.window.showInformationMessage(`检测到${diagnostics.length}个敏感词。`);
  } else {
    vscode.window.showInformationMessage('该文件中没有敏感词。');
  }
}
