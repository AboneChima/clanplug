"use client";

import { useState } from 'react';
import { 
  IoEllipsisVerticalOutline, 
  IoArrowUndoOutline, 
  IoPencilOutline, 
  IoTrashOutline,
  IoDownloadOutline,
  IoImageOutline,
  IoDocumentOutline,
  IoCheckmarkOutline,
  IoCloseOutline
} from 'react-icons/io5';
import { ChatMessage, ChatService } from '@/services/chat.service';
import { chatService } from '@/services/chat.service';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar = true,
  onReply,
  onEdit,
  onDelete
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAttachment = (url: string, index: number) => {
    const filename = url.split('/').pop() || 'file';
    const isImage = ChatService.isImageFile(filename);

    if (isImage) {
      return (
        <div key={index} className="mt-2 relative group">
          <img
            src={url}
            alt={filename}
            className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, '_blank')}
          />
          <button
            onClick={() => downloadFile(url, filename)}
            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <IoDownloadOutline className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div key={index} className="mt-2 flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg max-w-xs">
        <div className="flex-shrink-0">
          {ChatService.getFileIcon(filename)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {filename}
          </p>
          <p className="text-xs text-gray-400">
            Click to download
          </p>
        </div>
        <button
          onClick={() => downloadFile(url, filename)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <IoDownloadOutline className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    );
  };

  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-2 p-2 border-l-2 border-blue-400 bg-slate-800/50 rounded-r-lg">
        <p className="text-xs text-blue-400 font-medium">
          Replying to {message.replyTo.sender?.firstName || 'User'}
        </p>
        <p className="text-sm text-gray-300 truncate">
          {message.replyTo.content}
        </p>
      </div>
    );
  };

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-sm text-gray-400 italic">This message was deleted</p>
            <p className="text-xs text-gray-500 mt-1">{formatTime(message.createdAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className="max-w-xs lg:max-w-md relative">
        {/* Avatar for received messages */}
        {!isOwn && showAvatar && (
          <div className="flex items-start gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
              {message.user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1">
              {message.user?.username || 'Unknown'}
            </p>
          </div>
        )}

        {/* Message Content */}
        <div
          className={`relative rounded-2xl p-3 ${
            isOwn
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm'
              : 'bg-slate-700/50 text-white border border-slate-600 rounded-bl-sm'
          }`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {renderReplyTo()}

          {/* Message Text */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-slate-600 rounded-lg bg-slate-800 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                >
                  <IoCheckmarkOutline className="w-4 h-4 text-green-400" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                >
                  <IoCloseOutline className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.content && (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
              )}

              {/* Attachments */}
              {message.attachments.map((url, index) => renderAttachment(url, index))}

              {/* Message Info */}
              <div className="flex items-center gap-1 mt-1.5">
                <p className={`text-xs ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                  {formatTime(message.createdAt)}
                  {message.isEdited && ' • edited'}
                </p>
              </div>
            </>
          )}

          {/* Actions Menu */}
          {showActions && !isEditing && (
            <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full -mr-2'} flex items-center gap-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-1`}>
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Reply"
                >
                  <IoArrowUndoOutline className="w-4 h-4 text-gray-300" />
                </button>
              )}
              {isOwn && onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Edit"
                >
                  <IoPencilOutline className="w-4 h-4 text-gray-300" />
                </button>
              )}
              {isOwn && onDelete && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Delete"
                >
                  <IoTrashOutline className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}