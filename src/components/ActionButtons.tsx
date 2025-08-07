import React from 'react';
import { useClipboardStore } from '../store/useClipboardStore';
import { Copy, Trash2, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  className = "" 
}) => {
  const { 
    content, 
    status, 
    handleCopy, 
    clearContent 
  } = useClipboardStore();

  const isLoading = status === 'copying';
  const hasContent = content.trim().length > 0;

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* 复制按钮 */}
      <button
        onClick={handleCopy}
        disabled={!hasContent || isLoading}
        className={
          "flex items-center justify-center px-6 py-3 rounded-lg " +
          "font-medium text-sm transition-all duration-200 " +
          "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
          "disabled:cursor-not-allowed " +
          (hasContent && !isLoading
            ? "bg-blue-600 hover:bg-blue-700 text-white " +
              "focus:ring-blue-500 shadow-sm hover:shadow-md"
            : "bg-gray-300 text-gray-500 cursor-not-allowed")
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            复制中...
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            复制到剪贴板
          </>
        )}
      </button>

      {/* 清空按钮 */}
      <button
        onClick={clearContent}
        disabled={!hasContent || isLoading}
        className={
          "flex items-center justify-center px-6 py-3 rounded-lg " +
          "font-medium text-sm transition-all duration-200 " +
          "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
          "disabled:cursor-not-allowed " +
          (hasContent && !isLoading
            ? "bg-gray-600 hover:bg-gray-700 text-white " +
              "focus:ring-gray-500 shadow-sm hover:shadow-md"
            : "bg-gray-200 text-gray-400 cursor-not-allowed")
        }
      >
        <Trash2 className="w-4 h-4 mr-2" />
        清空内容
      </button>
    </div>
  );
};