import { useEffect, useRef, useState } from "react";
import { Copy, Check, Download, Maximize2, X, File } from "lucide-react";
import type { ClipboardDataItem, FileInfo } from "../types";
import { formatName } from "../utils/format";
import { useClipboardStore } from "../store/useClipboardStore";
import { MetadataViewer } from "./MetadataViewer";

interface DataViewerProps {
  item: ClipboardDataItem;
  index: number;
}

export function DataViewer({ item, index }: DataViewerProps) {
  const [view, setView] = useState<"raw" | "preview" | "info">("raw");
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fullscreen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    viewerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [fullscreen]);
  const showMessage = useClipboardStore((state) => state.showStatusMessage);
  const text = typeof item.content === "string" ? item.content : null;
  const fileInfo =
    typeof item.content === "object" && !(item.content instanceof Blob)
      ? (item.content as FileInfo)
      : null;
  const imageURL = item.preview || fileInfo?.url;
  const canPreview =
    item.type === "text/html" || item.type === "application/json";

  const copy = async () => {
    if (text === null) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showMessage("error", "复制失败，请检查浏览器剪贴板权限");
    }
  };
  const download = () => {
    const extension =
      (
        {
          "text/html": "html",
          "text/rtf": "rtf",
          "application/json": "json",
          "application/xml": "xml",
        } as Record<string, string>
      )[item.type] ||
      (item.type.startsWith("image/") ? item.type.split("/")[1] : "txt");
    const url =
      fileInfo?.url ||
      URL.createObjectURL(
        item.content instanceof Blob
          ? item.content
          : new Blob([text || ""], {
              type: item.metadata?.mimeType || item.type,
            }),
      );
    const link = document.createElement("a");
    link.href = url;
    link.download = fileInfo?.name || `clipboard-${index + 1}.${extension}`;
    link.click();
    if (!fileInfo?.url) setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const renderPreview = () => {
    if (item.type.startsWith("image/") && imageURL)
      return (
        <div className="image-preview">
          <img src={imageURL} alt="剪贴板图片预览" />
        </div>
      );
    if (item.type === "text/html" && text !== null)
      return (
        <iframe
          title="HTML 渲染预览"
          sandbox=""
          srcDoc={text}
          className="html-preview"
        />
      );
    if (item.type === "application/json" && text !== null) {
      try {
        return (
          <pre className="raw-content">
            {JSON.stringify(JSON.parse(text), null, 2)}
          </pre>
        );
      } catch {
        return <pre className="raw-content">{text}</pre>;
      }
    }
    return (
      <div className="binary-preview">
        <File size={34} strokeWidth={1.2} />
        <strong>{fileInfo?.name || formatName(item.type)}</strong>
        <p>无法预览</p>
        <button className="quiet-button" onClick={download}>
          <Download size={15} />
          下载文件
        </button>
      </div>
    );
  };
  return (
    <div
      ref={viewerRef}
      className={`data-viewer ${fullscreen ? "viewer-fullscreen" : ""}`}
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen || undefined}
      aria-label={fullscreen ? "数据详情全屏查看" : undefined}
      onKeyDown={(event) => {
        if (!fullscreen) return;
        if (event.key === "Escape") {
          event.preventDefault();
          setFullscreen(false);
        }
        if (event.key === "Tab") {
          const focusable = Array.from(
            viewerRef.current?.querySelectorAll<HTMLElement>(
              "button, iframe",
            ) || [],
          );
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      {fullscreen && (
        <h2 className="fullscreen-title">
          {formatName(item.type)}{" "}
          <code>{item.metadata?.mimeType || item.type}</code>
        </h2>
      )}
      <div className="viewer-toolbar">
        <div className="viewer-tabs">
          <button
            onClick={() => setView("raw")}
            aria-pressed={view === "raw"}
            className={view === "raw" ? "selected" : ""}
          >
            {text !== null
              ? "原始内容"
              : item.type.startsWith("image/")
                ? "图片预览"
                : "文件信息"}
          </button>
          {canPreview && (
            <button
              onClick={() => setView("preview")}
              aria-pressed={view === "preview"}
              className={view === "preview" ? "selected" : ""}
            >
              预览
            </button>
          )}
          <button
            onClick={() => setView("info")}
            aria-pressed={view === "info"}
            className={view === "info" ? "selected" : ""}
          >
            元数据
          </button>
        </div>
        <div className="viewer-actions">
          {text !== null && (
            <button
              className="icon-button"
              onClick={copy}
              aria-label={copied ? "已复制" : "复制内容"}
              title="复制内容"
            >
              {copied ? (
                <Check size={16} className="accent-green" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          )}
          <button
            className="icon-button"
            onClick={download}
            aria-label="下载内容"
            title="下载内容"
          >
            <Download size={16} />
          </button>
          <button
            className="icon-button"
            onClick={() => setFullscreen(!fullscreen)}
            aria-label={fullscreen ? "退出全屏" : "全屏查看"}
            title={fullscreen ? "退出全屏" : "全屏查看"}
          >
            {fullscreen ? <X size={17} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>
      <div
        className={`viewer-body ${view === "info" ? "viewer-body-metadata" : ""}`}
      >
        {view === "info" ? (
          <MetadataViewer item={item} fileInfo={fileInfo} />
        ) : view === "preview" ? (
          renderPreview()
        ) : text !== null ? (
          <pre className="raw-content">{text}</pre>
        ) : (
          renderPreview()
        )}
      </div>
    </div>
  );
}
