import * as vscode from 'vscode';

export function createCodeActionProvider(diagnosticSource: string): vscode.Disposable {
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
