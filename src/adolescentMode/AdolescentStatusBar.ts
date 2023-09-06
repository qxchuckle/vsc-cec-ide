import * as vscode from 'vscode';

class AdolescentStatusBar {
  private statusBar: vscode.StatusBarItem; // 状态栏
  private globalState: vscode.Memento = this._context.globalState;
  private activeTime: number = 0;
  private antiAddictionTime: number;
  private adolescentModeConfig = vscode.workspace.getConfiguration('cec-ide-adolescentMode');
  private timer: NodeJS.Timer;

  constructor(private readonly _context: vscode.ExtensionContext) {
    this.antiAddictionTime = this.adolescentModeConfig.get('antiAddictionTime') || 2;
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarInit();
    this.timeInit();
    this.timer = setInterval(() => {
      this.updateStatus();
    }, 60 * 1000);
  }

  private statusBarInit() {
    // this.statusBar.command = '';
    this.statusBar.text = '';
    this.statusBar.tooltip = '今日编辑器使用时间';
    this.statusBar.show();
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

  private updateStatus() {
    this.activeTime++;
    this.globalState.update('cec-ide-activeTime', this.activeTime);
    this.formatActiveTime();
  }

  private formatActiveTime() {
    if (this.activeTime <= 60) {
      this.statusBar.text = `$(cec-ide-line)${this.activeTime} 分钟`;
    } else {
      const time = (this.activeTime / 60).toFixed(2);
      this.statusBar.text = `$(cec-ide-line)${time} 小时`;
      // 超过防沉迷时间弹窗
      if (!this.adolescentModeConfig.get('turnOffAntiAddictionReminder') && this.activeTime > this.antiAddictionTime * 60) {
        const openAction: vscode.MessageItem = { title: '关闭编辑器' };
        const antiAddictionAction: vscode.MessageItem = { title: '永久关闭防沉迷提醒' };
        vscode.window.showInformationMessage(
          `今日已使用编辑器 ${time} 小时，超过所设置的 ${this.antiAddictionTime}小时防沉迷时间，请关闭编辑器`,
          openAction,
          antiAddictionAction
        ).then((selectedAction) => {
          if (selectedAction === openAction) {
            vscode.commands.executeCommand('workbench.action.closeWindow');
          }else if (selectedAction === antiAddictionAction) {
            this.adolescentModeConfig.update('turnOffAntiAddictionReminder', true, vscode.ConfigurationTarget.Global);
          }
        });
      }
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

}

export default AdolescentStatusBar;