# CEC-IDE

国产化你的VSCode，附带敏感词检测等功能

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/e78c4a3a-f8b7-47d0-9971-fdc4ffff2ed8)

English document at the end of the text

已上架VSCode插件市场[CEC-IDE](https://marketplace.visualstudio.com/items?itemName=qcqx.cec-ide)

下载vsix可前往[releases](https://github.com/qxchuckle/vsc-cec-ide/releases)

**命令：** Ctrl+Shift+P 打开命令中心
1. `CEC-IDE` 进行国产化
2. `CEC-IDE-RESTORE` 去除国产化

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/712346f4-61e5-4118-a650-cfab5bcfebcc)

**注意:**
1. 请确保以管理员身份运行VSCode。
2. 最好不要多次执行 `CEC-IDE`，除了首次，后续执行 `CEC-IDE` 前请先执行 `CEC-IDE-RESTORE`。若没能国产化，请提 Issues。
3. 提示code损坏请装 [Fix VSCode Checksums](https://marketplace.visualstudio.com/items?itemName=lehni.vscode-fix-checksums) 插件，然后执行 `Fix Checksums: Apply` 命令。

## 实用功能

### 1、敏感词检测 

在任意文件，右键，点击敏感词检测，将会持续检测该文件是否有敏感词，若文件关闭或没有敏感词，则停止检测。右键点击停止检测敏感词可以手动停止检测。

**快捷键:** `alt+shift+m` 检测，`alt+shift+n` 停止检测。

**命令:**
1. `CEC-UploadSensitiveWordsFile` 上传自定义敏感词txt文件，格式：一行一个敏感词。
2. `CEC-ResetSensitiveWordsFile` 重置为插件自带的敏感词。

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/49e49ff2-8db6-4dac-ba3b-94899db3e226)

0.1.3 版本后新增了快速修复功能，一键替换为***

点击右下角状态栏按钮，也能开始检测或停止检测，且在检测中会显示当前活动编辑器含有的敏感词数。

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/ecfaa61c-d369-446b-9ec6-7e2b8f559ee7)

敏感词来源：[tencent-sensitive-words](https://github.com/cjh0613/tencent-sensitive-words) 【有删改】

## 这下自主创新了

![VeryCapture_20230829231751](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/04f3848a-cb7d-4f90-b4ca-7f699d742edf)

接下来，本项目将进一步聚焦解决数字产业核心技术的“卡脖子”难题，牵住数字关键核心技术自主创新这个“牛鼻子”，强化自主创新项目整合，善用GITEE建设形成的人才聚集效应，切实提高数字关键核心技术创新能力，持续彰显科技创新示范效应。

## VSC图标修改

![image](https://github.com/qxchuckle/vsc-cec-ide/assets/55614189/984daf13-e4e9-4658-b44a-caa97e57ecba)

软件的图标修改插件做不到

请下载仓库内 **CEC-IDE.ico** 自行右键-属性-更改图标

## CEC-IDE English Document

Differentiate your VSCode with Chinese characteristics

The plugin has been launched in the VSCode plugin market[CEC-IDE](https://marketplace.visualstudio.com/items?itemName=qcqx.cec-ide)

**Command:**
1. `CEC-IDE` for Chinese characteristics
2. `CEC-IDE RESTORE` Remove Chinese characteristics

**Attention:**
1. Please ensure to run VSCode as an administrator.
2. It is best not to execute `CEC-IDE` multiple times. Except for the first time, please execute `CEC-IDE RESTORE` before executing `CEC-IDE` in the future. If localization is not possible, please mention Issues.
3. If the code is damaged, please install the [Fix VSCode Checksums](https://marketplace.visualstudio.com/items?itemName=lehni.vscode-fix-checksums) plugin and execute the `Fix Checksums: Apply` command.

Next, this project will further focus on solving the "bottleneck" problem of core technologies in the digital industry, holding onto the "bull nose" of independent innovation in digital key core technologies, strengthening the integration of independent innovation projects, making good use of the talent aggregation effect formed by the construction of GITEE, effectively improving the innovation ability of digital key core technologies, and continuously demonstrating the demonstration effect of technological innovation.

## Practical functions

### 1、Sensitive word detection for Chinese characteristics

In any file, right-click and click on Sensitive Word Detection to continuously detect whether the file has sensitive words. If the file is closed or does not have sensitive words, detection will stop.

Source of sensitive words: [tense sensitive words](https://github.com/cjh0613/tencent-sensitive-words) with deletion and modification

**Command:**
1. `CEC UploadSensitiveWordsFile` Upload a custom sensitive word txt file in the format of one sensitive word per line.
2. `CEC ResetSensiveWordsFile` Reset to the sensitive words that come with the plugin.

***

> 整活项目，顺带学习下VSCode插件开发。
> 本项目仅供个人学习使用。图片等资源来源于互联网，如有侵权请联系删除。

***
