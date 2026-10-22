import { FileText, Code2, Check } from "lucide-react";
import { useClipboardStore } from "../store/useClipboardStore";

export function FormatSelector() {
  const { format, setFormat } = useClipboardStore();
  return (
    <fieldset className="format-options">
      <legend className="field-label">复制格式</legend>
      <div className="format-choice-grid">
        {(
          [
            {
              value: "text/plain",
              label: "纯文本",
              Icon: FileText,
            },
            {
              value: "text/html",
              label: "HTML",
              Icon: Code2,
            },
          ] as const
        ).map(({ value, label, Icon }) => (
          <label
            key={value}
            className={`format-option ${format === value ? "is-selected" : ""}`}
          >
            <input
              type="radio"
              name="clipboard-format"
              value={value}
              checked={format === value}
              onChange={() => setFormat(value)}
            />
            <Icon size={22} strokeWidth={1.5} />
            <span>
              <strong>{label}</strong>
            </span>
            {format === value && <Check size={16} className="option-check" />}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
