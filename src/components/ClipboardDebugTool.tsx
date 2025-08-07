import React, { useEffect } from 'react';
import { useClipboardStore } from '../store/useClipboardStore';
import { TextInput } from './TextInput';
import { FormatSelector } from './FormatSelector';
import { ActionButtons } from './ActionButtons';
import { StatusMessage } from './StatusMessage';
import { PasteDetector } from './PasteDetector';
import { FormatAnalyzer } from './FormatAnalyzer';
import { DataViewer } from './DataViewer';
import HistoryViewer from './HistoryViewer';
import { ClipboardInspector } from './ClipboardInspector';
import { 
  addPasteListener, 
  addDropListener,
  isClipboardAPISupported, 
  isSecureContext
} from '../utils/clipboard';
import { AlertTriangle, Clipboard, Search, Edit3, Bug } from 'lucide-react';
import { AppMode } from '../types';

interface ClipboardDebugToolProps {
  className?: string;
}

export const ClipboardDebugTool: React.FC<ClipboardDebugToolProps> = ({ 
  className = "" 
}) => {
  const { mode, setMode, parseData, setParseData, setParseMessage, setParseStatus, addToHistory } = useClipboardStore();
  
  const hasClipboardSupport = isClipboardAPISupported();
  const isSecure = isSecureContext();
  const showWarning = !hasClipboardSupport || !isSecure;

  // 设置自动事件监听器
  useEffect(() => {
    let cleanupPaste: (() => void) | undefined;
    let cleanupDrop: (() => void) | undefined;
    
    if (mode === 'parse') {
      // 添加粘贴事件监听器
      cleanupPaste = addPasteListener((result) => {
        setParseData(result.data);
        setParseMessage(result.message);
        setParseStatus(result.success ? 'success' : 'error');
        
        if (result.success && result.data.length > 0) {
          addToHistory(result);
        }
      });
      
      // 添加拖放事件监听器
      cleanupDrop = addDropListener((result) => {
        setParseData(result.data);
        setParseMessage(result.message);
        setParseStatus(result.success ? 'success' : 'error');
        
        if (result.success && result.data.length > 0) {
          addToHistory(result);
        }
      });
    }
    
    return () => {
      cleanupPaste?.();
      cleanupDrop?.();
    };
  }, [mode, setParseData, setParseMessage, setParseStatus, addToHistory]);

  const tabs = [
    {
      id: 'parse' as AppMode,
      label: '解析模式', 
      icon: <Search className="w-4 h-4" />,
      description: '分析剪贴板内容'
    },
    {
      id: 'write' as AppMode,
      label: '写入模式',
      icon: <Edit3 className="w-4 h-4" />,
      description: '将内容复制到剪贴板'
    },
    {
      id: 'inspector' as AppMode,
      label: '环境检查',
      icon: <Bug className="w-4 h-4" />,
      description: '剪贴板环境诊断'
    }
  ];

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* 状态消息 */}
      <StatusMessage />
      
      {/* 主标题 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Clipboard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clipboard Viewer</h1>
        <p className="text-lg text-gray-600">强大的剪贴板内容查看和解析工具，支持多种数据格式</p>
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

      {/* 标签页导航 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  mode === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`mr-2 transition-colors ${
                  mode === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* 标签页描述 */}
        <div className="mt-4 text-center">

        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {mode === 'write' ? (
          /* 写入模式 */
          <div className="p-6 space-y-6">
            {/* 文本输入区域 */}
            <TextInput />
            
            {/* 格式选择器 */}
            <FormatSelector />
            
            {/* 操作按钮 */}
            <ActionButtons />
          </div>
        ) : mode === 'inspector' ? (
          /* 检查器模式 */
          <div className="p-6">
            <ClipboardInspector />
          </div>
        ) : (
          /* 解析模式 */
          <div className="space-y-6">
            {/* 粘贴检测器 */}
            <div className="p-6 border-b border-gray-200">
              <PasteDetector />
            </div>
            
            {/* 历史记录 */}
            <div className="px-6">
              <HistoryViewer />
            </div>
            
            {/* 解析结果 */}
            {parseData && (
              <div className="space-y-6">
                {/* 格式分析器 */}
                <div className="px-6">
                  <FormatAnalyzer />
                </div>
                
                {/* 数据详情 */}
                {parseData.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50/30">
                    <div className="px-6 py-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Search className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">数据详情</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              共发现 {parseData.length} 个数据项
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {parseData.length} 项
                        </div>
                      </div>
                      <div className="space-y-4">
                        {parseData.map((item, index) => (
                          <DataViewer 
                            key={`${item.type}-${index}`}
                            item={item} 
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 空状态 */}
            {!parseData && (
              <div className="px-6 pb-6 text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    等待剪贴板内容
                  </h3>
                  <p className="text-gray-500 max-w-sm">
                    使用 Ctrl+V 粘贴内容到此页面，或点击上方的"手动解析"按钮来分析当前剪贴板内容
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 使用说明 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {mode === 'write' ? (
          <div>
            <p>
              在上方输入框中输入内容，选择复制格式，然后点击"复制到剪贴板"按钮
            </p>
            <p className="mt-1">
              支持键盘快捷键：<kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+C</kbd> 复制内容
            </p>
          </div>
        ) : mode === 'inspector' ? (
          <div>
            <p>
              检查器提供详细的剪贴板环境信息和API兼容性诊断
            </p>
            <p className="mt-1">
              运行诊断可以检测浏览器支持、权限状态和API功能测试
            </p>
          </div>
        ) : (
          <div>
            <p>
              使用 <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+V</kbd> 粘贴内容进行分析，
              将文件或图片拖放到页面上，或点击"手动解析"按钮分析当前剪贴板内容
            </p>
            <p className="mt-1">
              支持文本、HTML、RTF、图片、文件等多种格式的详细分析和预览
            </p>
          </div>
        )}
      </div>
    </div>
  );
};