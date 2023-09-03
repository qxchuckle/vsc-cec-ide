import * as vscode from 'vscode';
import { SidebarProvider } from "./SidebarProvider";

export function sidebarInit(context: vscode.ExtensionContext) {
	const sidebarPanel = new SidebarProvider(context.extensionUri, 'cec-sidebar-main.html');
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("cec-sidebar-main", sidebarPanel)
	);
}