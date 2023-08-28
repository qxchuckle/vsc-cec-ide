import * as vscode from 'vscode';
import Mint from 'mint-filter';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('sensitiveWords');

export function checkForSensitiveWords(editor: vscode.TextEditor, mint: Mint) {
  const document = editor.document;
  const text = document.getText();
  const sensitiveWords = mint.filter(text).words;
  const diagnostics: vscode.Diagnostic[] = [];
  for (const word of sensitiveWords) {
    const startPos = document.positionAt(text.indexOf(word));
    const endPos = document.positionAt(text.indexOf(word) + word.length);
    const range = new vscode.Range(startPos, endPos);
    const diagnostic = new vscode.Diagnostic(range, '敏感词', vscode.DiagnosticSeverity.Warning);
    diagnostic.source = '敏感词检测';
    diagnostic.relatedInformation = [
      new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), '这个词涉及了色情，政治，暴力等内容')
    ];
    diagnostics.push(diagnostic);
  }
  diagnosticCollection.clear();
  diagnosticCollection.set(document.uri, diagnostics);
}