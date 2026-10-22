import { useClipboardStore } from "../store/useClipboardStore";

export function TextInput() {
  const { content, setContent } = useClipboardStore();
  return (
    <div className="text-input-group">
      <label className="field-label" htmlFor="content-input">
        输入内容
      </label>
      <textarea
        id="content-input"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        spellCheck={false}
      />
      <div className="input-caption">
        <span>{content.length.toLocaleString()} 字符</span>
      </div>
    </div>
  );
}
