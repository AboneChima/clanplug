"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  IoChatbubbleEllipsesOutline, 
  IoSendOutline, 
  IoArrowBackOutline,
  IoCheckmarkDoneOutline
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { chatService, Chat, ChatMessage } from '@/services/chat.service';

function ChatContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams?.get('id');
  
  const { accessToken, user } = useAuth();
  const { showToast } = useToast();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats on mount
  useEffect(() => {
    if (accessToken) loadChats();
  }, [accessToken]);

  // Open specific chat from URL
  useEffect(() => {
    if (chatId) {
      if (chats.length > 0) {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
          setCurrentChat(chat);
        } else {
          // Chat not in list yet, try to fetch it
          loadChatById(chatId);
        }
      } else {
        // If chats haven't loaded yet, try to fetch the specific chat
        loadChatById(chatId);
      }
    }
  }, [chatId, chats]);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.id);
    }
  }, [currentChat?.id]);

  const loadChats = async () => {
    if (!accessToken) return;
    try {
      const data = await chatService.getChats(accessToken);
      setChats(data);
    } catch (error) {
      console.error('Load chats error:', error);
    }
  };

  const loadChatById = async (id: string) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCurrentChat(data.data);
          setChats(prev => [...prev, data.data]);
        }
      }
    } catch (error) {
      console.error('Load chat by ID error:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const msgs = await chatService.getMessages(chatId, accessToken);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !currentChat || !accessToken || sending) return;
    
    const content = messageText.trim();
    setMessageText('');
    setSending(true);
    
    try {
      const newMsg = await chatService.sendMessage(currentChat.id, { content, type: 'TEXT' }, accessToken);
      setMessages(prev => [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error: any) {
      showToast(error.message || 'Failed to send', 'error');
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = (chat: Chat) => {
    return chat.participants?.find(p => p.userId !== user?.id);
  };

  const getDisplayName = (chat: Chat) => {
    const other = getOtherUser(chat);
    if (other?.user) {
      const name = `${other.user.firstName || ''} ${other.user.lastName || ''}`.trim();
      return name || other.user.username;
    }
    return chat.name || 'Chat';
  };

  const getAvatar = (chat: Chat) => {
    const other = getOtherUser(chat);
    return other?.user?.avatar;
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (hours < 168) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <AppShell>
      <div className="fixed inset-0 top-16 bottom-20 lg:static lg:inset-auto lg:bottom-auto lg:h-[calc(100vh-10rem)] -m-4 sm:-m-6 lg:m-0">
        <div className="h-full flex lg:max-w-7xl lg:mx-auto lg:gap-4 lg:p-4">
          
          {/* Chat List */}
          <div className={`${currentChat ? 'hidden lg:flex' : 'flex'} lg:w-80 flex-col bg-slate-800 lg:rounded-lg border-r lg:border border-slate-700 h-full overflow-hidden`}>
            <div className="p-3 sm:p-4 border-b border-slate-700 flex-shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-white">Messages</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {chats.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No messages yet</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setCurrentChat(chat);
                      window.history.pushState({}, '', `/chat?id=${chat.id}`);
                    }}
                    className={`w-full p-3 sm:p-3.5 hover:bg-slate-700 border-b border-slate-700 transition-colors text-left ${
                      currentChat?.id === chat.id ? 'bg-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getAvatar(chat) ? (
                        <img src={getAvatar(chat)!} alt="" className="w-12 h-12 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">{getDisplayName(chat).charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate text-sm sm:text-[15px]">{getDisplayName(chat)}</h3>
                          <span className="text-[10px] sm:text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatTime(chat.updatedAt)}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">Tap to open</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Conversation */}
          <div className={`${!currentChat ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-slate-900 lg:rounded-lg lg:border border-slate-700 h-full overflow-hidden`}>
            {!currentChat ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <IoChatbubbleEllipsesOutline className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Select a chat to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="bg-slate-800 border-b border-slate-700 p-3 sm:p-3.5 flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      setCurrentChat(null);
                      window.history.pushState({}, '', '/chat');
                    }}
                    className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 -ml-1"
                  >
                    <IoArrowBackOutline className="w-5 h-5 text-white" />
                  </button>
                  {getAvatar(currentChat) ? (
                    <img src={getAvatar(currentChat)!} alt="" className="w-10 h-10 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">{getDisplayName(currentChat).charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white text-[15px] sm:text-sm truncate">{getDisplayName(currentChat)}</h2>
                    <p className="text-[11px] text-green-400">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2.5">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <p className="text-gray-400 text-sm">No messages yet. Say hi! 👋</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.userId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${
                            isOwn ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-800 text-white rounded-bl-md'
                          }`}>
                            <p className="text-[14px] sm:text-[13px] break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px] opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && <IoCheckmarkDoneOutline className="w-3.5 h-3.5 opacity-70" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-slate-800 border-t border-slate-700 p-3 sm:p-3.5 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 px-4 py-2.5 sm:py-2 border border-slate-600 rounded-full bg-slate-700 text-white text-[15px] sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sending}
                      className="p-2.5 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg"
                    >
                      <IoSendOutline className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    }>
      <ChatContent />
    </Suspense>
  );
}
