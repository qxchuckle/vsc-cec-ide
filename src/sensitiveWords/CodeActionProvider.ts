import * as vscode from 'vscode';

export function createCodeActionProvider(diagnosticSource: string, diagnosticCollection: vscode.DiagnosticCollection): vscode.Disposable {
  class SensitiveWordCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(
      document: vscode.TextDocument,
      range: vscode.Range,
      context: vscode.CodeActionContext,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeAction[]> {
      const actions: vscode.CodeAction[] = [];
      for (const diagnostic of context.diagnostics) {
        // 仅处理指定的诊断来源
        if (diagnostic.source === diagnosticSource) {
          const fix = new vscode.CodeAction('将敏感词替换为***', vscode.CodeActionKind.QuickFix);
          fix.edit = new vscode.WorkspaceEdit();
          fix.edit.replace(document.uri, diagnostic.range, '*'.repeat(diagnostic.range.end.character - diagnostic.range.start.character));
          fix.diagnostics = [diagnostic];
          actions.push(fix);
          const diagnosticsOnCurrentDocument = diagnosticCollection.get(document.uri);
          if (diagnosticsOnCurrentDocument) {
            const fixAll = new vscode.CodeAction('一键修复所有敏感词', vscode.CodeActionKind.QuickFix);
            fixAll.edit = new vscode.WorkspaceEdit();
            diagnosticsOnCurrentDocument.forEach(diagnostic => {
              fixAll.edit!.replace(document.uri, diagnostic.range, '*'.repeat(diagnostic.range.end.character - diagnostic.range.start.character));
            });
            fixAll.diagnostics = [...diagnosticsOnCurrentDocument];
            actions.push(fixAll);
          }
        }
      }
      return actions;
    }
  }

  // 注册 CodeActionProvider
  return vscode.languages.registerCodeActionsProvider(
    { scheme: '*' },
    new SensitiveWordCodeActionProvider()
  );
}
