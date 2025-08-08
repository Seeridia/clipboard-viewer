#!/bin/bash

# 版本同步脚本 - 统一管理项目版本号
# 使用方法: npm run version:sync <版本号>

set -e

if [ -z "$1" ]; then
    echo "❌ 请提供新版本号"
    echo "使用方法: npm run version:sync <版本号>"
    echo "例如: npm run version:sync 0.1.2"
    echo ""
    echo "或使用自动递增："
    echo "  npm run version:patch  # 修复版本 (0.1.2 → 0.1.3)"
    echo "  npm run version:minor  # 次要版本 (0.1.2 → 0.2.0)"
    echo "  npm run version:major  # 主要版本 (0.1.2 → 1.0.0)"
    exit 1
fi

NEW_VERSION="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 验证版本号格式
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$'; then
    echo "❌ 版本号格式无效，请使用语义化版本格式"
    echo "例如: 1.0.0, 0.1.2, 2.1.0-beta.1"
    exit 1
fi

echo "🔄 开始同步版本号到 $NEW_VERSION..."

# 1. 更新 package.json
echo "📝 更新 package.json..."
npm version "$NEW_VERSION" --no-git-tag-version

# 2. 更新 Cargo.toml
echo "📝 更新 src-tauri/Cargo.toml..."
sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" "$ROOT_DIR/src-tauri/Cargo.toml"

# 3. 更新 tauri.conf.json
echo "📝 更新 src-tauri/tauri.conf.json..."
if command -v jq >/dev/null 2>&1; then
    # 如果有 jq 命令，使用 jq 更新（更安全）
    jq ".version = \"$NEW_VERSION\"" "$ROOT_DIR/src-tauri/tauri.conf.json" > "$ROOT_DIR/src-tauri/tauri.conf.json.tmp"
    mv "$ROOT_DIR/src-tauri/tauri.conf.json.tmp" "$ROOT_DIR/src-tauri/tauri.conf.json"
else
    # 如果没有 jq，使用 sed（兼容性更好）
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$ROOT_DIR/src-tauri/tauri.conf.json"
fi

echo ""
echo "✅ 版本同步完成！"
echo "📦 新版本: $NEW_VERSION"
echo ""
echo "📋 已更新文件:"
echo "  • package.json"
echo "  • src-tauri/Cargo.toml"
echo "  • src-tauri/tauri.conf.json"
echo ""
echo "🔧 下一步请运行:"
echo "  npm run version:update-lock  # 更新锁文件"
