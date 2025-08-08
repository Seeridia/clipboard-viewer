import React, { useEffect } from "react";
import { useClipboardStore } from "../store/useClipboardStore";
import { isClipboardReadSupported } from "../utils/clipboard";
import { Keyboard, AlertCircle, CheckCircle } from "lucide-react";

interface PasteDetectorProps {
  className?: string;
}

export const PasteDetector: React.FC<PasteDetectorProps> = ({
  className = "",
}) => {
  const { mode, parseStatus, enablePasteListener, disablePasteListener } =
    useClipboardStore();
  const isSupported = isClipboardReadSupported();
  const isActive = mode === "parse";

  useEffect(() => {
    if (isActive && isSupported) {
      enablePasteListener();
    } else {
      disablePasteListener();
    }

    // 清理函数
    return () => {
      disablePasteListener();
    };
  }, [isActive, isSupported, enablePasteListener, disablePasteListener]);

  if (!isActive) {
    return null;
  }

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {isSupported ? (
            <div className="p-2 bg-blue-100 rounded-full">
              <Keyboard className="w-5 h-5 text-blue-600" />
            </div>
          ) : (
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">粘贴检测器</h3>
            {parseStatus === "parsing" && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600">解析中...</span>
              </div>
            )}
            {parseStatus === "success" && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">解析成功</span>
              </div>
            )}
          </div>

          {isSupported ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                粘贴检测器已启用。使用{" "}
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  Ctrl+V
                </kbd>{" "}
                粘贴内容将自动触发剪贴板解析。
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">
                  监听中
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                当前环境不支持剪贴板读取功能。请确保：
              </p>
              <ul className="text-xs text-red-600 space-y-1 ml-4">
                <li>• 使用 HTTPS 协议或 localhost</li>
                <li>• 浏览器支持现代剪贴板 API</li>
                <li>• 已授予剪贴板访问权限</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
