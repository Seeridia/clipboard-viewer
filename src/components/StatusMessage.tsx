import React, { useEffect } from 'react';
import { useClipboardStore } from '../store/useClipboardStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { StatusType } from '../types';

interface StatusMessageProps {
  className?: string;
}

const getStatusIcon = (type: StatusType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'error':
      return <XCircle className="w-5 h-5" />;
    case 'info':
    default:
      return <Info className="w-5 h-5" />;
  }
};

const getStatusStyles = (type: StatusType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800';
  }
};

export const StatusMessage: React.FC<StatusMessageProps> = ({ 
  className = "" 
}) => {
  const { statusMessage, hideStatusMessage } = useClipboardStore();
  const { type, message, visible } = statusMessage;

  // 自动隐藏逻辑已在store中处理，这里只是额外的保险
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        hideStatusMessage();
      }, 5000); // 5秒后强制隐藏
      
      return () => clearTimeout(timer);
    }
  }, [visible, hideStatusMessage]);

  if (!visible || !message) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div
        className={
          `flex items-center p-4 border rounded-lg shadow-lg ` +
          `transition-all duration-300 ease-in-out ` +
          `max-w-md w-full mx-4 ` +
          getStatusStyles(type)
        }
      >
        {/* 状态图标 */}
        <div className="flex-shrink-0 mr-3">
          {getStatusIcon(type)}
        </div>
        
        {/* 消息内容 */}
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={hideStatusMessage}
          className={
            "flex-shrink-0 ml-3 p-1 rounded-full " +
            "hover:bg-black hover:bg-opacity-10 " +
            "transition-colors duration-200 " +
            "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
            (type === 'success' ? 'focus:ring-green-500' :
             type === 'error' ? 'focus:ring-red-500' : 'focus:ring-blue-500')
          }
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};