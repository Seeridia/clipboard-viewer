# 版本管理指南

现在项目已经配置了统一的版本管理系统！你可以在一个地方更改版本号，所有相关文件都会自动同步更新。

## 🚀 使用方法

### 1. 手动指定版本号
```bash
npm run version:sync 0.1.3
```

### 2. 自动递增版本号（推荐）
```bash
# 修复版本 (0.1.2 → 0.1.3)
npm run version:patch

# 次要版本 (0.1.2 → 0.2.0)  
npm run version:minor

# 主要版本 (0.1.2 → 1.0.0)
npm run version:major
```

### 3. 更新锁文件
```bash
npm run version:update-lock
```

## 📁 自动更新的文件

脚本会自动同步以下文件的版本号：
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `package-lock.json` (通过 npm install)
- `src-tauri/Cargo.lock` (通过 cargo update)

## 🔧 工作流程

1. **开发完成后，准备发布新版本：**
   ```bash
   # 例如修复了一个 bug，递增修复版本
   npm run version:patch
   
   # 或手动指定版本
   npm run version:sync 0.1.5
   ```

2. **更新锁文件：**
   ```bash
   npm run version:update-lock
   ```

3. **提交更改：**
   ```bash
   git add .
   git commit -m "chore: bump version to 0.1.3"
   git tag v0.1.3
   git push && git push --tags
   ```

## 💡 优势

- ✅ **一致性**：所有文件版本号保持同步
- ✅ **便捷性**：一条命令更新所有版本
- ✅ **错误减少**：避免手动更新遗漏文件
- ✅ **语义化版本**：支持标准的语义化版本管理

## 🛠 脚本位置

- 版本同步脚本：`scripts/sync-version.sh`

现在你可以轻松地管理项目版本了！🎉
