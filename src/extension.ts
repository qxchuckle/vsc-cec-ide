import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SidebarProvider } from "./SidebarProvider";
import { checkForSensitiveWords } from './CheckForSensitiveWords';
import Mint from 'mint-filter';
const crypto = require('crypto');

export function activate(context: vscode.ExtensionContext) {

	sidebarInit(context);

	sensitiveWordDetectionInit(context);

	const mainCommand = vscode.commands.registerCommand('cec-ide.cec-ide', () => {
		injectionCSS(context);
	});

	const restoreCommand = vscode.commands.registerCommand('cec-ide.cec-ide-restore', () => {
		restoreCSS();
	});

	context.subscriptions.push(mainCommand, restoreCommand);
}

export function deactivate() { }

async function injectionCSS(context: vscode.ExtensionContext) {
	const cssName: string = vscode.version >= "1.38" ? 'workbench.desktop.main.css' : 'workbench.main.css';
	const vscodePath = vscode.env.appRoot;
	const cssPath = path.join(vscodePath, 'out', 'vs', 'workbench', cssName);
	const backupCssName = 'workbench.desktop.main.backups.css';
	const backupCssPath = path.join(vscodePath, 'out', 'vs', 'workbench', backupCssName);

	const extensionPath = context.extensionPath;

	fs.readFile(cssPath, 'utf8', async (err, data) => {
		if (err) {
			console.error(err);
			vscode.window.showErrorMessage('很遗憾，国产化失败！');
			return;
		}
		const logoImg = await readImageAsBase64(path.join(extensionPath, 'resource', 'images', 'CEC-IDE.ico'));
		const backImg = await readImageAsBase64(path.join(extensionPath, 'resource', 'images', 'back-img.png'));
		const cecImg = await readImageAsBase64(path.join(extensionPath, 'resource', 'images', 'cec-img.webp'));
		const newCssCode = `
.monaco-workbench.monaco-workbench .part.titlebar .titlebar-container .window-appicon {
	background-image: url(${logoImg})!important;
	min-width: 90px!important;
	display: flex!important;
	background-repeat: no-repeat!important;
	background-position: 25%!important;
	background-size: 18px!important;
	transform: scale(1.4)!important;
	flex-direction: row!important;
	flex-wrap: nowrap!important;
	align-items: center!important;
	justify-content: flex-end!important;
	font-weight: bolder!important;
}
.monaco-workbench.monaco-workbench .part.titlebar .titlebar-container .window-appicon::after{
	content: "CEC-IDE";
	display: block;
	width: fit-content;
	margin: 0;
	padding: 0;
	transform: scale(0.8);
}
.monaco-workbench .part.titlebar>.titlebar-container .menubar{
	margin-left: 15px!important;
}
.file-icons-enabled .show-file-icons .vscode_getting_started_page-name-file-icon.file-icon:before, .file-icons-enabled .show-file-icons .webview-vs_code_release_notes-name-file-icon.file-icon:before{
	background-image: url(${logoImg})!important;
}
.monaco-workbench.vs-dark .part.editor>.content .editor-group-container .editor-group-watermark>.letterpress{
	background-image: url(${backImg})!important;
}
.gettingStarted .gettingStartedCategoriesContainer .header{
	background-image: url(${cecImg})!important;
	background-size: contain!important;
  background-repeat: no-repeat!important;
	width: 100%!important;
  height: 300px!important;
}
.gettingStarted .gettingStartedCategoriesContainer .header>*{
	display: none!important;
}
.gettingStarted .gettingStartedCategoriesContainer{
	transform: translateY(150px)!important;
	-webkit-transform: translateY(150px)!important;
	-moz-transform: translateY(150px)!important;
	-ms-transform: translateY(150px)!important;
	-o-transform: translateY(150px)!important;
}
`;
		const updatedCssContent = data + newCssCode;

		const writeCSS = () => {
			fs.writeFile(cssPath, updatedCssContent, 'utf8', err => {
				if (err) {
					console.error(err);
					vscode.window.showErrorMessage('很遗憾，国产化失败！');
					return;
				}
				vscode.window.showInformationMessage('已完成国产化，请重启vscode查看！');
			});
		};

		if (fs.existsSync(backupCssPath)) {
			writeCSS();
		} else {
			fs.writeFile(backupCssPath, data, 'utf8', err => {
				if (err) {
					console.error(err);
					vscode.window.showErrorMessage('很遗憾，国产化失败！');
					return;
				}
				writeCSS();
			});
		}

	});
}


function restoreCSS() {
	const vscodePath = vscode.env.appRoot;
	const cssName: string = vscode.version >= "1.38" ? 'workbench.desktop.main.css' : 'workbench.main.css';
	const cssPath = path.join(vscodePath, 'out', 'vs', 'workbench', cssName);
	const backupCssPath = path.join(vscodePath, 'out', 'vs', 'workbench', 'workbench.desktop.main.backups.css');

	// 检查是否存在备份文件
	if (fs.existsSync(backupCssPath)) {
		// 读取备份文件的内容
		const backupCssContent = fs.readFileSync(backupCssPath, 'utf8');

		// 将备份文件的内容覆盖到原始 CSS 文件
		fs.writeFileSync(cssPath, backupCssContent, 'utf8');

		// 删除备份文件
		fs.unlinkSync(backupCssPath);
		vscode.window.showInformationMessage('已恢复，请重启vscode查看！');
	}
}


async function readImageAsBase64(imagePath: string): Promise<string> {
	try {
		const data = await fs.promises.readFile(imagePath);
		const base64Image = "data:image/png;base64," + data.toString('base64');
		return base64Image;
	} catch (err) {
		console.error('Error reading image:', err);
		vscode.window.showErrorMessage('很遗憾，国产化失败！');
		throw err;
	}
}

function sidebarInit(context: vscode.ExtensionContext) {
	const sidebarPanel = new SidebarProvider(context.extensionUri, 'cec-sidebar-main.html', 'cec-sidebar-main.css', 'cec-sidebar-main.js');
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("cec-sidebar-main", sidebarPanel)
	);
}

function sensitiveWordDetectionInit(context: vscode.ExtensionContext) {
	fs.readFile(path.join(context.extensionPath, 'resource', 'text', 'SensitiveWordsEncryption.txt'), 'utf-8', (err, data) => {
		if (err) {
			console.error(err);
			vscode.window.showErrorMessage('敏感词检测出错！');
			return;
		}

		// 解密
		const password = 'chuckle';
		const decryptedText = decrypt(data, password);
		
		let sensitiveWordsArray = decryptedText.split('\n').map((word: string) => word.trim());
		const mint = new Mint(sensitiveWordsArray);

		let markCommand = vscode.commands.registerCommand('cec-ide.mark-sensitive-words', () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				checkForSensitiveWords(editor, mint);
			} else {
				vscode.window.showErrorMessage('No active text editor.');
			}
		});
		context.subscriptions.push(markCommand);
	});
}

// 加密函数
function encrypt(text: string, password: string) {
  const salt = crypto.randomBytes(16); // 生成随机的盐值
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256'); // 从密码生成密钥
  const iv = crypto.randomBytes(16); // 生成随机的初始化向量
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
}

// 解密函数
function decrypt(encryptedText: string, password: string) {
  const [saltHex, ivHex, encryptedData] = encryptedText.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256'); // 从密码生成密钥
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

