import * as vscode from 'vscode';
import { sidebarInit } from './sidebar/sidebarInit';
import { sensitiveWordDetectionInit } from './sensitiveWords/CheckForSensitiveWords';
import { modifyVsCodeUI } from './ModifyVsCodeUi';
import { adolescentModeInit } from './adolescentMode';
// import initializeTypeDetector from './typeDetector/main';

export function activate(context: vscode.ExtensionContext) {
	// 初始化侧边栏
	sidebarInit(context);
	// 初始化敏感词检测功能
	sensitiveWordDetectionInit(context);
	// 初始化青少年模式
	adolescentModeInit(context);
	// 修改VSCodeUI
	modifyVsCodeUI(context);
	// 初始化 Typescript 类型标记功能
	// initializeTypeDetector(context);
}

export function deactivate() { }
