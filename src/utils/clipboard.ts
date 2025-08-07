import { ClipboardFormat, CopyResult, ClipboardParseResult, ClipboardDataItem, ClipboardDataType, FileInfo } from '../types';

// 提取的剪贴板数据接口
interface ExtractedClipboardData {
  type: 'DataTransfer' | 'ClipboardItem';
  types?: Array<{
    type: string;
    data: string | FileInfo;
  }>;
  items?: Array<{
    kind: string;
    type: string;
    as_file: FileInfo | null;
  }> | null;
  files?: Array<FileInfo | null> | null;
}

// 文件信息辅助函数
const createFileInfo = (file: File | null): FileInfo | null => {
  if (!file) return null;
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file)
  };
};

// 核心数据提取函数，完全按照 clipboard-inspector 的方式
const extractClipboardData = async (data: DataTransfer | ClipboardItem): Promise<ExtractedClipboardData | undefined> => {
  if (!data) {
    return undefined;
  }

  if (data instanceof DataTransfer) {
    return {
      type: 'DataTransfer',
      types: Array.from(data.types).map(type => ({
        type,
        data: data.getData(type)
      })),
      items: data.items
        ? Array.from(data.items).map(item => ({
            kind: item.kind,
            type: item.type,
            as_file: createFileInfo(item.getAsFile())
          }))
        : null,
      files: data.files ? Array.from(data.files).map(createFileInfo) : null
    };
  }

  if (data instanceof ClipboardItem) {
    return {
      type: 'ClipboardItem',
      types: await Promise.all(
        Array.from(data.types).map(async type => {
          const blob = await data.getType(type);
          return {
            type: type,
            data: blob.type.match(/^text\//)
              ? await blob.text()
              : createFileInfo(blob as File) || ''
          };
        })
      )
    };
  }

  return undefined;
};

/**
 * 转换为我们的数据格式
 */
const convertToClipboardDataItems = async (extractedData: ExtractedClipboardData | undefined): Promise<ClipboardDataItem[]> => {
  if (!extractedData) return [];

  const results: ClipboardDataItem[] = [];
  const processedFiles = new Set<string>(); // 用于文件去重

  // 处理 types 数据
  if (extractedData.types) {
    for (const typeData of extractedData.types) {
      if (typeData.data) {
        const detectedType = detectDataType(typeData.type, typeof typeData.data === 'string' ? typeData.data : undefined);
        const metadata = typeof typeData.data === 'string' 
          ? await analyzeContent(typeData.data, typeData.type)
          : {};
        
        results.push({
          type: detectedType,
          content: typeData.data,
          size: typeof typeData.data === 'string' ? new Blob([typeData.data]).size : (typeData.data as FileInfo).size,
          metadata: {
            ...metadata,
            source: extractedData.type === 'DataTransfer' ? 'datatransfer-types' : 'clipboarditem-types',
            mimeType: typeData.type
          }
        });
      }
    }
  }

  // 处理 files 数据（优先处理，因为信息更完整）
  if (extractedData.files) {
    for (const file of extractedData.files) {
      if (file) {
        // 创建文件唯一标识符
        const fileKey = `${file.name}-${file.size}-${file.type}`;
        if (processedFiles.has(fileKey)) {
          continue;
        }
        processedFiles.add(fileKey);

        const detectedType = detectDataType(file.type);
        
        results.push({
          type: detectedType,
          content: file,
          size: file.size,
          preview: file.type.startsWith('image/') ? file.url : undefined,
          metadata: {
            source: 'datatransfer-files',
            mimeType: file.type,
            fileInfo: file
          }
        });
      }
    }
  }

  // 处理 items 数据（仅处理未重复的文件）
  if (extractedData.items) {
    for (const item of extractedData.items) {
      if (item.as_file) {
        const file = item.as_file;
        // 创建文件唯一标识符
        const fileKey = `${file.name}-${file.size}-${file.type}`;
        if (processedFiles.has(fileKey)) {
          continue; // 跳过已处理的文件
        }
        processedFiles.add(fileKey);

        const detectedType = detectDataType(file.type);
        
        results.push({
          type: detectedType,
          content: file,
          size: file.size,
          preview: file.type.startsWith('image/') ? file.url : undefined,
          metadata: {
            source: 'datatransfer-items',
            mimeType: file.type,
            fileInfo: file,
            itemKind: item.kind,
            itemType: item.type
          }
        });
      }
    }
  }

  return results;
};

/**
 * 使用现代 Clipboard API 写入剪贴板
 */
const copyWithClipboardAPI = async (content: string, format: ClipboardFormat): Promise<CopyResult> => {
  if (!navigator.clipboard) {
    throw new Error('浏览器不支持 Clipboard API');
  }

  const clipboardItem = new ClipboardItem({
    [format]: new Blob([content], { type: format })
  });

  await navigator.clipboard.write([clipboardItem]);
  return { success: true, message: '复制成功！' };
};

/**
 * 降级方案：使用 document.execCommand
 */
const copyWithExecCommand = (content: string): CopyResult => {
  try {
    // 创建临时文本区域
    const textArea = document.createElement('textarea');
    textArea.value = content;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // 选择并复制
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return { success: true, message: '复制成功！' };
    } else {
      throw new Error('execCommand 复制失败');
    }
  } catch (error) {
    return { 
      success: false, 
      message: `复制失败：${error instanceof Error ? error.message : '未知错误'}` 
    };
  }
};

