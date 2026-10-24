# Clipboard Viewer

一个基于 React + TypeScript 的剪贴板查看器网页应用，同时支持桌面版本。

## 在线体验

🌐 **网页版本**: [clipboard-viewer.seeridia.top](https://clipboard-viewer.seeridia.top)

本应用主要部署在网页上，提供便捷的在线剪贴板查看和分析功能。你可以直接访问网页版本来体验所有功能，无需下载安装桌面应用。

## 技术栈

- **前端**: React + TypeScript + Vite
- **UI**: Tailwind CSS
- **桌面**: Tauri v2
- **状态管理**: Zustand

## 快速开始

### 环境要求

使用 Node.js 24 LTS（版本见 `.node-version`），桌面构建还需要 Rust stable 和对应平台的 Tauri 系统依赖。

### 安装依赖

```bash
npm ci
```

### 开发
```bash
npm run tauri:dev
```

### 构建
```bash
npm run tauri:build
```

## 功能特性

- ✨ 剪贴板内容实时监控
- 📋 多格式数据查看（文本、图片、HTML等）
- 🔍 历史记录搜索
- 🎨 现代化 UI 设计
- ⚡ 原生性能，体积小巧
- 🌐 **网页版本可直接使用，无需安装**

## 项目结构

```
├── src/                 # React 前端
│   ├── components/      # 组件
│   ├── hooks/          # 自定义 hooks
│   ├── store/          # 状态管理
│   └── utils/          # 工具函数
├── src-tauri/          # Tauri 后端
│   ├── src/            # Rust 代码
│   └── icons/          # 应用图标
└── dist/               # 构建输出
```

## 开发命令

```bash
npm run dev             # 前端开发服务器
npm run build           # 构建网页版本
npm run tauri:dev       # Tauri 开发模式
npm run tauri:build     # 构建桌面应用
npm run lint            # 代码检查
```

> **提示**: 网页版本使用 `npm run build` 构建，桌面版本使用 `npm run tauri:build` 构建。
