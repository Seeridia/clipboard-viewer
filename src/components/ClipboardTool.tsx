import React from 'react';
import { TextInput } from './TextInput';
import { FormatSelector } from './FormatSelector';
import { ActionButtons } from './ActionButtons';
import { StatusMessage } from './StatusMessage';
import { isClipboardAPISupported, isSecureContext } from '../utils/clipboard';
import { AlertTriangle, Clipboard } from 'lucide-react';

interface ClipboardToolProps {
  className?: string;
}

export const ClipboardTool: React.FC<ClipboardToolProps> = ({ 
  className = "" 
}) => {
  const hasClipboardSupport = isClipboardAPISupported();
  const isSecure = isSecureContext();
  const showWarning = !hasClipboardSupport || !isSecure;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* 状态消息 */}
      <StatusMessage />
      
      {/* 主标题 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Clipboard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          剪贴板写入工具
        </h1>
        <p className="text-gray-600">
          快速将文本内容复制到系统剪贴板，支持纯文本和HTML格式
        </p>
      </div>

      {/* 兼容性警告 */}
      {showWarning && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">兼容性提示</p>
              <ul className="list-disc list-inside space-y-1">
                {!isSecure && (
                  <li>当前环境不是安全上下文（HTTPS），某些功能可能受限</li>
                )}
                {!hasClipboardSupport && (
                  <li>浏览器不支持现代剪贴板API，将使用降级方案</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
        {/* 文本输入区域 */}
        <TextInput />
        
        {/* 格式选择器 */}
        <FormatSelector />
        
        {/* 操作按钮 */}
        <ActionButtons />
      </div>
      
      {/* 使用说明 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          在上方输入框中输入内容，选择复制格式，然后点击"复制到剪贴板"按钮
        </p>
        <p className="mt-1">
          支持键盘快捷键：<kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+V</kbd> 粘贴内容
        </p>
      </div>
    </div>
  );
};