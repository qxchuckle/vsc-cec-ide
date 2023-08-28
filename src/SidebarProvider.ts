import * as fs from 'node:fs';

import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;
	_doc?: vscode.TextDocument;
	private _htmlFileName: string;
	private _cssFileName: string;
	private _jsFileName: string;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		htmlFileName: string,
		cssFileName: string,
		jsFileName: string,
	) {
		this._htmlFileName = htmlFileName;
		this._cssFileName = cssFileName;
		this._jsFileName = jsFileName;
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		const htmlContent = this._getHtmlContent(webviewView.webview);
		webviewView.webview.html = htmlContent;
	}

	public revive(panel: vscode.WebviewView) {
		this._view = panel;
	}

	private _getHtmlContent(webview: vscode.Webview) {
		const htmlFilePath = vscode.Uri.joinPath(
			this._extensionUri,
			'resource',
			'page',
			this._htmlFileName,
		);
		let htmlContent = fs.readFileSync(htmlFilePath.fsPath, 'utf-8');
		const extensionPath = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri),
		);

		htmlContent = htmlContent.replace(
			/#extensionPath/g,
			`${extensionPath.toString()}`,
		);

		return htmlContent;
	}
}