/**
 * 主要的剪贴板写入函数
 * 优先使用现代 Clipboard API，失败时降级到 execCommand
 */
export const copyToClipboard = async (content: string, format: ClipboardFormat): Promise<CopyResult> => {
  // 检查内容是否为空
  if (!content.trim()) {
    return { success: false, message: '内容不能为空' };
  }

  try {
    // 优先尝试现代 Clipboard API
    return await copyWithClipboardAPI(content, format);
  } catch (error) {
    console.warn('Clipboard API 失败，尝试降级方案:', error);
    
    // 降级到 execCommand（只支持纯文本）
    if (format === 'text/html') {
      console.warn('降级方案不支持 HTML 格式，将以纯文本复制');
    }
    
    return copyWithExecCommand(content);
  }
};

/**
 * 检查浏览器是否支持 Clipboard API
 */
export const isClipboardAPISupported = (): boolean => {
  return !!navigator.clipboard && !!window.ClipboardItem;
};

/**
 * 检查是否在安全上下文中（HTTPS 或 localhost）
 */
export const isSecureContext = (): boolean => {
  return window.isSecureContext || location.hostname === 'localhost';
};

/**
 * 获取文件大小的可读格式
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 检测剪贴板数据类型
 */
export const detectDataType = (mimeType: string, content?: string | Blob | File): ClipboardDataType => {
  // 标准化 MIME 类型
  const normalizedType = mimeType.toLowerCase().trim();
  
  // 特殊处理常见的问题类型
  if (normalizedType === 'text' || normalizedType === '') {
    // 如果有内容，进一步分析
    if (typeof content === 'string') {
      return detectDataType('text/plain', content);
    }
    return 'text/plain';
  }
  
  // 文本类型
  if (normalizedType === 'text/plain') return 'text/plain';
  if (normalizedType === 'text/html') return 'text/html';
  if (normalizedType === 'text/rtf' || normalizedType === 'application/rtf') return 'text/rtf';
  
  // 图片类型
  if (normalizedType === 'image/png') return 'image/png';
  if (normalizedType === 'image/jpeg' || normalizedType === 'image/jpg') return 'image/jpeg';
  if (normalizedType === 'image/gif') return 'image/gif';
  if (normalizedType === 'image/webp') return 'image/webp';
  if (normalizedType === 'image/svg+xml') return 'image/svg+xml';
  if (normalizedType === 'image/bmp') return 'image/bmp';
  if (normalizedType === 'image/tiff') return 'image/tiff';
  
  // 应用程序类型
  if (normalizedType === 'application/json') return 'application/json';
  if (normalizedType === 'application/xml' || normalizedType === 'text/xml') return 'application/xml';
  if (normalizedType === 'application/pdf') return 'application/pdf';
  
  // 文件类型检测 - 通过内容或文件扩展名
  if (content instanceof File) {
    const fileName = content.name.toLowerCase();
    if (fileName.endsWith('.rtf')) return 'text/rtf';
    if (fileName.endsWith('.json')) return 'application/json';
    if (fileName.endsWith('.xml')) return 'application/xml';
    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'text/html';
    if (fileName.endsWith('.txt')) return 'text/plain';
    
    // 图片文件扩展名检测
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
    if (fileName.endsWith('.png')) return 'image/png';
    if (fileName.endsWith('.gif')) return 'image/gif';
    if (fileName.endsWith('.webp')) return 'image/webp';
    if (fileName.endsWith('.svg')) return 'image/svg+xml';
    if (fileName.endsWith('.bmp')) return 'image/bmp';
    if (fileName.endsWith('.tiff') || fileName.endsWith('.tif')) return 'image/tiff';
    
    // 如果有 MIME 类型但没有匹配到具体类型，使用通用检测
    if (content.type) {
      return detectDataType(content.type);
    }
    
    return 'files';
  }
  
  // 通过内容智能检测
  if (typeof content === 'string') {
    // 空内容检查
    if (!content.trim()) {
      return normalizedType.startsWith('text/') ? 'text/plain' : 'unknown';
    }
    
    // JSON 内容检测
    if ((content.trim().startsWith('{') && content.trim().endsWith('}')) ||
        (content.trim().startsWith('[') && content.trim().endsWith(']'))) {
      try {
        JSON.parse(content);
        return 'application/json';
      } catch {
        // 不是有效的 JSON，继续其他检测
      }
    }
    
    // XML/HTML 内容检测
    if (content.trim().startsWith('<?xml')) {
      return 'application/xml';
    }
    if (content.trim().startsWith('<!DOCTYPE html') || 
        content.trim().startsWith('<html')) {
      return 'text/html';
    }
    if (content.trim().startsWith('<') && content.trim().endsWith('>')) {
      // 可能是 HTML 片段或 XML
      return normalizedType === 'text/html' || normalizedType.includes('html') ? 'text/html' : 'application/xml';
    }
    
    // RTF 内容检测
    if (content.startsWith('{\\rtf')) {
      return 'text/rtf';
    }
    
    // 如果看起来像 URL
    if (content.match(/^https?:\/\//)) {
      return 'text/plain';
    }
  }
  
  // 通用类型检测
  if (normalizedType.startsWith('text/')) return 'text/plain';
  if (normalizedType.startsWith('image/')) {
    // 对于未知的图片类型，默认为 PNG
    return 'image/png';
  }
  if (normalizedType.startsWith('application/')) {
    // 检查是否是已知的应用程序类型
    if (normalizedType.includes('json')) return 'application/json';
    if (normalizedType.includes('xml')) return 'application/xml';
    if (normalizedType.includes('pdf')) return 'application/pdf';
  }
  
  // 如果所有检测都失败，根据内容类型返回合理的默认值
  if (typeof content === 'string') {
    return 'text/plain';
  }
  
  return 'unknown';
};

/**
 * 分析文本内容的编码和语言信息
 */
const analyzeTextContent = (content: string, mimeType: string): { encoding?: string; language?: string; charset?: string } => {
  const metadata: { encoding?: string; language?: string; charset?: string } = {};
  
  // 从 MIME 类型中提取字符集信息
  const charsetMatch = mimeType.match(/charset=([^;]+)/i);
  if (charsetMatch) {
    metadata.charset = charsetMatch[1].trim();
  }
  
  // 简单的语言检测（基于字符范围）
  if (/[\u4e00-\u9fff]/.test(content)) {
    metadata.language = 'zh-CN';
  } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(content)) {
    metadata.language = 'ja';
  } else if (/[\uac00-\ud7af]/.test(content)) {
    metadata.language = 'ko';
  } else if (/[а-яё]/i.test(content)) {
    metadata.language = 'ru';
  } else if (/[αβγδεζηθικλμνξοπρστυφχψω]/i.test(content)) {
    metadata.language = 'el';
  } else {
    metadata.language = 'en';
  }
  
  // 编码检测（简单实现）
  if (content.includes('\ufffd')) {
    metadata.encoding = 'corrupted';
  } else {
    metadata.encoding = 'utf-8';
  }
  
  return metadata;
};

