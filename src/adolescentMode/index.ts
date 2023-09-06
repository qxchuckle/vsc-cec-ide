import * as vscode from "vscode";
import AdolescentStatusBar from './AdolescentStatusBar';

export function adolescentModeInit(context: vscode.ExtensionContext) {
  const adolescentModeConfig = vscode.workspace.getConfiguration('cec-ide-adolescentMode');
  const adolescentModeEnabled = adolescentModeConfig.get('enabled');
  if (adolescentModeEnabled) {
    main(context, adolescentModeConfig);
  } else {
    // 没有勾选则提示开启青少年模式
    promptToActivateYouthMode(context, adolescentModeConfig);
  }
}

function promptToActivateYouthMode(context: vscode.ExtensionContext, adolescentModeConfig: vscode.WorkspaceConfiguration) {
  const openAction: vscode.MessageItem = { title: '开启' };
  const neverShowAgainAction: vscode.MessageItem = { title: '永久关闭弹窗' };
  if (!adolescentModeConfig.get('turnOffActivationReminder')) {
    vscode.window.showInformationMessage(
      `开启青少年防沉迷模式`,
      openAction,
      neverShowAgainAction
    ).then((selectedAction) => {
      if (selectedAction === openAction) {
        adolescentModeConfig.update('enabled', true, vscode.ConfigurationTarget.Global);
        main(context, adolescentModeConfig);
      } else if (selectedAction === neverShowAgainAction) {
        adolescentModeConfig.update('turnOffActivationReminder', true, vscode.ConfigurationTarget.Global);
      }
    });
  }
}

function main(context: vscode.ExtensionContext, adolescentModeConfig: vscode.WorkspaceConfiguration) {
  // 初始化青少年模式状态栏
  const statusBar = new AdolescentStatusBar(context);
}






