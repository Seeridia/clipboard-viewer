import { create } from 'zustand';
import { ClipboardFormat, AppState, StatusMessage, AppMode, ClipboardDataItem, ClipboardParseResult, HistoryItem } from '../types';
import { copyToClipboard, parseClipboardData, addPasteListener } from '../utils/clipboard';

interface ClipboardStore extends AppState {
  // 写入功能状态更新方法
  setContent: (content: string) => void;
  setFormat: (format: ClipboardFormat) => void;
  setStatus: (status: AppState['status']) => void;
  setMessage: (message: string) => void;
  
  // 解析功能状态更新方法
  setParseData: (data: ClipboardDataItem[]) => void;
  setParseStatus: (status: AppState['parseStatus']) => void;
  setParseMessage: (message: string) => void;
  
  // 模式切换
  setMode: (mode: AppMode) => void;
  
  // 写入功能业务操作方法
  handleCopy: () => Promise<void>;
  clearContent: () => void;
  clearMessage: () => void;
  
  // 解析功能业务操作方法
  handleParse: () => Promise<void>;
  clearParseData: () => void;
  clearParseMessage: () => void;
  
  // 粘贴监听
  enablePasteListener: () => void;
  disablePasteListener: () => void;
  
  // 历史记录管理
  addToHistory: (parseResult: ClipboardParseResult) => void;
  clearHistory: () => void;
  toggleHistoryVisibility: () => void;
  loadHistoryItem: (historyItem: HistoryItem) => void;
  
  // 状态消息管理
  statusMessage: StatusMessage;
  showStatusMessage: (type: StatusMessage['type'], message: string) => void;
  hideStatusMessage: () => void;
}

