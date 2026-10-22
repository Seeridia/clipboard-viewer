# Clipboard Viewer UI 验收

final result: passed

## 设计与行为

- 沿用用户提供的 Speedtest | Sukka 参考：浅灰背景、白色圆角卡片、无新增常驻边框。增大正文与辅助字号，移除冗余说明。
- 紧凑的解析、写入、环境检查模式位于标题旁；各格式使用独立内容卡片。
- 历史记录在右侧模态抽屉打开，显示摘要、格式、时间和大小；选择后恢复内容与来源，并自动收起。支持 Esc、遮罩关闭、焦点返回、Tab 循环和背景滚动锁定。
- 解析页突出平台对应的粘贴快捷键；直接读取作为备选，准确显示粘贴、读取、拖入来源。空粘贴事件回退到读取时保留真实来源及失败状态，空结果不加入历史。
- 元数据使用概览与数值卡片展示 MIME、大小、语言、编码及文本统计；HTML、JSON、RTF、文件信息按字段分组，保留零值和布尔状态。语言与编码标明推测。
- 本地提供 Barlow Semi Condensed 400/500/600/700 WOFF2，应用于西文与数字；中文使用系统回退，代码保留等宽字体。许可证随构建保存在 licenses/BarlowSemiCondensed-OFL.txt。

## 验证

- npm run lint、npm run build、git diff --check 通过。
- 浏览器实际验证纯文本和 HTML 粘贴、直接读取、恢复历史、关闭方式、焦点返回及全屏元数据滚动。
- 320px、390px、1440px 布局检查无水平溢出；320px 元数据卡片无内部水平溢出。
- 对比度按普通文字至少 4.5:1、必要非文字信息至少 3:1 判断。全局样式、历史及粘贴流程、元数据分别检查 431、149、265 项颜色组合，均无失败；已检查普通文字最低 4.7138:1。
- 文本样例的 137 字节、3 行、8 词、73 字符、66 非空白字符与分析结果一致；HTML 样例的元素和样式统计、零值显示已验证。
- 剪贴板回归夹具五项通过：粘贴保留 plain/html/RTF 且不额外读取；直接读取来源；空粘贴回退来源；失败传播；拖入来源与监听清理。RTF 为程序夹具验证。
- 四个本地字体资源正确提供 WOFF2，构建包含字体文件，浏览器样式和渲染检查通过。

## 依据与范围

- [WCAG 文字对比度](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 非文字对比度](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [MDN clipboardData](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData)
- [MDN Clipboard.read](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read)

粘贴通常可以提供更完整的格式，但不承诺所有浏览器与来源均一致。本次检查不含用户粘贴 HTML/图片本身的配色，不代表所有 WCAG 条款的全面认证；未启动原生 Tauri 应用。
