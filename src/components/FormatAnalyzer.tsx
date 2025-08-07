import React from 'react';
import { useClipboardStore } from '../store/useClipboardStore';
import { FileText } from 'lucide-react';

interface FormatAnalyzerProps {
  className?: string;
}

export const FormatAnalyzer: React.FC<FormatAnalyzerProps> = ({ 
  className = "" 
}) => {
  const { parseData, parseStatus, lastParseTime, handleParse, clearParseData } = useClipboardStore();
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">格式分析器</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleParse}
            disabled={parseStatus === 'parsing'}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {parseStatus === 'parsing' ? '解析中...' : '手动解析'}
          </button>
          {parseData.length > 0 && (
            <button
              onClick={clearParseData}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              清空数据
            </button>
          )}
        </div>
      </div>

      {/* 解析结果 */}
      {parseData.length > 0 ? (
        <div className="space-y-4">
          {/* 统计信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">
                共发现 <strong>{parseData.length}</strong> 个数据项
              </span>
              {lastParseTime && (
                <span className="text-blue-600">
                  解析时间: {formatTime(lastParseTime)}
                </span>
              )}
            </div>
          </div>


        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">暂无解析数据</h4>
          <p className="text-gray-500 mb-4">
            使用 Ctrl+V 粘贴内容或点击"手动解析"按钮来分析剪贴板内容
          </p>
        </div>
      )}
    </div>
  );
};