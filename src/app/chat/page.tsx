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
import { useVisibilityRefresh } from '@/hooks/usePageVisibility';

export default function ChatPage() {
  const { accessToken, user } = useAuth();
  const { showToast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasOpenedChatFromUrl = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async () => {
    if (!accessToken) return;
    try {
      setChatsLoading(true);
      const chats = await chatService.getChats(accessToken);
      
      // Check localStorage for any manually added chats
      const manualChats: Chat[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chat_')) {
          try {
            const chatData = localStorage.getItem(key);
            if (chatData) {
              const chat = JSON.parse(chatData);
              // Only add if not in server response
              if (!chats.find(c => c.id === chat.id)) {
                manualChats.push(chat);
              } else {
                // Chat is now in server, remove from localStorage
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            console.error('Error parsing stored chat:', e);
          }
        }
      }
      
      setChats([...manualChats, ...chats]);
    } catch (error: any) {
      console.error('Load chats error:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!accessToken) {
      console.log('⚠️ No access token, cannot load messages');
      return;
    }
    try {
      console.log('🔄 Loading messages for chat:', chatId);
      setMessagesLoading(true);
      const messages = await chatService.getMessages(chatId, accessToken);
      console.log('📨 Loaded messages for chat', chatId, ':', messages.length, 'messages');
      console.log('📋 Messages array:', messages);
      
      if (messages && messages.length > 0) {
        console.log('✅ Setting', messages.length, 'messages to state');
        setMessages(messages);
      } else {
        console.log('⚠️ No messages returned, setting empty array');
        setMessages([]);
      }
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      console.error('❌ Load messages error:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  useVisibilityRefresh(loadChats, [accessToken], {
    refreshOnVisible: true,
    refreshDelay: 1000,
    enabled: !!accessToken
  });

  // Load messages when a chat is selected
  useEffect(() => {
    if (selected && accessToken) {
      console.log('Selected chat changed, loading messages for:', selected.id);
      // Clear messages first to show loading state
      setMessages([]);
      loadMessages(selected.id);
    } else if (!selected) {
      // Clear messages when no chat selected
      setMessages([]);
    }
  }, [selected?.id, accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setChatsLoading(false);
      setChats([]);
      setMessages([]);
      setSelected(null);
    }
  }, [accessToken]);

  // Handle chatId from URL - Open chat directly when clicking Message button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chatId');
    
    if (!chatId || !accessToken) return;
    
    // Only run once per chatId
    if (hasOpenedChatFromUrl.current === chatId) return;
    hasOpenedChatFromUrl.current = chatId;
    
    const openChat = async () => {
      try {
        console.log('Opening chat from URL:', chatId);
        
        // Load all chats first
        const loadedChats = await chatService.getChats(accessToken);
        
        // Try to find the chat
        let chat = loadedChats.find(c => c.id === chatId);
        
        if (chat) {
          console.log('Chat found in list!', chat);
          setChats(loadedChats);
          setSelected(chat);
          await loadMessages(chatId);
        } else {
          console.log('Chat not in list yet, checking for pending user info');
          
          // Check if we have pending user info from localStorage
          const pendingUserStr = localStorage.getItem('pendingChatUser');
          let otherUser = null;
          
          if (pendingUserStr) {
            try {
              otherUser = JSON.parse(pendingUserStr);
              localStorage.removeItem('pendingChatUser'); // Clean up
              console.log('Got user info from localStorage:', otherUser);
            } catch (e) {
              console.error('Error parsing pending user:', e);
            }
          }
          
          // If no pending user, try to get from messages
          if (!otherUser) {
            const messages = await chatService.getMessages(chatId, accessToken);
            setMessages(messages);
            const otherUserMsg = messages.find(m => m.userId !== user?.id);
            otherUser = otherUserMsg?.user;
          } else {
            // Load messages anyway
            await loadMessages(chatId);
          }
          
          // Create chat object with user info
          const newChat: Chat = {
            id: chatId,
            type: 'DIRECT',
            name: otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.username : 'New Chat',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            participants: otherUser ? [{
              id: `part-${chatId}`,
              userId: otherUser.id,
              role: 'MEMBER',
              joinedAt: new Date().toISOString(),
              isActive: true,
              user: otherUser
            }] : []
          };
          
          console.log('Created chat object:', newChat);
          
          // Add to chats list and select it
          setChats([newChat, ...loadedChats]);
          setSelected(newChat);
          
          // Also save to localStorage so it persists
          localStorage.setItem(`chat_${chatId}`, JSON.stringify(newChat));
        }
        
        // Clean up URL
        window.history.replaceState({}, '', '/chat');
      } catch (error) {
        console.error('Error opening chat:', error);
      }
    };
    
    openChat();
  }, [accessToken, user?.id]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
  }, [selected?.id]);

  // Poll for new messages - DISABLED to prevent refresh glitches
  // useEffect(() => {
  //   if (!accessToken || !selected) return;
  //   
  //   const interval = setInterval(() => {
  //     loadMessages(selected.id);
  //   }, 5000);
  //   
  //   return () => clearInterval(interval);
  // }, [accessToken, selected?.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !accessToken || !selected || sending) return;
    
    const content = messageText.trim();
    setMessageText('');
    setSending(true);
    
    try {
      const newMessage = await chatService.sendMessage(selected.id, {
        content,
        type: 'TEXT'
      }, accessToken);
      
      setMessages(prev => [...prev, newMessage]);
      setTimeout(scrollToBottom, 100);
      
      // Reload chats to show this conversation in the list
      loadChats();
    } catch (error: any) {
      console.error('Send message error:', error);
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send message';
      showToast(errorMsg, 'error');
      setMessageText(content); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 168) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants?.some(p => p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants?.find(p => p.userId !== user?.id);
  };

  const getDisplayName = (chat: Chat) => {
    const otherParticipant = getOtherParticipant(chat);
    if (otherParticipant?.user) {
      const fullName = `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim();
      return fullName || otherParticipant.user.username;
    }
    return chat.name || 'Chat';
  };

  const getAvatar = (chat: Chat) => {
    const otherParticipant = getOtherParticipant(chat);
    return otherParticipant?.user?.avatar;
  };

  return (
    <AppShell>
      <div className="-m-4 sm:-m-6 lg:-m-8">
        {/* Mobile: Show either chat list or conversation */}
        <div className="lg:hidden">
          {!selected ? (
            // Chat List View (Mobile) - WhatsApp Style
            <div className="flex flex-col bg-slate-900" style={{ height: 'calc(100vh - 204px)' }}>
              {/* Header - 60px */}
              <div className="bg-slate-800 border-b border-slate-700 flex-shrink-0" style={{ minHeight: '60px', padding: '12px' }}>
                <h1 className="text-sm font-bold text-white mb-1.5">Messages</h1>
                <div className="relative">
                  <IoSearchOutline className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      {searchQuery ? 'No chats found' : 'No messages yet'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Visit a profile and tap "Message"
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredChats.map((chat) => {
                      const displayName = getDisplayName(chat);
                      const avatar = getAvatar(chat);
                      
                      return (
                        <button
                          key={chat.id}
                          onClick={() => setSelected(chat)}
                          className="w-full p-3 hover:bg-slate-800 border-b border-slate-800 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-white truncate text-sm">
                                  {displayName}
                                </h3>
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                  {formatTime(chat.updatedAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                Tap to open chat
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
          ) : (
            // Conversation View (Mobile) - WhatsApp Style
            <div className="flex flex-col bg-slate-900" style={{ height: 'calc(100vh - 204px)' }}>
              {/* Chat Header - 60px Fixed */}
              <div className="bg-slate-800 border-b border-slate-700 flex items-center gap-3 flex-shrink-0" style={{ height: '60px', padding: '0 12px' }}>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                >
                  <IoArrowBackOutline className="w-5 h-5 text-white" />
                </button>
                {(() => {
                  const displayName = getDisplayName(selected);
                  const avatar = getAvatar(selected);
                  
                  return (
                    <>
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-white truncate">{displayName}</h2>
                        <p className="text-xs text-green-400">Online</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages - WhatsApp Style Scrollable */}
              <div className="flex-1 overflow-y-auto px-3 py-2 bg-slate-900">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`h-12 rounded-2xl bg-slate-800 animate-pulse ${
                          i % 2 ? 'w-3/4' : 'w-2/3'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <IoChatbubbleEllipsesOutline className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Say hi! 👋</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {messages.map((message) => {
                      const isOwn = message.userId === user?.id;
                      return (
                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-2.5 py-1.5 ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-800 text-white rounded-bl-sm'
                          }`}>
                            <p className="text-sm break-words">{message.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                {formatMessageTime(message.createdAt)}
                              </span>
                              {isOwn && (
                                <IoCheckmarkDoneOutline className="w-3 h-3 text-blue-100" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input - Sticky Above Bottom Menu (WhatsApp Style) */}
              <div className="bg-slate-800 border-t border-slate-700 p-3 flex-shrink-0" style={{ position: 'sticky', bottom: '80px', zIndex: 50 }}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    ref={textareaRef as any}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 border border-slate-600 rounded-full bg-slate-700 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <IoSendOutline className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Show both side by side */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
              {/* Chat List */}
              <div className="col-span-4 bg-slate-800 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h1 className="text-xl font-bold text-white mb-3">Messages</h1>
                  <div className="relative">
                    <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {!user ? (
                    <div className="text-center py-12 px-4">
                      <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Please log in</p>
                    </div>
                  ) : chatsLoading ? (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 bg-slate-700 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No messages yet</p>
                    </div>
                  ) : (
                    <div>
                      {filteredChats.map((chat) => {
                        const displayName = getDisplayName(chat);
                        const avatar = getAvatar(chat);
                        
                        return (
                          <button
                            key={chat.id}
                            onClick={() => setSelected(chat)}
                            className={`w-full p-3 hover:bg-slate-700 border-b border-slate-700 transition-colors text-left ${
                              selected?.id === chat.id ? 'bg-slate-700' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={displayName}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {displayName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-white truncate">
                                    {displayName}
                                  </h3>
                                  <span className="text-xs text-gray-400">
                                    {formatTime(chat.updatedAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                  Click to open
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

              {/* Conversation */}
              <div className="col-span-8 bg-slate-800 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
                {!selected ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <IoChatbubbleEllipsesOutline className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">Select a chat to start messaging</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                      {(() => {
                        const displayName = getDisplayName(selected);
                        const avatar = getAvatar(selected);
                        
                        return (
                          <>
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <h2 className="font-semibold text-white">{displayName}</h2>
                              <p className="text-xs text-green-400">Online</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {messagesLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                              <div className={`h-12 rounded-2xl bg-slate-700 animate-pulse ${
                                i % 2 ? 'w-3/4' : 'w-2/3'
                              }`}></div>
                            </div>
                          ))}
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                          <IoChatbubbleEllipsesOutline className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400">Start the conversation!</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => {
                            const isOwn = message.userId === user?.id;
                            return (
                              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-slate-700 text-white rounded-bl-sm'
                                }`}>
                                  <p className="text-sm break-words">{message.content}</p>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                      {formatMessageTime(message.createdAt)}
                                    </span>
                                    {isOwn && (
                                      <IoCheckmarkDoneOutline className="w-3 h-3 text-blue-100" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-700">
                      <div className="flex items-end gap-3">
                        <textarea
                          ref={textareaRef}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          disabled={sending}
                          className="flex-1 p-3 border border-slate-600 rounded-xl bg-slate-700 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          rows={1}
                          style={{ maxHeight: '120px' }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sending}
                          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </AppShell>
  );
}