/**
 * 增强的文本内容分析
 */
const analyzeTextStructure = (content: string, type: ClipboardDataType): Record<string, unknown> => {
  const analysis: Record<string, unknown> = {};
  
  if (type === 'text/html') {
    // HTML 特定分析
    const hasDoctype = /<!DOCTYPE/i.test(content);
    const hasHtmlTag = /<html[^>]*>/i.test(content);
    const hasHeadTag = /<head[^>]*>/i.test(content);
    const hasBodyTag = /<body[^>]*>/i.test(content);
    
    // 提取标题
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/is);
    if (titleMatch) {
      analysis.title = titleMatch[1].trim();
    }
    
    // 统计各种元素
    const imgCount = (content.match(/<img[^>]*>/gi) || []).length;
    const linkCount = (content.match(/<a[^>]*>/gi) || []).length;
    const tableCount = (content.match(/<table[^>]*>/gi) || []).length;
    const formCount = (content.match(/<form[^>]*>/gi) || []).length;
    
    analysis.structure = {
      hasDoctype,
      hasHtmlTag,
      hasHeadTag,
      hasBodyTag,
      isComplete: hasDoctype && hasHtmlTag && hasHeadTag && hasBodyTag,
      elements: {
        images: imgCount,
        links: linkCount,
        tables: tableCount,
        forms: formCount
      }
    };
    
    // 提取CSS和JavaScript
    const styleCount = (content.match(/<style[^>]*>/gi) || []).length;
    const scriptCount = (content.match(/<script[^>]*>/gi) || []).length;
    const inlineStyleCount = (content.match(/style\s*=/gi) || []).length;
    
    analysis.styling = {
      styleTags: styleCount,
      scriptTags: scriptCount,
      inlineStyles: inlineStyleCount
    };
  } else if (type === 'text/rtf') {
    // RTF 特定分析
    const hasRtfHeader = content.startsWith('{\\rtf');
    const versionMatch = content.match(/\\rtf(\d+)/);
    const charsetMatch = content.match(/\\ansi|\\mac|\\pc|\\pca/);
    
    analysis.rtfInfo = {
      hasValidHeader: hasRtfHeader,
      version: versionMatch ? parseInt(versionMatch[1]) : null,
      charset: charsetMatch ? charsetMatch[0].substring(1) : null
    };
  } else if (type === 'application/json') {
    // JSON 特定分析
    try {
      const parsed = JSON.parse(content);
      analysis.jsonInfo = {
        isValid: true,
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
        keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0
      };
    } catch {
      analysis.jsonInfo = {
        isValid: false,
        error: 'Invalid JSON'
      };
    }
  }
  
  // 通用文本统计
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).filter(word => word.length > 0).length;
  const characters = content.length;
  const charactersNoSpaces = content.replace(/\s/g, '').length;
  
  analysis.textStats = {
    lines,
    words,
    characters,
    charactersNoSpaces
  };
  
  return analysis;
};

