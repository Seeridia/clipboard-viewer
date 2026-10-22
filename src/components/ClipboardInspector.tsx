import { useState } from "react";
import { RefreshCw, Copy, Download, Check, X, Code2 } from "lucide-react";
import { useClipboardStore } from "../store/useClipboardStore";

type TestResult = { success: boolean; detail: string };
type Diagnostics = {
  timestamp: string;
  browser: {
    userAgent: string;
    platform: string;
    language: string;
    origin: string;
    secureContext: boolean;
  };
  permissions: Record<string, string>;
  tests: Record<string, TestResult>;
};

export function ClipboardInspector() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [running, setRunning] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [testWrite, setTestWrite] = useState(false);
  const message = useClipboardStore((state) => state.showStatusMessage);
  const capabilities = [
    {
      name: "读取文本",
      api: "readText",
      supported: !!navigator.clipboard?.readText,
    },
    { name: "读取多格式", api: "read", supported: !!navigator.clipboard?.read },
    {
      name: "写入文本",
      api: "writeText",
      supported: !!navigator.clipboard?.writeText,
    },
    {
      name: "写入多格式",
      api: "write",
      supported: !!navigator.clipboard?.write,
    },
  ];
  const run = async () => {
    setRunning(true);
    const result: Diagnostics = {
      timestamp: new Date().toISOString(),
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        origin: window.location.origin,
        secureContext: window.isSecureContext,
      },
      permissions: {},
      tests: {},
    };
    for (const permission of ["clipboard-read", "clipboard-write"]) {
      try {
        result.permissions[permission] = (
          await navigator.permissions.query({
            name: permission as PermissionName,
          })
        ).state;
      } catch {
        result.permissions[permission] = "浏览器未提供权限查询";
      }
    }
    for (const name of [
      "readText",
      "read",
      ...(testWrite ? ["writeText"] : []),
    ]) {
      try {
        if (name === "readText") {
          if (!navigator.clipboard?.readText) throw new Error("浏览器不支持");
          const text = await navigator.clipboard.readText();
          result.tests[name] = {
            success: true,
            detail: `读取成功，共 ${text.length} 个字符`,
          };
        } else if (name === "read") {
          if (!navigator.clipboard?.read) throw new Error("浏览器不支持");
          const items = await navigator.clipboard.read();
          result.tests[name] = {
            success: true,
            detail:
              items.flatMap((item) => Array.from(item.types)).join(" · ") ||
              "剪贴板为空",
          };
        } else {
          if (!navigator.clipboard?.writeText) throw new Error("浏览器不支持");
          await navigator.clipboard.writeText("ClipboardDebugTest");
          result.tests[name] = { success: true, detail: "写入成功" };
        }
      } catch (error) {
        result.tests[name] = {
          success: false,
          detail: error instanceof Error ? error.message : "测试失败",
        };
      }
    }
    setDiagnostics(result);
    setRunning(false);
  };
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(diagnostics, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `clipboard-debug-${Date.now()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      message("success", "诊断信息已复制");
    } catch {
      message("error", "复制失败，可使用导出功能");
    }
  };
  return (
    <section aria-label="环境检查">
      <div className="workspace-heading">
        <div>
          <h1>环境检查</h1>
        </div>
        <button className="primary-button" onClick={run} disabled={running}>
          <RefreshCw size={16} className={running ? "spin" : ""} />
          {running ? "诊断中…" : "运行诊断"}
        </button>
      </div>
      <div className="surface inspector-panel">
        <div className="capability-grid">
          {capabilities.map((capability) => (
            <div className="capability" key={capability.api}>
              <span className="eyebrow">{capability.name}</span>
              <strong>
                {capability.supported ? (
                  <Check size={17} className="accent-green" />
                ) : (
                  <X size={17} className="accent-orange" />
                )}
                {capability.supported ? "支持" : "不支持"}
              </strong>
              <code>clipboard.{capability.api}()</code>
            </div>
          ))}
        </div>
        <label className="diagnostic-option">
          <input
            type="checkbox"
            checked={testWrite}
            onChange={(event) => setTestWrite(event.target.checked)}
          />
          写入测试（覆盖剪贴板）
        </label>
        {diagnostics && (
          <>
            <div className="diagnostic-results">
              <h2>诊断结果</h2>
              <dl className="metadata-list">
                <div>
                  <dt>运行环境</dt>
                  <dd>
                    {diagnostics.browser.platform} ·{" "}
                    {diagnostics.browser.language}
                  </dd>
                </div>
                {Object.entries(diagnostics.permissions).map(
                  ([name, state]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>{state}</dd>
                    </div>
                  ),
                )}
              </dl>
              {Object.entries(diagnostics.tests).map(([name, result]) => (
                <div className="test-result" key={name}>
                  <span>
                    {result.success ? (
                      <Check size={16} className="accent-green" />
                    ) : (
                      <X size={16} className="accent-orange" />
                    )}
                    <code>{name}()</code>
                  </span>
                  <p>{result.detail}</p>
                </div>
              ))}
            </div>
            <div className="diagnostic-actions">
              <button className="quiet-button" onClick={copyData}>
                <Copy size={15} />
                复制诊断
              </button>
              <button className="quiet-button" onClick={exportData}>
                <Download size={15} />
                导出 JSON
              </button>
              <button
                className="text-button"
                onClick={() => setShowRaw(!showRaw)}
                aria-expanded={showRaw}
              >
                <Code2 size={15} />
                {showRaw ? "隐藏原始数据" : "原始数据"}
              </button>
            </div>
            {showRaw && (
              <pre className="diagnostic-raw">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>
    </section>
  );
}
