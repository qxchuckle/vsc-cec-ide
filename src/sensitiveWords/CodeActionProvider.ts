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
          const fix = new vscode.CodeAction(`将敏感词 ${document.getText(diagnostic.range)} 替换为***`, vscode.CodeActionKind.QuickFix);
          fix.edit = new vscode.WorkspaceEdit();
          fix.edit.replace(document.uri, diagnostic.range, '*'.repeat(diagnostic.range.end.character - diagnostic.range.start.character));
          fix.diagnostics = [diagnostic];
          actions.push(fix);
        }
      }

      // 这几行不能放到循环中，否则有多个敏感词位置重叠的时候就会显示多个 一键修复 按钮
      const diagnosticsOnCurrentDocument = diagnosticCollection.get(document.uri);
      if (diagnosticsOnCurrentDocument) {
        const fixAll = new vscode.CodeAction('一键修复所有敏感词', vscode.CodeActionKind.QuickFix);
        fixAll.edit = new vscode.WorkspaceEdit();

        // 如果敏感词之间有重叠部分，直接替换就替换不了会报错，所以我们要解决一下重叠部分的问题
        const diagnosticsSorted = Array.from(diagnosticsOnCurrentDocument).sort((a, b) => a.range.start.line === b.range.start.line ? a.range.start.character - b.range.start.character : a.range.start.line - b.range.start.line); // 先排序，便于处理重叠
        const ranges: vscode.Range[] = [];
        let rangeStartPos: vscode.Position = new vscode.Position(0, 0), rangeEndPos: vscode.Position = new vscode.Position(0, 0), isOverlapped = false; // 用 rangeStartPos 和 rangeEndPos 来记录敏感词的开始和结束位置
        for (let i = 0; i < diagnosticsSorted.length; ++i) {
          if (diagnosticsSorted[i].range.start.line === diagnosticsSorted[i + 1]?.range?.start?.line // 同一行
            && i !== diagnosticsSorted.length - 1 // 不是最后一个敏感词，最后一个敏感词后面肯定不会有连着的了，直接push就好了
            && diagnosticsSorted[i].range.end.character >= diagnosticsSorted[i + 1].range.start.character // 前一个结束的位置比后一个开始的位置大，存在重叠
          ) {
            if (!isOverlapped) {
              // 之前没有重叠过的
              rangeStartPos = diagnosticsSorted[i].range.start;
              isOverlapped = true;
            }
            rangeEndPos = diagnosticsSorted[i + 1].range.end; // 更新结束位置
          } else {
            if (isOverlapped) {
              // 之前重叠过，到这不重叠了
              ranges.push(new vscode.Range(rangeStartPos, rangeEndPos));
              isOverlapped = false;
            } else {
              ranges.push(diagnosticsSorted[i].range);
            }
          }
        }

        ranges.forEach(range => {
          fixAll.edit!.replace(document.uri, range, '*'.repeat(range.end.character - range.start.character));
        });

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
