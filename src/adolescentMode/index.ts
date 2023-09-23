import * as vscode from "vscode";
// import AdolescentStatusBar from './AdolescentStatusBar';

export function adolescentModeInit(context: vscode.ExtensionContext) {
  const adolescentModeConfig = vscode.workspace.getConfiguration('cec-ide-adolescentMode');
  const adolescentModeEnabled = adolescentModeConfig.get('enabled');
  if (adolescentModeEnabled) {
    main(context);
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
        main(context);
      } else if (selectedAction === neverShowAgainAction) {
        adolescentModeConfig.update('turnOffActivationReminder', true, vscode.ConfigurationTarget.Global);
      }
    });
  }
}

function main(context: vscode.ExtensionContext) {
  // 初始化青少年模式状态栏
  const statusBar = new AdolescentStatusBar(context);
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('cec-ide-adolescentMode')) {
      statusBar.reload();
    }
  });
}

// 玄学问题，不能把该class单独扔一个文件里导入使用，否则在linux环境下插件会崩溃
class AdolescentStatusBar {
  private statusBar: vscode.StatusBarItem; // 状态栏
  private globalState: vscode.Memento = this._context.globalState;
  private activeTime: number = 0;
  private antiAddictionTime: number;
  private adolescentModeConfig = vscode.workspace.getConfiguration('cec-ide-adolescentMode');
  private timer: NodeJS.Timer | null = null;
  private antiAddictionRemind = true;
  private numberOfSynchronizations = 0;
  private turnOffAntiAddictionReminder = false;

  constructor(private readonly _context: vscode.ExtensionContext) {
    this.antiAddictionTime = this.adolescentModeConfig.get('antiAddictionTime') || 2;
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.turnOffAntiAddictionReminder = this.adolescentModeConfig.get('turnOffAntiAddictionReminder')!;
    this.statusBarInit();
    this.timeInit();
    this.intervalInit();
  }

  private statusBarInit() {
    this.statusBar.command = 'cec-ide.antiAddictionRemind';
    this.statusBar.text = '';
    this.statusBar.tooltip = '点击临时关闭防沉迷检测';
    this.statusBar.show();
    this._context.subscriptions.push(vscode.commands.registerCommand('cec-ide.antiAddictionRemind', () => {
      this.antiAddictionRemind = !this.antiAddictionRemind;
      if (this.antiAddictionRemind) {
        this.formatActiveTime();
        vscode.window.showInformationMessage('已开启防沉迷提醒');
        this.statusBar.tooltip = '点击临时关闭防沉迷检测';
      } else {
        vscode.window.showInformationMessage('已临时关闭防沉迷检测');
        this.statusBar.tooltip = '点击开启防沉迷检测';
      }
    }));
  }

  private timeInit() {
    const currentDate: string | undefined = this.globalState.get('cec-ide-day');
    const today: string = this.obtainTheTimeOfTheDay();
    if (currentDate && String(currentDate) === today) {
      this.activeTime = this.globalState.get('cec-ide-activeTime') || 0;
    } else {
      this.globalState.update('cec-ide-day', today);
      this.activeTime = 0;
      this.globalState.update('cec-ide-activeTime', 0);
    }
    this.formatActiveTime();
  }

  private intervalInit() {
    this.timer = setInterval(() => {
      this.updateStatus();
    }, 60 * 1000);
  }

  private updateStatus() {
    if (this.numberOfSynchronizations < 1) {
      this.activeTime = this.globalState.get('cec-ide-activeTime') || 0;// 同步1次
      this.numberOfSynchronizations++;
    }
    this.activeTime++;
    this.globalState.update('cec-ide-activeTime', this.activeTime);
    this.formatActiveTime();
  }

  private formatActiveTime() {
    let usedTime;
    if (this.activeTime < 60) {
      usedTime = `${this.activeTime} 分钟`;
      this.statusBar.text = `$(cec-ide-line)${usedTime}`;
    } else {
      usedTime = `${(this.activeTime / 60).toFixed(2)} 小时`;
      this.statusBar.text = `$(cec-ide-line)${usedTime}`;
    }
    // 超过防沉迷时间弹窗
    if (!this.turnOffAntiAddictionReminder && this.antiAddictionRemind && this.activeTime > this.antiAddictionTime) {
      const openAction: vscode.MessageItem = { title: '关闭编辑器' };
      const antiAddictionAction: vscode.MessageItem = { title: '此次关闭提醒' };
      const setTime = this.antiAddictionTime < 60
        ? `${this.antiAddictionTime} 分钟`
        : `${(this.antiAddictionTime / 60).toFixed(2)} 小时`;
      vscode.window.showInformationMessage(
        `今日已使用编辑器 ${usedTime}，超过所设置的 ${setTime}防沉迷时间，请关闭编辑器`,
        openAction,
        antiAddictionAction
      ).then((selectedAction) => {
        if (selectedAction === openAction) {
          vscode.commands.executeCommand('workbench.action.closeWindow');
        } else if (selectedAction === antiAddictionAction) {
          this.antiAddictionRemind = false;
          vscode.window.showInformationMessage('已临时关闭防沉迷检测');
          this.statusBar.tooltip = '点击开启防沉迷检测';
        }
      });
    }
  }

  private obtainTheTimeOfTheDay() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1并补零
    const day = String(currentDate.getDate()).padStart(2, '0'); // 补零以确保两位数的日期
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }

  public reload() {
    clearInterval(this.timer!);
    this.adolescentModeConfig = vscode.workspace.getConfiguration('cec-ide-adolescentMode');
    this.antiAddictionTime = this.adolescentModeConfig.get('antiAddictionTime') || 2;
    this.turnOffAntiAddictionReminder = this.adolescentModeConfig.get('turnOffAntiAddictionReminder')!;
    this.numberOfSynchronizations = 0;
    this.formatActiveTime();
    this.intervalInit();
  }

}




