import React, { useState } from "react";
import {
  Bug,
  RefreshCw,
  Download,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ClipboardInspectorProps {
  className?: string;
}

interface BrowserInfo {
  userAgent: string;
  platform: string;
  language: string;
  languages: readonly string[];
  cookieEnabled: boolean;
  onLine: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  clipboard: {
    hasClipboard: boolean;
    hasRead: boolean;
    hasWrite: boolean;
    hasReadText: boolean;
    hasWriteText: boolean;
  };
  security: {
    isSecureContext: boolean;
    origin: string;
    protocol: string;
    hostname: string;
  };
  permissions: {
    hasPermissionsAPI: boolean;
  };
}

interface TestResult {
  success: boolean;
  error?: string;
  hasContent?: boolean;
  contentLength?: number;
  preview?: string;
  itemCount?: number;
  types?: string[];
}

export const ClipboardInspector: React.FC<ClipboardInspectorProps> = ({
  className = "",
}) => {
  const [showRawData, setShowRawData] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});

  // 获取浏览器和剪贴板 API 信息
  const getBrowserInfo = (): BrowserInfo => {
    const info: BrowserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      clipboard: {
        hasClipboard: !!navigator.clipboard,
        hasRead: !!(navigator.clipboard && navigator.clipboard.read),
        hasWrite: !!(navigator.clipboard && navigator.clipboard.write),
        hasReadText: !!(navigator.clipboard && navigator.clipboard.readText),
        hasWriteText: !!(navigator.clipboard && navigator.clipboard.writeText),
      },
      security: {
        isSecureContext: window.isSecureContext,
        origin: window.location.origin,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
      },
      permissions: {
        hasPermissionsAPI: !!navigator.permissions,
      },
    };
    return info;
  };

  // 检测剪贴板权限
  const checkClipboardPermissions = async () => {
    const permissions: Record<string, string> = {};

    if (navigator.permissions) {
      try {
        const clipboardRead = await navigator.permissions.query({
          name: "clipboard-read" as PermissionName,
        });
        permissions.clipboardRead = clipboardRead.state;
      } catch (error) {
        permissions.clipboardRead = `Error: ${
          error instanceof Error ? error.message : "Unknown"
        }`;
      }

      try {
        const clipboardWrite = await navigator.permissions.query({
          name: "clipboard-write" as PermissionName,
        });
        permissions.clipboardWrite = clipboardWrite.state;
      } catch (error) {
        permissions.clipboardWrite = `Error: ${
          error instanceof Error ? error.message : "Unknown"
        }`;
      }
    } else {
      permissions.error = "Permissions API not supported";
    }

    return permissions;
  };

  // 高级剪贴板诊断
  const runClipboardDiagnostics = async () => {
    const diagnostics: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      browserInfo: getBrowserInfo(),
    };

    // 检查权限
    diagnostics.permissions = await checkClipboardPermissions();

    // 尝试不同的剪贴板操作
    const tests: Record<string, TestResult> = {};

    // 测试 readText
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        tests.readText = {
          success: true,
          hasContent: !!text,
          contentLength: text.length,
          preview: text.substring(0, 100),
        };
      }
    } catch (error) {
      tests.readText = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 测试 read
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        tests.read = {
          success: true,
          itemCount: items.length,
          types: items.flatMap((item) => Array.from(item.types)),
        };
      }
    } catch (error) {
      tests.read = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 测试 writeText
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText("ClipboardDebugTest");
        tests.writeText = { success: true };
      }
    } catch (error) {
      tests.writeText = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    diagnostics.tests = tests;
    setDebugInfo(diagnostics);
  };

  // 导出调试信息
  const exportDebugInfo = () => {
    const data = {
      debugInfo,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipboard-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 复制调试信息到剪贴板
  const copyDebugInfo = async () => {
    const data = {
      debugInfo,
      timestamp: new Date().toISOString(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("调试信息已复制到剪贴板");
    } catch (error) {
      console.error("复制失败:", error);
      alert("复制失败，请使用导出功能");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderStatus = (success: boolean | undefined, error?: string) => {
    if (success === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (success === false) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Bug className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">环境检查器</h2>
            <p className="text-sm text-gray-600">剪贴板API兼容性诊断</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showRawData ? (
              <EyeOff className="w-4 h-4 mr-1" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            {showRawData ? "隐藏" : "显示"}原始数据
          </button>

          <button
            onClick={runClipboardDiagnostics}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            运行诊断
          </button>
        </div>
      </div>

      {/* 快速状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">剪贴板 API</h3>
              <p className="text-xs text-blue-600">基础支持</p>
            </div>
            {renderStatus(!!navigator.clipboard)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-900">安全上下文</h3>
              <p className="text-xs text-green-600">HTTPS/Localhost</p>
            </div>
            {renderStatus(window.isSecureContext)}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        {Object.keys(debugInfo).length > 0 && (
          <>
            <button
              onClick={copyDebugInfo}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              复制调试信息
            </button>

            <button
              onClick={exportDebugInfo}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              导出调试信息
            </button>
          </>
        )}
      </div>

      {/* 调试信息展示 */}
      {Object.keys(debugInfo).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">诊断结果</h3>

          {/* 浏览器信息 */}
          {debugInfo.browserInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                浏览器信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">平台:</span>
                  <span className="ml-2">
                    {(debugInfo.browserInfo as BrowserInfo).platform}
                  </span>
                </div>
                <div>
                  <span className="font-medium">语言:</span>
                  <span className="ml-2">
                    {(debugInfo.browserInfo as BrowserInfo).language}
                  </span>
                </div>
                <div>
                  <span className="font-medium">安全上下文:</span>
                  <span className="ml-2">
                    {(debugInfo.browserInfo as BrowserInfo).security
                      ?.isSecureContext
                      ? "是"
                      : "否"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">协议:</span>
                  <span className="ml-2">
                    {(debugInfo.browserInfo as BrowserInfo).security?.protocol}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 权限信息 */}
          {debugInfo.permissions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                权限状态
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(
                  debugInfo.permissions as Record<string, string>
                ).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="font-medium">{key}:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        value === "granted"
                          ? "bg-green-100 text-green-800"
                          : value === "denied"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 测试结果 */}
          {debugInfo.tests && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                API 测试结果
              </h4>
              <div className="space-y-3">
                {Object.entries(
                  debugInfo.tests as Record<string, TestResult>
                ).map(([test, result]) => (
                  <div key={test} className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {renderStatus(result.success)}
                      <span className="font-medium">{test}</span>
                    </div>
                    <div className="text-xs text-gray-500 max-w-xs">
                      {result.error ? (
                        <span className="text-red-600">{result.error}</span>
                      ) : result.success ? (
                        <span className="text-green-600">成功</span>
                      ) : (
                        <span className="text-yellow-600">未知</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 原始数据 */}
      {showRawData && Object.keys(debugInfo).length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">原始调试数据</h4>
          <pre className="text-xs text-green-400 overflow-auto max-h-96 font-mono">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
