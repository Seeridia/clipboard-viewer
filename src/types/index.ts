// 剪贴板格式类型
export type ClipboardFormat = 'text/plain' | 'text/html' | 'text/rtf';

// 剪贴板数据类型
export type ClipboardDataType = 
  | 'text/plain' 
  | 'text/html' 
  | 'text/rtf'
  | 'image/png' 
  | 'image/jpeg' 
  | 'image/gif' 
  | 'image/webp'
  | 'image/svg+xml'
  | 'image/bmp'
  | 'image/tiff'
  | 'application/json'
  | 'application/xml'
  | 'application/pdf'
  | 'files' 
  | 'unknown';

// 文件信息接口
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  url: string;
}

// 剪贴板数据项接口
export interface ClipboardDataItem {
  type: ClipboardDataType;
  content: string | File | Blob | FileInfo;
  size: number;
  preview?: string;
  metadata?: {
    mimeType?: string;
    formattedSize?: string;
    encoding?: string;
    language?: string;
    charset?: string;
    transferEncoding?: string;
    [key: string]: unknown;
  };
}

// 剪贴板解析结果接口
export interface ClipboardParseResult {
  success: boolean;
  message: string;
  data: ClipboardDataItem[];
  timestamp: number;
}

// 应用功能模式
export type AppMode = 'write' | 'parse' | 'inspector';

// 应用状态接口
export interface AppState {
  // 写入功能状态
  content: string;
  format: ClipboardFormat;
  status: 'idle' | 'copying' | 'success' | 'error';
  message: string;
  
  // 解析功能状态
  parseData: ClipboardDataItem[];
  parseStatus: 'idle' | 'parsing' | 'success' | 'error';
  parseMessage: string;
  
  // 历史记录状态
  history: HistoryState;
  
  // 通用状态
  mode: AppMode;
  lastParseTime?: number;
}

// 复制操作结果接口
export interface CopyResult {
  success: boolean;
  message: string;
}

// 状态消息类型
export type StatusType = 'success' | 'error' | 'info';

// 状态消息接口
export interface StatusMessage {
  type: StatusType;
  message: string;
  visible: boolean;
}

// 历史记录项接口
export interface HistoryItem {
  id: string;
  timestamp: number;
  parseResult: ClipboardParseResult;
  description: string;
}

// 历史记录状态接口
export interface HistoryState {
  items: HistoryItem[];
  maxItems: number;
  isVisible: boolean;
}