import React from "react";
import { useClipboardStore } from "../store/useClipboardStore";

interface TextInputProps {
  placeholder?: string;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder = "请输入要复制的内容...",
  className = "",
}) => {
  const { content, setContent } = useClipboardStore();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor="content-input"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        输入内容
      </label>
      <textarea
        id="content-input"
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        rows={8}
        className={
          "w-full px-4 py-3 border border-gray-300 rounded-lg " +
          "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
          "resize-vertical min-h-[200px] max-h-[400px] " +
          "text-base leading-relaxed " +
          "transition-colors duration-200 " +
          "placeholder:text-gray-400"
        }
      />
      <div className="mt-2 text-sm text-gray-500">字符数：{content.length}</div>
    </div>
  );
};
