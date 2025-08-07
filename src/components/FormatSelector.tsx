import React from 'react';
import { useClipboardStore } from '../store/useClipboardStore';
import { ClipboardFormat } from '../types';
import { FileText, Code, FileType } from 'lucide-react';

interface FormatOption {
  value: ClipboardFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const allFormatOptions: FormatOption[] = [
  {
    value: 'text/plain',
    label: '纯文本',
    description: '复制为纯文本格式',
    icon: <FileText className="w-4 h-4" />
  },
  {
    value: 'text/html',
    label: 'HTML',
    description: '复制为HTML格式，保留格式化',
    icon: <Code className="w-4 h-4" />
  },
  {
    value: 'text/rtf',
    label: 'RTF',
    description: '复制为RTF格式，兼容Word等程序',
    icon: <FileType className="w-4 h-4" />
  }
];

interface FormatSelectorProps {
  className?: string;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ 
  className = "" 
}) => {
  const { format, setFormat } = useClipboardStore();
  
  // 只在写入模式中过滤掉RTF格式
  // FormatSelector只应该在写入相关的场景中使用
  // 所以我们总是过滤掉RTF格式，除非明确在非写入模式中
  const formatOptions = React.useMemo(() => {
    // 在所有写入相关的场景中都删除RTF格式
    return allFormatOptions.filter(option => option.value !== 'text/rtf');
  }, []);

  const handleFormatChange = (selectedFormat: ClipboardFormat) => {
    setFormat(selectedFormat);
  };

  // 如果当前选择的格式是RTF（可能从其他地方设置的），自动切换到text/plain
  React.useEffect(() => {
    if (format === 'text/rtf') {
      setFormat('text/plain');
    }
  }, [format, setFormat]);

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        选择复制格式
      </label>
      
      <div className="grid grid-cols-1 gap-3">
        {formatOptions.map((option) => (
          <label
            key={option.value}
            className={
              "relative flex items-center p-4 border rounded-lg cursor-pointer " +
              "transition-all duration-200 hover:bg-gray-50 " +
              (format === option.value
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-300 hover:border-gray-400")
            }
          >
            <input
              type="radio"
              name="format"
              value={option.value}
              checked={format === option.value}
              onChange={() => handleFormatChange(option.value)}
              className="sr-only"
            />
            
            <div className="flex items-center space-x-3 w-full">
              <div className={
                "flex items-center justify-center w-8 h-8 rounded-full " +
                (format === option.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600")
              }>
                {option.icon}
              </div>
              
              <div className="flex-1">
                <div className={
                  "font-medium " +
                  (format === option.value ? "text-blue-900" : "text-gray-900")
                }>
                  {option.label}
                </div>
                <div className={
                  "text-sm " +
                  (format === option.value ? "text-blue-700" : "text-gray-500")
                }>
                  {option.description}
                </div>
              </div>
              
              {format === option.value && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </label>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <strong>提示：</strong>HTML格式保留格式化信息，纯文本适用于所有场景。
      </div>
    </div>
  );
};