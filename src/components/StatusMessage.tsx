import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import { useClipboardStore } from "../store/useClipboardStore";

export function StatusMessage() {
  const { statusMessage, hideStatusMessage } = useClipboardStore();
  if (!statusMessage.visible || !statusMessage.message) return null;
  const Icon =
    statusMessage.type === "success"
      ? CircleCheck
      : statusMessage.type === "error"
        ? CircleAlert
        : Info;
  return (
    <div
      role={statusMessage.type === "error" ? "alert" : "status"}
      className={`toast toast-${statusMessage.type}`}
    >
      <Icon size={17} />
      <span>{statusMessage.message}</span>
      <button
        className="icon-button"
        onClick={hideStatusMessage}
        aria-label="关闭通知"
      >
        <X size={15} />
      </button>
    </div>
  );
}
