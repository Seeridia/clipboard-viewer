import React from "react";
import { Clock, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useClipboardStore } from "../store/useClipboardStore";
import { HistoryItem } from "../types";

const HistoryViewer: React.FC = () => {
  const { history, toggleHistoryVisibility, clearHistory, loadHistoryItem } =
    useClipboardStore();

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return "刚刚";
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getDataTypesSummary = (historyItem: HistoryItem) => {
    const types = historyItem.parseResult.data.map((item) => item.type);
    const uniqueTypes = [...new Set(types)];
    return uniqueTypes.join(", ");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 历史记录头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">解析历史</h3>
          <span className="text-sm text-gray-500">
            ({history.items.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHistoryVisibility}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={history.isVisible ? "隐藏历史记录" : "显示历史记录"}
          >
            {history.isVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          {history.items.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="清空历史记录"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 历史记录列表 */}
      {history.isVisible && (
        <div className="max-h-96 overflow-y-auto">
          {history.items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-1">暂无历史记录</p>
              <p className="text-sm">解析剪贴板内容后，历史记录将显示在这里</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => loadHistoryItem(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.description}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        数据类型: {getDataTypesSummary(item)}
                      </div>
                      <div className="text-xs text-gray-500">
                        总大小:{" "}
                        {item.parseResult.data.reduce(
                          (sum, data) => sum + data.size,
                          0
                        )}{" "}
                        字节
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadHistoryItem(item);
                        }}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="加载此记录"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryViewer;