/**
 * 分析内容并生成元数据
 */
export const analyzeContent = async (content: string | Blob | File, mimeType: string): Promise<Record<string, unknown>> => {
  const isBlob = content instanceof Blob;
  const isFile = content instanceof File;
  
  const metadata: Record<string, unknown> = {
    mimeType,
    formattedSize: isBlob || isFile ? 
      formatFileSize((content as Blob).size) : 
      formatFileSize(new Blob([content as string]).size)
  };

  // 处理文件对象
  if (isFile) {
    const file = content as File;
    metadata.fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
    
    // 如果是文本文件，读取内容进行进一步分析
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      try {
        const textContent = await file.text();
        Object.assign(metadata, analyzeTextContent(textContent, mimeType));
        Object.assign(metadata, analyzeTextStructure(textContent, detectDataType(mimeType, file)));
      } catch {
        // 如果读取失败，继续处理其他元数据
      }
    }
    
    return metadata;
  }

  // 处理 Blob 对象
  if (isBlob) {
    const blob = content as Blob;
    if (blob.type.startsWith('text/') || blob.type === 'application/json') {
      try {
        const textContent = await blob.text();
        Object.assign(metadata, analyzeTextContent(textContent, mimeType));
        Object.assign(metadata, analyzeTextStructure(textContent, detectDataType(mimeType, blob)));
      } catch {
        // 如果读取失败，继续处理其他元数据
      }
    }
    
    return metadata;
  }

  // 处理字符串内容
  if (typeof content === 'string') {
    Object.assign(metadata, analyzeTextContent(content, mimeType));
    Object.assign(metadata, analyzeTextStructure(content, detectDataType(mimeType, content)));
  }

  return metadata;
};

/**
 * 创建图片预览
 */
export const createImagePreview = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 从 DataTransfer 提取数据（用于 paste 和 drop 事件）
export const extractDataFromDataTransfer = async (dataTransfer: DataTransfer): Promise<ClipboardDataItem[]> => {
  const extractedData = await extractClipboardData(dataTransfer);
  return convertToClipboardDataItems(extractedData);
};

