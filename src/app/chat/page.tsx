"use client";

import { useEffect, useRef, useState } from 'react';
import { 
  IoChatbubbleEllipsesOutline, 
  IoSendOutline, 
  IoAddOutline, 
  IoPersonOutline, 
  IoSearchOutline,
  IoEllipsisVerticalOutline,
  IoCheckmarkDoneOutline,
  IoCheckmarkOutline
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { chatService, Chat, ChatMessage } from '@/services/chat.service';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import { useVisibilityRefresh } from '@/hooks/usePageVisibility';

export default function ChatPage() {
  const { accessToken, user } = useAuth();
  const { showToast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = async () => {
    if (!accessToken) return;
    try {
      setChatsLoading(true);
      const chats = await chatService.getChats(accessToken);
      setChats(chats);
    } catch (error: any) {
      showToast(error.message || 'Failed to load chats', 'error');
    } finally {
      setChatsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!accessToken) return;
    try {
      setMessagesLoading(true);
      const messages = await chatService.getMessages(accessToken, chatId);
      setMessages(messages);
    } catch (error: any) {
      showToast(error.message || 'Failed to load messages', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  useVisibilityRefresh(loadChats, [accessToken], {
    refreshOnVisible: true,
    refreshDelay: 1000,
    enabled: !!accessToken
  });

  useEffect(() => {
    if (!accessToken) {
      setChatsLoading(false);
      setChats([]);
      setMessages([]);
      setSelected(null);
    }
  }, [accessToken]);

  // Handle chatId from URL query (when coming from message button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chatId');
    
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat && (!selected || selected.id !== chatId)) {
        setSelected(chat);
        loadMessages(chatId);
        // Clear URL query after selecting
        window.history.replaceState({}, '', '/chat');
      }
    }
  }, [chats]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
  }, [selected?.id]);

  // Disable real-time for now - just use polling
  useEffect(() => {
    if (!accessToken || !selected) return;
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      loadMessages(selected.id);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [accessToken, selected?.id]);

  const handleSendMessage = async (content: string, attachments?: string[], replyToId?: string) => {
    if (!accessToken || !selected) return;
    
    try {
      const message = await chatService.sendMessage(selected.id, {
        content,
        attachments,
        replyToId
      }, accessToken);
      setMessages(prev => [...prev, message]);
      setReplyTo(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to send message', 'error');
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!accessToken || !selected) return;
    
    try {
      const updatedMessage = await chatService.editMessage(accessToken, selected.id, messageId, newContent);
      setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
      showToast('Message updated', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to edit message', 'error');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!accessToken || !selected) return;
    
    try {
      await chatService.deleteMessage(accessToken, selected.id, messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isDeleted: true, content: '' } : msg
      ));
      showToast('Message deleted', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete message', 'error');
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyTo(message);
  };

  const onCreateChat = async () => {
    showToast('Please select a user from your contacts to start a chat', 'error');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 168) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants?.some(p => p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Hero Header - Compact */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-3 sm:py-6 mb-4">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white mb-0.5">Messages</h1>
                <p className="text-xs sm:text-sm text-white/80">
                  {chats.length} conversations
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 h-[calc(100vh-200px)] lg:h-[calc(100vh-180px)]">
            {/* Sidebar */}
            <div className="lg:col-span-4 xl:col-span-3 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 flex flex-col overflow-hidden shadow-xl">
              {/* Search */}
              <div className="p-2 sm:p-3 border-b border-slate-700">
                <div className="relative">
                  <IoSearchOutline className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {!user ? (
                  <div className="text-center py-12 px-4">
                    <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Please log in to view messages</p>
                  </div>
                ) : chatsLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-2">
                      {searchQuery ? 'No conversations found' : 'No messages yet'}
                    </p>
                    {!searchQuery && (
                      <p className="text-gray-500 text-xs">
                        Visit a user's profile and click "Message" to start chatting
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-1.5">
                    {filteredChats.map((chat) => {
                      // Get the other participant (not current user)
                      const otherParticipant = chat.participants?.find(p => p.userId !== user?.id);
                      const displayName = otherParticipant?.user 
                        ? `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim() || otherParticipant.user.username
                        : chat.name || 'Chat';
                      const avatar = otherParticipant?.user?.avatar;
                      
                      return (
                        <button
                          key={chat.id}
                          onClick={() => setSelected(chat)}
                          className={`w-full p-2 rounded-lg mb-1.5 transition-all text-left ${
                            selected?.id === chat.id
                              ? 'bg-blue-600/20 border border-blue-500/50'
                              : 'hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-slate-600"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-sm">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <h3 className="font-semibold text-white truncate text-sm">
                                  {displayName}
                                </h3>
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                                  {formatTime(chat.updatedAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                {otherParticipant?.user?.username ? `@${otherParticipant.user.username}` : 'Tap to chat'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="lg:col-span-8 xl:col-span-9 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 flex flex-col overflow-hidden shadow-xl">
              {!selected ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                      <IoChatbubbleEllipsesOutline className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">No conversation selected</h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Select a chat from the list or message someone from their profile
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const otherParticipant = selected.participants?.find(p => p.userId !== user?.id);
                        const displayName = otherParticipant?.user 
                          ? `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim() || otherParticipant.user.username
                          : selected.name || 'Chat';
                        const avatar = otherParticipant?.user?.avatar;
                        
                        return (
                          <>
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-slate-600"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <h2 className="font-semibold text-white text-base truncate">{displayName}</h2>
                              <p className="text-xs text-green-400">
                                {otherParticipant?.isActive ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0">
                      <IoEllipsisVerticalOutline className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                            <div className={`h-16 rounded-xl bg-slate-700/50 animate-pulse ${
                              i % 2 ? 'w-3/4' : 'w-2/3'
                            }`}></div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isOwn={message.userId === user?.id}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onReply={handleReply}
                          />
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    replyTo={replyTo || undefined}
                    onCancelReply={() => setReplyTo(null)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
