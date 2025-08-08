/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { ClipboardDataItem, ClipboardDataType } from "../types";
import {
  FileText,
  Code,
  Image,
  File,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface DataViewerProps {
  item: ClipboardDataItem;
  index: number;
  className?: string;
}

const getTypeIcon = (type: ClipboardDataType) => {
  switch (type) {
    case "text/plain":
      return <FileText className="w-5 h-5" />;
    case "text/html":
      return <Code className="w-5 h-5" />;
    case "text/rtf":
      return <FileText className="w-5 h-5" />;
    case "application/json":
      return <Code className="w-5 h-5" />;
    case "application/xml":
      return <Code className="w-5 h-5" />;
    case "image/png":
    case "image/jpeg":
    case "image/gif":
    case "image/webp":
    case "image/svg+xml":
    case "image/bmp":
    case "image/tiff":
      return <Image className="w-5 h-5" />;
    default:
      return <File className="w-5 h-5" />;
  }
};

const getTypeColor = (type: ClipboardDataType) => {
  switch (type) {
    case "text/plain":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "text/html":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "text/rtf":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "application/json":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "application/xml":
      return "bg-red-100 text-red-800 border-red-200";
    case "image/png":
    case "image/jpeg":
    case "image/gif":
    case "image/webp":
    case "image/svg+xml":
    case "image/bmp":
    case "image/tiff":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTypeName = (type: ClipboardDataType) => {
  switch (type) {
    case "text/plain":
      return "纯文本";
    case "text/html":
      return "HTML";
    case "text/rtf":
      return "RTF";
    case "application/json":
      return "JSON";
    case "application/xml":
      return "XML";
    case "image/png":
      return "PNG 图片";
    case "image/jpeg":
      return "JPEG 图片";
    case "image/gif":
      return "GIF 图片";
    case "image/webp":
      return "WebP 图片";
    case "image/svg+xml":
      return "SVG 图片";
    case "image/bmp":
      return "BMP 图片";
    case "image/tiff":
      return "TIFF 图片";
    case "files":
      return "文件";
    default:
      return "未知格式";
  }
};

export const DataViewer: React.FC<DataViewerProps> = ({
  item,
  index,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const isText = typeof item.content === "string";
  const isImage = item.type.startsWith("image/");
  const isBlob = item.content instanceof Blob;

  // 复制文本内容
  const handleCopyText = async () => {
    if (!isText) return;

    try {
      await navigator.clipboard.writeText(item.content as string);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  // 下载内容
  const handleDownload = () => {
    let blob: Blob;
    let filename: string;

    if (isText) {
      blob = new Blob([item.content as string], {
        type: item.metadata?.mimeType || "text/plain",
      });
      filename = `clipboard-${index + 1}.${
        item.type === "text/html" ? "html" : "txt"
      }`;
    } else if (isBlob) {
      blob = item.content as Blob;
      const extension = item.type.split("/")[1] || "bin";
      filename = `clipboard-${index + 1}.${extension}`;
    } else {
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 渲染内容
  const renderContent = () => {
    if (isImage && item.preview) {
      return (
        <div className="p-6">
          <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <div className="w-1 h-4 bg-green-500 rounded-full mr-2"></div>
            图片预览
          </h5>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 shadow-inner">
            <div className="flex justify-center">
              <img
                src={item.preview}
                alt={`剪贴板图片 ${index + 1}`}
                className={`rounded-lg border border-gray-300 shadow-sm ${
                  isFullscreen
                    ? "max-w-full max-h-screen"
                    : "max-w-full max-h-64"
                }`}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isText) {
      const content = item.content as string;
      const isHTML = item.type === "text/html";
      const isRTF = item.type === "text/rtf";
      const isJSON = item.type === "application/json";
      const isXML = item.type === "application/xml";

      return (
        <div className="p-6 space-y-6">
          {/* 原始内容 */}
          <div>
            <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-1 h-4 bg-green-500 rounded-full mr-2"></div>
              原始内容
            </h5>
            <div
              className={`bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 shadow-inner ${
                isFullscreen ? "max-h-screen" : "max-h-64"
              } overflow-auto`}
            >
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {content}
              </pre>
            </div>
          </div>

          {/* HTML 渲染预览 */}
          {isHTML && (
            <div>
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <div className="w-1 h-4 bg-purple-500 rounded-full mr-2"></div>
                渲染预览
              </h5>
              <div
                className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
                  isFullscreen ? "max-h-screen" : "max-h-64"
                } overflow-auto`}
              >
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          )}

          {/* RTF 处理预览 */}
          {isRTF && (
            <div>
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <div className="w-1 h-4 bg-orange-500 rounded-full mr-2"></div>
                RTF 信息
              </h5>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {item.metadata?.rtfInfo &&
                typeof item.metadata.rtfInfo === "object" ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">有效格式：</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          (item.metadata.rtfInfo as any).hasValidHeader
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {(item.metadata.rtfInfo as any).hasValidHeader
                          ? "是"
                          : "否"}
                      </span>
                    </div>
                    {(item.metadata.rtfInfo as any).version && (
                      <div>
                        <span className="font-medium">版本：</span>
                        <span className="ml-2">
                          {(item.metadata.rtfInfo as any).version}
                        </span>
                      </div>
                    )}
                    {(item.metadata.rtfInfo as any).charset && (
                      <div>
                        <span className="font-medium">字符集：</span>
                        <span className="ml-2">
                          {(item.metadata.rtfInfo as any).charset}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">RTF 信息解析失败</p>
                )}
              </div>
            </div>
          )}

          {/* JSON 格式化预览 */}
          {isJSON && (
            <div>
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <div className="w-1 h-4 bg-yellow-500 rounded-full mr-2"></div>
                JSON 预览
              </h5>
              <div
                className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
                  isFullscreen ? "max-h-screen" : "max-h-64"
                } overflow-auto`}
              >
                {item.metadata?.jsonInfo &&
                typeof item.metadata.jsonInfo === "object" &&
                (item.metadata.jsonInfo as any).isValid ? (
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {JSON.stringify(JSON.parse(content), null, 2)}
                  </pre>
                ) : (
                  <div className="text-red-600 text-sm">
                    <p className="font-medium">JSON 格式错误</p>
                    <p>
                      {(item.metadata?.jsonInfo as any)?.error ||
                        "无法解析 JSON"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* XML 格式化预览 */}
          {isXML && (
            <div>
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <div className="w-1 h-4 bg-red-500 rounded-full mr-2"></div>
                XML 预览
              </h5>
              <div
                className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
                  isFullscreen ? "max-h-screen" : "max-h-64"
                } overflow-auto`}
              >
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                  {content}
                </pre>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8 shadow-inner">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <File className="w-8 h-8 text-gray-400" />
            </div>
            <h5 className="text-sm font-semibold text-gray-700 mb-1">
              无法预览
            </h5>
            <p className="text-xs text-gray-500">此类型的内容暂不支持预览</p>
            {item.metadata?.error &&
              typeof item.metadata.error === "string" && (
                <p className="text-xs text-red-500 mt-2">
                  错误：{item.metadata.error}
                </p>
              )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <div className={`p-2 rounded border ${getTypeColor(item.type)}`}>
              {getTypeIcon(item.type)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {getTypeName(item.type)}
                </h4>
                {item.metadata?.mimeType && (
                  <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono border border-blue-200">
                    {item.metadata.mimeType}
                  </code>
                )}
              </div>
              <p className="text-xs text-gray-500 text-left">
                {item.metadata?.formattedSize || "未知大小"}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {isText && (
            <button
              onClick={handleCopyText}
              className={`p-2 rounded transition-colors ${
                copySuccess
                  ? "bg-green-100 text-green-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="复制内容"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="下载内容"
          >
            <Download className="w-4 h-4" />
          </button>

          {isExpanded && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title={isFullscreen ? "退出全屏" : "全屏查看"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 元数据 */}
      {isExpanded && item.metadata && (
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <div className="w-1 h-4 bg-blue-500 rounded-full mr-2"></div>
            元数据信息
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  MIME 类型
                </span>
                <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono border border-blue-200">
                  {item.metadata.mimeType}
                </code>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  文件大小
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {item.metadata.formattedSize}
                </span>
              </div>
            </div>

            {/* 语言信息 */}
            {item.metadata.language && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    检测语言
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.metadata.language}
                  </span>
                </div>
              </div>
            )}

            {/* 字符集信息 */}
            {item.metadata.charset && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    字符集
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.metadata.charset}
                  </span>
                </div>
              </div>
            )}

            {/* 编码信息 */}
            {item.metadata.encoding && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    编码
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.metadata.encoding}
                  </span>
                </div>
              </div>
            )}

            {/* 传输编码 */}
            {item.metadata.transferEncoding && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    传输编码
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.metadata.transferEncoding}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 文本统计信息 */}
          {item.metadata.textStats &&
            typeof item.metadata.textStats === "object" && (
              <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h6 className="text-sm font-medium text-gray-700 mb-3">
                  文本统计
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(item.metadata.textStats as Record<string, number>)
                        .lines || 0}
                    </div>
                    <div className="text-gray-500">行数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(item.metadata.textStats as Record<string, number>)
                        .words || 0}
                    </div>
                    <div className="text-gray-500">单词数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(item.metadata.textStats as any).characters || 0}
                    </div>
                    <div className="text-gray-500">字符数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(item.metadata.textStats as any).charactersNoSpaces || 0}
                    </div>
                    <div className="text-gray-500">非空字符</div>
                  </div>
                </div>
              </div>
            )}

          {/* HTML 结构信息 */}
          {item.metadata.structure &&
            typeof item.metadata.structure === "object" && (
              <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h6 className="text-sm font-medium text-gray-700 mb-3">
                  HTML 结构分析
                </h6>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">完整HTML文档</span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        (item.metadata.structure as any).isComplete
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(item.metadata.structure as any).isComplete
                        ? "是"
                        : "否"}
                    </span>
                  </div>
                  {(item.metadata.structure as any).elements && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {(item.metadata.structure as any).elements.images}
                        </div>
                        <div className="text-gray-500">图片</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {(item.metadata.structure as any).elements.links}
                        </div>
                        <div className="text-gray-500">链接</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          {(item.metadata.structure as any).elements.tables}
                        </div>
                        <div className="text-gray-500">表格</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {(item.metadata.structure as any).elements.forms}
                        </div>
                        <div className="text-gray-500">表单</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* 内容区域 */}
      {isExpanded && (
        <div
          className={
            isFullscreen ? "fixed inset-0 z-50 bg-white overflow-auto" : ""
          }
        >
          {isFullscreen && (
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {getTypeName(item.type)}
              </h3>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          )}
          {renderContent()}
        </div>
      )}
    </div>
  );
};
