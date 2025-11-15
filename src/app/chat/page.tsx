"use client";

import { useEffect, useRef, useState } from 'react';
import { 
  IoChatbubbleEllipsesOutline, 
  IoSendOutline, 
  IoArrowBackOutline,
  IoSearchOutline,
  IoCheckmarkDoneOutline
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { chatService, Chat, ChatMessage } from '@/services/chat.service';

export default function ChatPage() {
  const { accessToken, user } = useAuth();
  const { showToast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (accessToken) loadChats();
  }, [accessToken]);

  useEffect(() => {
    if (selected && accessToken) {
      loadMessages(selected.id);
    }
  }, [selected?.id, accessToken]);

  const loadChats = async () => {
    if (!accessToken) return;
    try {
      const chats = await chatService.getChats(accessToken);
      setChats(chats);
    } catch (error) {
      console.error('Load chats error:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const msgs = await chatService.getMessages(chatId, accessToken);
      console.log('✅ Loaded messages:', msgs);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selected || !accessToken || sending) return;
    
    const content = messageText.trim();
    setMessageText('');
    setSending(true);
    
    try {
      const newMsg = await chatService.sendMessage(selected.id, { content, type: 'TEXT' }, accessToken);
      setMessages(prev => [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error: any) {
      showToast(error.message || 'Failed to send', 'error');
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const getDisplayName = (chat: Chat) => {
    const other = chat.participants?.find(p => p.userId !== user?.id);
    if (other?.user) {
      const name = `${other.user.firstName || ''} ${other.user.lastName || ''}`.trim();
      return name || other.user.username;
    }
    return chat.name || 'Chat';
  };

  const getAvatar = (chat: Chat) => {
    const other = chat.participants?.find(p => p.userId !== user?.id);
    return other?.user?.avatar;
  };

  return (
    <AppShell>
      {/* Desktop & Mobile Layout */}
      <div className="fixed inset-0 top-16 lg:static lg:inset-auto lg:h-[calc(100vh-8rem)]">
        <div className="h-full flex flex-col lg:flex-row lg:gap-4 lg:max-w-7xl lg:mx-auto">
          
          {/* Chat List - Hide on mobile when chat selected */}
          <div className={`${selected ? 'hidden lg:flex' : 'flex'} lg:w-80 flex-col bg-slate-800 lg:rounded-lg border-r lg:border border-slate-700 h-full`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white mb-3">Messages</h2>
              <div className="relative">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No messages yet</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelected(chat)}
                    className={`w-full p-3 hover:bg-slate-700 border-b border-slate-700 transition-colors text-left ${
                      selected?.id === chat.id ? 'bg-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getAvatar(chat) ? (
                        <img src={getAvatar(chat)!} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold">{getDisplayName(chat).charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate text-sm">{getDisplayName(chat)}</h3>
                        <p className="text-xs text-gray-400 truncate">Tap to open</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Conversation - Show on mobile when chat selected */}
          <div className={`${!selected ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-slate-900 lg:rounded-lg lg:border border-slate-700 h-full`}>
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <IoChatbubbleEllipsesOutline className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Select a chat to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="lg:hidden p-2 hover:bg-slate-700 rounded transition-colors"
                  >
                    <IoArrowBackOutline className="w-5 h-5 text-white" />
                  </button>
                  {getAvatar(selected) ? (
                    <img src={getAvatar(selected)!} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold">{getDisplayName(selected).charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-white">{getDisplayName(selected)}</h2>
                    <p className="text-xs text-green-400">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-sm">No messages yet. Say hi! 👋</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.userId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                            isOwn ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                          }`}>
                            <p className="text-sm break-words">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && <IoCheckmarkDoneOutline className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-slate-800 border-t border-slate-700 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 px-4 py-2.5 border border-slate-600 rounded-full bg-slate-700 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sending}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
