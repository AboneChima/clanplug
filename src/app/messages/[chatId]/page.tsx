'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  IoSendOutline,
  IoArrowBack,
  IoEllipsisVertical,
  IoImageOutline,
  IoHappyOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authApi } from '@/lib/auth-api';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface Chat {
  id: string;
  participants: {
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  }[];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = params.chatId as string;

  // Get other participant
  const otherParticipant = chat?.participants.find(p => p.user.id !== user?.id)?.user;

  useEffect(() => {
    if (chatId) {
      loadChat();
      loadMessages();
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      const response = await authApi.get(`/api/chats/${chatId}`);
      if (response.success) {
        setChat(response.data);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await authApi.get(`/api/chats/${chatId}/messages`);
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await authApi.post(`/api/chats/${chatId}/messages`, {
        content: newMessage.trim(),
      });

      if (response.success) {
        setNewMessage('');
        await loadMessages();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppShell>
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/feed?tab=inbox&section=messages')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <IoArrowBack className="w-5 h-5 text-white" />
          </button>

          {otherParticipant && (
            <>
              {otherParticipant.avatar ? (
                <Image
                  src={otherParticipant.avatar}
                  alt={otherParticipant.username}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-white font-semibold">
                  {otherParticipant.firstName} {otherParticipant.lastName}
                </h2>
                <p className="text-gray-400 text-sm">@{otherParticipant.username}</p>
              </div>
            </>
          )}

          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <IoEllipsisVertical className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400 mb-2">No messages yet</p>
                <p className="text-gray-500 text-sm">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user.id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                    message.user.avatar ? (
                      <Image
                        src={message.user.avatar}
                        alt={message.user.username}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {message.user.firstName[0]}{message.user.lastName[0]}
                        </span>
                      </div>
                    )
                  )}
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 px-2">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="bg-gray-800/50 border-t border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <IoImageOutline className="w-6 h-6 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => setNewMessage(newMessage + ' 😊')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <IoHappyOutline className="w-6 h-6 text-gray-400" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoSendOutline className="w-6 h-6 text-white" />
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
