import { useEffect, useState } from "react";
import {
  Clipboard,
  FileText,
  Image,
  ScanLine,
  History,
  Trash2,
  RefreshCw,
  ShieldCheck,
  CircleCheck,
  TriangleAlert,
  Code2,
} from "lucide-react";
import { useClipboardStore } from "../store/useClipboardStore";
import {
  addDropListener,
  isClipboardReadSupported,
  isSecureContext,
} from "../utils/clipboard";
import { formatBytes, formatName } from "../utils/format";
import { DataViewer } from "./DataViewer";
import { TextInput } from "./TextInput";
import { FormatSelector } from "./FormatSelector";
import { ActionButtons } from "./ActionButtons";
import { StatusMessage } from "./StatusMessage";
import HistoryViewer from "./HistoryViewer";
import { ClipboardInspector } from "./ClipboardInspector";

const modes = [
  { id: "parse", label: "解析模式", shortLabel: "解析", Icon: Clipboard },
  { id: "write", label: "写入模式", shortLabel: "写入", Icon: FileText },
  { id: "inspector", label: "环境检查", shortLabel: "检查", Icon: ScanLine },
] as const;

export function ClipboardDebugTool() {
  const {
    mode,
    setMode,
    parseData,
    parseStatus,
    parseMessage,
    parseSource,
    handleParse,
    clearParseData,
    history,
    toggleHistoryVisibility,
    enablePasteListener,
    disablePasteListener,
    setParseData,
    setParseMessage,
    setParseStatus,
    addToHistory,
    lastParseTime,
  } = useClipboardStore();
  const [dragging, setDragging] = useState(false);
  const supported = isClipboardReadSupported();
  const secure = isSecureContext();
  const totalSize = formatBytes(
    parseData.reduce((sum, item) => sum + item.size, 0),
  );
  const shortcut = navigator.platform.toLowerCase().includes("mac")
    ? "⌘"
    : "Ctrl";

  useEffect(() => {
    if (mode !== "parse" || history.isVisible) return;
    enablePasteListener();
    const cleanupDrop = addDropListener((result) => {
      setDragging(false);
      setParseData(result.data);
      setParseMessage(result.message);
      setParseStatus(result.success ? "success" : "error");
      if (result.success && result.data.length) {
        addToHistory(result);
        useClipboardStore.setState({
          lastParseTime: result.timestamp,
          parseSource: result.source || "drop",
        });
      }
    });
    return () => {
      disablePasteListener();
      cleanupDrop();
    };
  }, [
    mode,
    history.isVisible,
    enablePasteListener,
    disablePasteListener,
    setParseData,
    setParseMessage,
    setParseStatus,
    addToHistory,
  ]);

  return (
    <main
      className="app-shell"
      onDragOver={(event) => {
        if (mode === "parse" && !history.isVisible) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDragging(false);
      }}
      onDrop={() => setDragging(false)}
    >
      <StatusMessage />
      <header className="app-header">
        <div className="header-identity">
          <a className="wordmark" href="/" aria-label="Clipboard Viewer 首页">
            clipboard<span>.viewer</span>
          </a>
          <nav className="mode-navigation" aria-label="工作模式">
            {modes.map(({ id, label, shortLabel, Icon }) => (
              <button
                key={id}
                className={mode === id ? "selected" : ""}
                onClick={() => setMode(id)}
                aria-label={label}
                aria-pressed={mode === id}
              >
                <Icon size={19} />
                <span className="mode-label">{label}</span>
                <span className="mode-short-label">{shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="header-actions">
          <button
            className={`quiet-button ${history.isVisible ? "is-active" : ""}`}
            onClick={toggleHistoryVisibility}
            aria-label="历史记录"
            aria-expanded={history.isVisible}
            aria-controls="clipboard-history"
            aria-haspopup="dialog"
          >
            <History size={17} />
            <span>历史记录</span>
            {history.items.length > 0 && (
              <span className="button-count">{history.items.length}</span>
            )}
          </button>
        </div>
      </header>

      {mode === "parse" && (
        <section className="parse-workspace" aria-label="剪贴板解析">
          <div className="workspace-heading">
            <div>
              <h1>解析剪贴板</h1>
            </div>
            <button
              className="quiet-button clipboard-read-fallback"
              onClick={handleParse}
              disabled={parseStatus === "parsing" || !supported}
              title={
                supported
                  ? "直接读取可能缺少部分格式，建议优先使用快捷键粘贴"
                  : "当前环境不支持直接读取"
              }
            >
              <RefreshCw
                size={17}
                className={parseStatus === "parsing" ? "spin" : ""}
              />
              {parseStatus === "parsing" ? "读取中…" : "直接读取"}
            </button>
          </div>
          {parseStatus === "error" && (
            <div className="inline-notice" role="alert">
              <TriangleAlert size={17} />
              {parseMessage}
            </div>
          )}
          <div
            className={`surface paste-target ${parseData.length ? "paste-target-compact" : ""} ${dragging ? "is-dragging" : ""}`}
            tabIndex={0}
            role="region"
            aria-label="粘贴区域"
          >
            <Clipboard
              size={parseData.length ? 25 : 42}
              strokeWidth={1.3}
              className="paste-target-icon"
            />
            <div className="paste-entry-copy">
              <h2>
                {dragging
                  ? "松开文件"
                  : parseData.length
                    ? "继续粘贴"
                    : "使用快捷键粘贴"}
              </h2>
              <p>
                {parseSource === "read" && parseData.length
                  ? "直接读取的格式可能不完整，建议再粘贴一次。"
                  : "粘贴通常能获取更完整的格式。"}
              </p>
            </div>
            <div
              className="shortcut paste-keyboard"
              aria-label={`${shortcut === "⌘" ? "Command" : "Ctrl"} 加 V`}
            >
              <kbd>{shortcut}</kbd>
              <span>+</span>
              <kbd>V</kbd>
            </div>
          </div>
          {parseData.length > 0 && (
            <div className={`results-section ${dragging ? "is-dragging" : ""}`}>
              <div className="results-heading">
                <div>
                  <h2>解析结果</h2>
                  <span>
                    {parseData.length} 个数据项 · {totalSize.value}{" "}
                    {totalSize.unit}
                    {parseSource && (
                      <span className="acquisition-source">
                        {
                          {
                            paste: "粘贴获取",
                            read: "直接读取",
                            drop: "拖入文件",
                          }[parseSource]
                        }
                      </span>
                    )}
                  </span>
                </div>
                <button
                  className="quiet-button small-button"
                  onClick={clearParseData}
                >
                  <Trash2 size={14} />
                  清空结果
                </button>
              </div>
              <div className="result-list">
                {parseData.map((item, index) => {
                  const size = formatBytes(item.size);
                  const Icon = item.type.startsWith("image/")
                    ? Image
                    : item.type === "text/html"
                      ? Code2
                      : FileText;
                  return (
                    <article
                      className="surface result-card"
                      aria-label={`${formatName(item.type)}数据`}
                      key={`${index}-${item.type}-${lastParseTime}`}
                    >
                      <div className="result-card-heading">
                        <div className="result-identity">
                          <Icon
                            size={20}
                            className={
                              item.type.startsWith("image/")
                                ? "accent-orange"
                                : "accent-blue"
                            }
                          />
                          <h3>{formatName(item.type)}</h3>
                          <code>{item.metadata?.mimeType || item.type}</code>
                        </div>
                        <span className="result-size">
                          {size.value} {size.unit}
                        </span>
                      </div>
                      <DataViewer item={item} index={index} />
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {mode === "write" && (
        <section aria-label="写入剪贴板">
          <div className="workspace-heading">
            <div>
              <h1>写入剪贴板</h1>
            </div>
          </div>
          <div className="surface write-editor">
            <TextInput />
            <FormatSelector />
            <ActionButtons />
          </div>
        </section>
      )}
      {mode === "inspector" && <ClipboardInspector />}
      {history.isVisible && <HistoryViewer />}
      <section className="surface environment-card" aria-label="当前环境">
        <div className="environment-grid">
          <div>
            <span className="eyebrow">剪贴板 API</span>
            <strong>
              <CircleCheck
                size={15}
                className={supported ? "accent-green" : "muted"}
              />
              {supported ? "支持直接读取" : "请使用粘贴"}
            </strong>
          </div>
          <div>
            <span className="eyebrow">安全上下文</span>
            <strong>
              <ShieldCheck
                size={15}
                className={secure ? "accent-green" : "muted"}
              />
              {secure ? "安全连接" : "受限连接"}
            </strong>
          </div>
          <div>
            <span className="eyebrow">最近解析</span>
            <strong>
              {lastParseTime
                ? new Date(lastParseTime).toLocaleTimeString("zh-CN", {
                    hour12: false,
                  })
                : "尚未解析"}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}
