import * as vscode from 'vscode';
import { ScriptTarget, createSourceFile, Statement, Node, SyntaxKind, VariableDeclaration } from 'typescript';

const fileStates: {
    [key: string]: boolean
} = {};

const diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('typescript');

export default function initializeTypeDetector(context: vscode.ExtensionContext) {
    vscode.window.onDidChangeActiveTextEditor(markType);
    vscode.window.onDidChangeTextEditorOptions(markType);
    markType();
}

function markType() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'typescript') {
        if (fileStates[editor.document.fileName]) {
            return;
        }
        const content = editor.document.getText();
        const sourcefile = createSourceFile(editor.document.fileName, content, ScriptTarget.ESNext);
        const diagnostics: vscode.Diagnostic[] = [];
        console.log(sourcefile.statements);
        sourcefile.statements.forEach(statement => {
            forEachNode(content, statement, diagnostics, editor.document);
        });
        diagnosticCollection.delete(editor.document.uri);
        if (diagnostics) {
            diagnosticCollection.set(editor.document.uri, diagnostics);
        }
    }
}

function forEachNode(source: string, node: Node, diagnostics: vscode.Diagnostic[], document: vscode.TextDocument) {
    if (node.kind === SyntaxKind.VariableDeclaration) {
        const declaration = node as VariableDeclaration;
        const variableBasicType = declaration.type?.kind;
        let typeName = '';
        switch (variableBasicType) {
            case SyntaxKind.StringKeyword: typeName = 'string'; break;
            case SyntaxKind.NumberKeyword: typeName = 'number'; break;
            case SyntaxKind.BooleanKeyword: typeName = 'boolean'; break;
        }
        if (typeName) {
            // pos + n 是第 n 个字符的位置
            generateDiagnostics(typeName, source.slice(declaration.name.pos + 1, declaration.name.end), [declaration.type!.pos + 1, declaration.type!.end], diagnostics, document);
        }
    }
    node.forEachChild(node => forEachNode(source, node, diagnostics, document));
}

function generateDiagnostics(type: string, variableName: string, pos: [number, number], diagnostics: vscode.Diagnostic[], document: vscode.TextDocument) {
    const range = new vscode.Range(
        document.positionAt(pos[0]),
        document.positionAt(pos[1])
    );
    const diagnostic = new vscode.Diagnostic(range, `未备案的类型: ${type}`, vscode.DiagnosticSeverity.Warning);
    diagnostic.source = '类型备案提示';
    diagnostic.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), variableName)
    ];
    diagnostics.push(diagnostic);
}