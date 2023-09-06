import * as vscode from "vscode";
import * as fs from "fs";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  private _htmlFileName: string;

  constructor(private readonly _context: vscode.ExtensionContext, private readonly _extensionUri: vscode.Uri, htmlFileName: string) {
    this._htmlFileName = htmlFileName;
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
    const htmlFilePath = vscode.Uri.joinPath(this._extensionUri, 'resource', 'page', this._htmlFileName);
    let htmlContent = fs.readFileSync(htmlFilePath.fsPath, "utf-8");
    const extensionPath = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri)
    );
    const sidebarConfig = vscode.workspace.getConfiguration('cec-ide-sidebar');
    const activateVip = sidebarConfig.get('activateVip');
    const username = sidebarConfig.get('username');
    const deadline = activateVip ? `会员截止日期：${sidebarConfig.get('deadline')}` : `点击下方按钮，激活会员`;
    const activation = activateVip ? `续费会员` : `激活会员`;
    const vip = `<div class="vip-box${activateVip ? '' : ' no-vip'}">
  <div class="vip">${activateVip ? sidebarConfig.get('grade') : 'VIP0'}</div>
</div>`;
    const avatarBase64 = this.readImageAsBase64(sidebarConfig.get('avatar'));
    htmlContent = htmlContent.replace(
      /#username/g, // 替换用户名
      `${username}`
    ).replace(
      /#deadline/g, // 替换会员截止日期
      `${deadline}`
    ).replace(
      /#activation/g, // 替换充值会员按钮文本
      `${activation}`
    ).replace(
      /#VIP/g, // 替换会员等级
      `${vip}`
    ).replace(
      /#avatar/g, // 替换头像
      `${avatarBase64}`
    ).replace(
      /#extensionPath/g, // 替换资源根路径
      `${extensionPath}`
    );

    return htmlContent;
  }

  private readImageAsBase64(imagePath: string | undefined): string {
    const basePath = "#extensionPath/resource/images/avatar.png";
    if (!imagePath) {
      return basePath;
    }
    try {
      const globalState = this._context.globalState;
      if(imagePath === globalState.get('avatarPath') && globalState.get('avatarBase64')){
        return globalState.get('avatarBase64')!;
      }
      const data = fs.readFileSync(imagePath);
      const base64Image = "data:image/png;base64," + data.toString('base64');
      globalState.update('avatarPath', imagePath);
      globalState.update('avatarBase64', base64Image);
      return base64Image;
    } catch (err) {
      return basePath;
    }
  }
}




