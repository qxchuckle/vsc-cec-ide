# CEC-IDE
国产化你的VSCode，附带敏感词检测、防沉迷等功能

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/e78c4a3a-f8b7-47d0-9971-fdc4ffff2ed8)

已上架VSCode插件市场[CEC-IDE](https://marketplace.visualstudio.com/items?itemName=qcqx.cec-ide)，Open VSX：[CEC-IDE](https://open-vsx.org/extension/qcqx/cec-ide)，下载vsix可前往[releases](https://github.com/qxchuckle/vsc-cec-ide/releases)

**命令：** Ctrl+Shift+P 打开命令中心
1. `CEC-IDE` 进行国产化（国产化只是修改VSC的UI样式，不执行也能使用敏感词等功能）
2. `CEC-IDE-RESTORE` 去除国产化

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/712346f4-61e5-4118-a650-cfab5bcfebcc)

**注意:**
1. 请确保以管理员身份运行VSCode。
2. 最好不要多次执行 `CEC-IDE`，除了首次，后续执行 `CEC-IDE` 前请先执行 `CEC-IDE-RESTORE`。若没能国产化，请提 Issues。
3. 提示code损坏请装 [Fix VSCode Checksums](https://marketplace.visualstudio.com/items?itemName=lehni.vscode-fix-checksums) 插件，然后执行 `Fix Checksums: Apply` 命令。

在设置中可以自定义侧边栏视图的一些信息：

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/fda2cb4f-e067-473d-93f4-091f108d7813)

## 实用功能

### 1、敏感词检测 

> 独立的敏感词检测插件：[sensitive-word-detection](https://github.com/qxchuckle/sensitive-word-detection) 是本插件敏感词检测功能的独立版本

在任意文件，右键，点击敏感词检测，将会持续检测该文件是否有敏感词，若文件关闭或没有敏感词，则停止检测。右键点击停止检测敏感词可以手动停止检测。即使换行(最多隔一行)且隔着干扰字符也能检测到。

**快捷键:** `alt+shift+m` 检测，`alt+shift+n` 停止检测。

**命令:**敏感词支持**热重载**
1. `CEC-UploadSensitiveWordsFile` 上传自定义敏感词txt文件，格式：一行一个敏感词。
2. `CEC-ResetSensitiveWordsFile` 重置为插件自带的敏感词。

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/9ef1cf17-5c01-4cc5-86ce-dd879e0dc60e)

有快速修复功能，一键替换该敏感词或所有敏感词为`***`

点击右下角状态栏按钮，也能开始检测或停止检测，且在检测中会显示当前活动编辑器含有的敏感词数。

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/ecfaa61c-d369-446b-9ec6-7e2b8f559ee7)

敏感词来源：[tencent-sensitive-words](https://github.com/cjh0613/tencent-sensitive-words) 【有删改】

### 2、防沉迷
启用防沉迷模式后（默认关闭），右下角会新增一个状态栏项，记录当天编辑器使用时间。若超过所设置的防沉迷时间（默认2小时），则会提醒关闭编辑器，每分钟弹一次提醒。

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/14cf0ec9-55b0-4cc8-b34d-fa9ca6d9d7df)

若未启用防沉迷模式，则每次打开编辑器，都会提醒开启防沉迷模式。

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/2a318e33-4dd3-4323-84e2-83d294238ff3)

可以在设置中对防沉迷模式进行自定义规则，包括关闭防沉迷提醒、关闭提醒开启防沉迷模式等。

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/44ff083d-5cb4-4aca-a2d9-4d2f0b3500f3)

## 展示

![VeryCapture_20230829231751](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/04f3848a-cb7d-4f90-b4ca-7f699d742edf)

## VSC图标修改

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/984daf13-e4e9-4658-b44a-caa97e57ecba)

软件的图标修改插件做不到

请下载仓库内 **CEC-IDE.ico** 自行右键-属性-更改图标（对于MacOS用户，请使用 CEC-IDE.icns）

***

> 整活项目，顺带学习下VSCode插件开发。  
> 本项目仅供个人学习使用。图片等资源来源于互联网，如有侵权请联系删除。

***
