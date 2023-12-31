import * as vscode from 'vscode';
import { SidebarProvider } from "./SidebarProvider";

export function sidebarInit(context: vscode.ExtensionContext) {
	const sidebarPanel = new SidebarProvider(context, context.extensionUri, 'cec-sidebar-main.html');
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("cec-sidebar-main", sidebarPanel)
	);
	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('cec-ide-sidebar')) {
			sidebarPanel.reloadWebview();
		}
	});
}