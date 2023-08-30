import * as vscode from 'vscode';

export function createCodeActionProvider(diagnosticSource: string, diagnosticCollection: vscode.DiagnosticCollection): vscode.Disposable {
  class SensitiveWordCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(
      document: vscode.TextDocument,
      range: vscode.Range,
      context: vscode.CodeActionContext,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeAction[]> {
      // 用于快速修复的动作数组
      const actions: vscode.CodeAction[] = [];
      const fixes = context.diagnostics.map(diagnostic => {
        if (!(diagnostic.source === diagnosticSource)) { return null; }
        const fix = new vscode.CodeAction(`将敏感词 ${document.getText(diagnostic.range)} 替换为***`, vscode.CodeActionKind.QuickFix);
        const newText = '*'.repeat(diagnostic.range.end.character - diagnostic.range.start.character);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, diagnostic.range, newText);
        fix.edit = edit;
        fix.diagnostics = [diagnostic];
        return fix;
      }).filter((fix): fix is vscode.CodeAction => fix !== null);
      // 如果没有可修复的，也就不用往后执行了
      if(fixes.length === 0) { return []; }
      actions.push(...fixes);

      // 获取当前文档的诊断信息集合
      const diagnosticsOnCurrentDocument = diagnosticCollection.get(document.uri);

      // 仅处理指定的诊断来源
      if (diagnosticsOnCurrentDocument ) {
        // 创建一键修复所有敏感词的 CodeAction
        const fixAll = new vscode.CodeAction('一键修复所有敏感词', vscode.CodeActionKind.QuickFix);
        fixAll.edit = new vscode.WorkspaceEdit();

        // 敏感词按位置排序，以便处理重叠
        const diagnosticsSorted = Array.from(diagnosticsOnCurrentDocument)
          .sort((a, b) => a.range.start.compareTo(b.range.start));

        let currentRange: vscode.Range | null = null;

        for (const diagnostic of diagnosticsSorted) {
          if (!currentRange) {
            // 如果当前没有重叠的范围，直接设置为当前诊断范围
            currentRange = diagnostic.range;
          } else if (currentRange.end.isBeforeOrEqual(diagnostic.range.start)) {
            // 如果当前重叠范围的结束位置在当前诊断范围之前，添加之前的范围并重新开始记录
            fixAll.edit!.replace(document.uri, currentRange, '*'.repeat(currentRange.end.character - currentRange.start.character));
            currentRange = diagnostic.range;
          } else if (currentRange.end.isBefore(diagnostic.range.end)) {
            // 如果当前重叠范围的结束位置在当前诊断范围内，更新结束位置
            currentRange = new vscode.Range(currentRange.start, diagnostic.range.end);
          }
        }

        // 处理最后一个重叠范围
        if (currentRange) {
          fixAll.edit!.replace(document.uri, currentRange, '*'.repeat(currentRange.end.character - currentRange.start.character));
        }

        // 将修复操作应用到 CodeAction
        fixAll.diagnostics = [...diagnosticsOnCurrentDocument];
        actions.push(fixAll);
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
