import * as vscode from 'vscode';

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
      if(this.antiAddictionRemind){
        this.formatActiveTime();
        vscode.window.showInformationMessage('已开启防沉迷提醒');
        this.statusBar.tooltip = '点击临时关闭防沉迷检测';
      }else{
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
    }, 3000);
  }

  private updateStatus() {
    if (this.numberOfSynchronizations < 2) {
      this.activeTime = this.globalState.get('cec-ide-activeTime') || 0;// 同步2次
    }
    this.activeTime++;
    this.globalState.update('cec-ide-activeTime', this.activeTime);
    this.formatActiveTime();
  }

  private formatActiveTime() {
    const time = (this.activeTime / 60).toFixed(2);
    if (this.activeTime <= 60) {
      this.statusBar.text = `$(cec-ide-line)${this.activeTime} 分钟`;
    } else {
      this.statusBar.text = `$(cec-ide-line)${time} 小时`;
    }
    // 超过防沉迷时间弹窗
    if (!this.turnOffAntiAddictionReminder && this.antiAddictionRemind && this.activeTime > this.antiAddictionTime * 60) {
      const openAction: vscode.MessageItem = { title: '关闭编辑器' };
      const antiAddictionAction: vscode.MessageItem = { title: '此次关闭提醒' };
      vscode.window.showInformationMessage(
        `今日已使用编辑器 ${time} 小时，超过所设置的 ${this.antiAddictionTime} 小时防沉迷时间，请关闭编辑器`,
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

export default AdolescentStatusBar;