export const useClipboardStore = create<ClipboardStore>((set, get) => {
  let pasteListenerCleanup: (() => void) | null = null;
  
  return {
    // 初始状态
    content: '',
    format: 'text/plain',
    status: 'idle',
    message: '',
    
    // 解析功能状态
    parseData: [],
    parseStatus: 'idle',
    parseMessage: '',
    
    // 历史记录状态
    history: {
      items: [],
      maxItems: 20,
      isVisible: false
    },
    
    // 通用状态
    mode: 'parse',
    lastParseTime: undefined,
    
    statusMessage: {
      type: 'info',
      message: '',
      visible: false
    },

    // 写入功能状态更新方法
    setContent: (content: string) => set({ content }),
    
    setFormat: (format: ClipboardFormat) => set({ format }),
    
    setStatus: (status: AppState['status']) => set({ status }),
    
    setMessage: (message: string) => set({ message }),
    
    // 解析功能状态更新方法
    setParseData: (data: ClipboardDataItem[]) => set({ parseData: data }),
    
    setParseStatus: (status: AppState['parseStatus']) => set({ parseStatus: status }),
    
    setParseMessage: (message: string) => set({ parseMessage: message }),
    
    // 模式切换
    setMode: (mode: AppMode) => {
      set({ mode });
      if (mode === 'parse') {
        get().enablePasteListener();
      } else {
        get().disablePasteListener();
      }
    },

    // 写入功能业务操作方法
    handleCopy: async () => {
      const { content, format } = get();
      
      if (!content.trim()) {
        get().showStatusMessage('error', '请输入要复制的内容');
        return;
      }

      set({ status: 'copying' });
      
      try {
        const result = await copyToClipboard(content, format);
        
        if (result.success) {
          set({ status: 'success', message: result.message });
          get().showStatusMessage('success', result.message);
        } else {
          set({ status: 'error', message: result.message });
          get().showStatusMessage('error', result.message);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '复制失败';
        set({ status: 'error', message: errorMessage });
        get().showStatusMessage('error', errorMessage);
      }
      
      // 2秒后重置状态
      setTimeout(() => {
        set({ status: 'idle', message: '' });
      }, 2000);
    },

    // 清空内容
    clearContent: () => {
      set({ 
        content: '', 
        status: 'idle', 
        message: '' 
      });
      get().hideStatusMessage();
    },

    // 清空消息
    clearMessage: () => set({ message: '' }),
    
    // 解析功能业务操作方法
    handleParse: async () => {
      set({ parseStatus: 'parsing' });
      
      try {
        const result = await parseClipboardData();
        
        if (result.success) {
          set({ 
            parseStatus: 'success', 
            parseMessage: result.message,
            parseData: result.data,
            lastParseTime: result.timestamp
          });
          get().addToHistory(result);
          get().showStatusMessage('success', result.message);
        } else {
          set({ 
            parseStatus: 'error', 
            parseMessage: result.message,
            parseData: []
          });
          get().showStatusMessage('error', result.message);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '解析失败';
        set({ 
          parseStatus: 'error', 
          parseMessage: errorMessage,
          parseData: []
        });
        get().showStatusMessage('error', errorMessage);
      }
      
      // 2秒后重置状态
      setTimeout(() => {
        set({ parseStatus: 'idle', parseMessage: '' });
      }, 2000);
    },
    
    // 清空解析数据
    clearParseData: () => {
      set({ 
        parseData: [], 
        parseStatus: 'idle', 
        parseMessage: '',
        lastParseTime: undefined
      });
      get().hideStatusMessage();
    },
    
    // 清空解析消息
    clearParseMessage: () => set({ parseMessage: '' }),
    
    // 启用粘贴监听
    enablePasteListener: () => {
      if (pasteListenerCleanup) {
        pasteListenerCleanup();
      }
      
      pasteListenerCleanup = addPasteListener((result: ClipboardParseResult) => {
        if (result.success) {
          set({ 
            parseStatus: 'success', 
            parseMessage: result.message,
            parseData: result.data,
            lastParseTime: result.timestamp
          });
          get().addToHistory(result);
          get().showStatusMessage('success', '检测到粘贴操作，已自动解析剪贴板内容');
        } else {
          set({ 
            parseStatus: 'error', 
            parseMessage: result.message,
            parseData: []
          });
          get().showStatusMessage('error', result.message);
        }
      });
    },
    
    // 禁用粘贴监听
    disablePasteListener: () => {
      if (pasteListenerCleanup) {
        pasteListenerCleanup();
        pasteListenerCleanup = null;
      }
    },

    // 添加到历史记录
    addToHistory: (parseResult: ClipboardParseResult) => {
      const { history } = get();
      const newItem: HistoryItem = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: parseResult.timestamp,
        parseResult,
        description: `解析了 ${parseResult.data.length} 个数据项`
      };
      
      const newItems = [newItem, ...history.items];
      // 保持最大数量限制
      if (newItems.length > history.maxItems) {
        newItems.splice(history.maxItems);
      }
      
      set({
        history: {
          ...history,
          items: newItems
        }
      });
    },

    // 清空历史记录
    clearHistory: () => {
      const { history } = get();
      set({
        history: {
          ...history,
          items: []
        }
      });
      get().showStatusMessage('success', '历史记录已清空');
    },

    // 切换历史记录可见性
    toggleHistoryVisibility: () => {
      const { history } = get();
      set({
        history: {
          ...history,
          isVisible: !history.isVisible
        }
      });
    },

    // 加载历史记录项
    loadHistoryItem: (historyItem: HistoryItem) => {
      const { parseResult } = historyItem;
      set({
        parseData: parseResult.data,
        parseStatus: 'success',
        parseMessage: parseResult.message,
        lastParseTime: parseResult.timestamp
      });
      get().showStatusMessage('success', '已加载历史记录');
    },

    // 显示状态消息
    showStatusMessage: (type: StatusMessage['type'], message: string) => {
      set({
        statusMessage: {
          type,
          message,
          visible: true
        }
      });
      
      // 3秒后自动隐藏
      setTimeout(() => {
        get().hideStatusMessage();
      }, 3000);
    },

    // 隐藏状态消息
    hideStatusMessage: () => {
      set({
        statusMessage: {
          type: 'info',
          message: '',
          visible: false
        }
      });
    }
  };
});