// 从 ClipboardItem 提取数据（现代 Clipboard API）
export const extractDataFromClipboardItem = async (clipboardItem: ClipboardItem): Promise<ClipboardDataItem[]> => {
  const extractedData = await extractClipboardData(clipboardItem);
  return convertToClipboardDataItems(extractedData);
};

/**
 * 解析剪贴板内容 - 新的实现
 */
export const parseClipboardData = async (): Promise<ClipboardParseResult> => {
  try {
    if (!navigator.clipboard) {
      throw new Error('浏览器不支持 Clipboard API');
    }

    if (!isSecureContext()) {
      throw new Error('需要安全上下文（HTTPS）才能读取剪贴板');
    }

    const clipboardItems = await navigator.clipboard.read();
    const dataItems: ClipboardDataItem[] = [];

    // 使用新的提取函数
    for (const item of clipboardItems) {
      const itemResults = await extractDataFromClipboardItem(item);
      dataItems.push(...itemResults);
    }

    // 如果没有获取到任何数据，尝试读取纯文本
    if (dataItems.length === 0 && navigator.clipboard.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const detectedType = detectDataType('text/plain', text);
          const metadata = await analyzeContent(text, 'text/plain');
          
          dataItems.push({
            type: detectedType,
            content: text,
            size: new Blob([text]).size,
            metadata: {
              ...metadata,
              source: 'clipboard-text'
            }
          });
        }
      } catch (error) {
        console.warn('Failed to read text from clipboard:', error);
      }
    }

    return {
      success: true,
      message: `成功解析 ${dataItems.length} 个数据项`,
      data: dataItems,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      message: `解析失败：${error instanceof Error ? error.message : '未知错误'}`,
      data: [],
      timestamp: Date.now()
    };
  }
};

/**
 * 检查是否支持剪贴板读取
 */
export const isClipboardReadSupported = (): boolean => {
  return !!navigator.clipboard && !!navigator.clipboard.read && isSecureContext();
};

/**
 * 监听粘贴事件 - 增强版，支持 DataTransfer
 */
export const addPasteListener = (callback: (result: ClipboardParseResult) => void): (() => void) => {
  const handlePaste = async (event: ClipboardEvent) => {
    event.preventDefault();
    
    try {
      let dataItems: ClipboardDataItem[] = [];
      
      // 优先处理 DataTransfer 数据
      if (event.clipboardData) {
        const transferResults = await extractDataFromDataTransfer(event.clipboardData);
        dataItems.push(...transferResults);
      }
      
      // 如果没有获取到数据，回退到标准 Clipboard API
      if (dataItems.length === 0) {
        const result = await parseClipboardData();
        dataItems = result.data;
      }
      
      const result: ClipboardParseResult = {
        success: true,
        message: `通过粘贴事件成功解析 ${dataItems.length} 个数据项`,
        data: dataItems,
        timestamp: Date.now()
      };
      
      callback(result);
    } catch (error) {
      const result: ClipboardParseResult = {
        success: false,
        message: `粘贴事件处理失败：${error instanceof Error ? error.message : '未知错误'}`,
        data: [],
        timestamp: Date.now()
      };
      
      callback(result);
    }
  };

  document.addEventListener('paste', handlePaste);
  
  // 返回清理函数
  return () => {
    document.removeEventListener('paste', handlePaste);
  };
};

/**
 * 监听拖放事件
 */
export const addDropListener = (callback: (result: ClipboardParseResult) => void): (() => void) => {
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };
  
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    
    try {
      const dataItems: ClipboardDataItem[] = [];
      
      if (event.dataTransfer) {
        const transferResults = await extractDataFromDataTransfer(event.dataTransfer);
        dataItems.push(...transferResults);
      }
      
      const result: ClipboardParseResult = {
        success: true,
        message: `通过拖放事件成功解析 ${dataItems.length} 个数据项`,
        data: dataItems,
        timestamp: Date.now()
      };
      
      callback(result);
    } catch (error) {
      const result: ClipboardParseResult = {
        success: false,
        message: `拖放事件处理失败：${error instanceof Error ? error.message : '未知错误'}`,
        data: [],
        timestamp: Date.now()
      };
      
      callback(result);
    }
  };

  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('drop', handleDrop);
  
  // 返回清理函数
  return () => {
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('drop', handleDrop);
  };
};