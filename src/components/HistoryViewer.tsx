import { useEffect, useRef } from "react";
import { History, Trash2, ArrowUpRight, X } from "lucide-react";
import { useClipboardStore } from "../store/useClipboardStore";
import { formatBytes, formatName } from "../utils/format";
import type { HistoryItem } from "../types";

const historyPreview = (item: HistoryItem) => {
  const text =
    item.parseResult.data.find(
      (data) => data.type === "text/plain" && typeof data.content === "string",
    ) || item.parseResult.data.find((data) => typeof data.content === "string");
  if (text) {
    const content = text.content as string;
    return (
      (text.type === "text/html" ? content.replace(/<[^>]*>/g, " ") : content)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120) || formatName(text.type)
    );
  }
  const file = item.parseResult.data.find(
    (data) => typeof data.content === "object" && "name" in data.content,
  );
  if (
    file &&
    typeof file.content === "object" &&
    "name" in file.content &&
    file.content.name
  )
    return file.content.name;
  return item.parseResult.data.map((data) => formatName(data.type)).join(" / ");
};

export default function HistoryViewer() {
  const {
    history,
    clearHistory,
    loadHistoryItem,
    setMode,
    toggleHistoryVisibility,
  } = useClipboardStore();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const load = (item: HistoryItem) => {
    loadHistoryItem(item);
    setMode("parse");
    toggleHistoryVisibility();
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <dialog
      ref={dialogRef}
      id="clipboard-history"
      className="history-drawer"
      aria-labelledby="history-heading"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        );
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        toggleHistoryVisibility();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          toggleHistoryVisibility();
      }}
    >
      <div className="history-drawer-heading">
        <h2 id="history-heading">
          <History size={20} />
          解析历史
        </h2>
        <button
          className="icon-button"
          onClick={toggleHistoryVisibility}
          aria-label="关闭历史记录"
        >
          <X size={20} />
        </button>
      </div>
      <div className="history-drawer-tools">
        <span>
          {history.items.length} / {history.maxItems}
        </span>
        <button
          className="quiet-button small-button"
          onClick={clearHistory}
          disabled={!history.items.length}
        >
          <Trash2 size={14} />
          清空历史
        </button>
      </div>
      {history.items.length ? (
        <div className="history-list">
          {history.items.map((item) => {
            const size = formatBytes(
              item.parseResult.data.reduce((sum, data) => sum + data.size, 0),
            );
            return (
              <button
                key={item.id}
                className="history-entry"
                onClick={() => load(item)}
              >
                <strong className="history-preview">
                  {historyPreview(item)}
                </strong>
                <span className="history-entry-formats">
                  {[
                    ...new Set(
                      item.parseResult.data.map((data) =>
                        formatName(data.type),
                      ),
                    ),
                  ].join(" · ")}
                </span>
                <span className="history-entry-details">
                  <time dateTime={new Date(item.timestamp).toISOString()}>
                    {new Date(item.timestamp).toLocaleString("zh-CN", {
                      hour12: false,
                    })}
                  </time>
                  <span>
                    {size.value} {size.unit}
                  </span>
                  <ArrowUpRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="history-empty">
          <History size={30} strokeWidth={1.3} />
          <span>暂无记录</span>
        </div>
      )}
    </dialog>
  );
}
