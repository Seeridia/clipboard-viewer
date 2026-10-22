import { Copy, Trash2, Loader2 } from "lucide-react";
import { useClipboardStore } from "../store/useClipboardStore";

export function ActionButtons() {
  const { content, status, handleCopy, clearContent } = useClipboardStore();
  return (
    <div className="write-actions">
      <button
        className="primary-button"
        onClick={handleCopy}
        disabled={!content.trim() || status === "copying"}
      >
        {status === "copying" ? (
          <Loader2 size={17} className="spin" />
        ) : (
          <Copy size={17} />
        )}
        {status === "copying" ? "正在复制…" : "复制到剪贴板"}
      </button>
      <button
        className="quiet-button"
        onClick={clearContent}
        disabled={!content || status === "copying"}
      >
        <Trash2 size={16} />
        清空内容
      </button>
    </div>
  );
}
