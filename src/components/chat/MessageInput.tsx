"use client";

import { useState, useRef, useCallback } from 'react';
import { 
  IoSendOutline, 
  IoAttachOutline, 
  IoCloseOutline,
  IoHappyOutline,
  IoMicOutline
} from 'react-icons/io5';
import { ChatMessage } from '@/services/chat.service';
import FileUpload from './FileUpload';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: string[], replyToId?: string) => void;
  replyTo?: ChatMessage;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({ 
  onSendMessage, 
  replyTo, 
  onCancelReply,
  disabled = false,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const emojis = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '💯'];

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    onSendMessage(message.trim(), attachments, replyTo?.id);
    setMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUploaded = (url: string, filename: string, type: string) => {
    setAttachments(prev => [...prev, url]);
    setShowFileUpload(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const getAttachmentPreview = (url: string, index: number) => {
    const filename = url.split('/').pop() || 'file';
    const isImage = filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
      <div key={index} className="relative group">
        {isImage ? (
          <img
            src={url}
            alt={filename}
            className="w-16 h-16 object-cover rounded-lg border border-slate-600"
          />
        ) : (
          <div className="w-16 h-16 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center">
            <IoAttachOutline className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <button
          onClick={() => removeAttachment(index)}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
        >
          <IoCloseOutline className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="border-t border-slate-700 bg-slate-800/50 p-4">
        {/* Reply Preview */}
        {replyTo && (
          <div className="mb-3 p-3 bg-slate-700/50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-400 font-medium mb-1">
                  Replying to {replyTo.user?.username || 'Unknown'}
                </p>
                <p className="text-sm text-gray-300 truncate">
                  {replyTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 hover:bg-slate-600 rounded transition-colors"
              >
                <IoCloseOutline className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {attachments.map((url, index) => getAttachmentPreview(url, index))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <button
            onClick={() => setShowFileUpload(true)}
            disabled={disabled}
            className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoAttachOutline className="w-5 h-5" />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full p-3 pr-12 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {/* Emoji Button */}
            <div className="absolute right-3 bottom-3">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoHappyOutline className="w-5 h-5" />
              </button>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 grid grid-cols-6 gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoSendOutline className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onFileUploaded={handleFileUploaded}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </>
  );
}