"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { 
  IoChatbubbleEllipsesOutline, 
  IoSendOutline, 
  IoArrowBackOutline,
  IoCheckmarkDoneOutline,
  IoHappyOutline,
  IoArrowUndoOutline,
  IoImageOutline,
  IoCloseOutline
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [menuButtonRect, setMenuButtonRect] = useState<DOMRect | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😭', '😡', '🤯', '👍', '👎', '❤️', '🔥', '💯', '🎉', '✨', '💪', '🙏', '👏', '🤝', '💀', '😴', '🤗', '😇', '🥳', '😱', '🤩', '😋', '🤤'];

  // Load chats on mount and when returning to page
  useEffect(() => {
    if (accessToken) {
      loadChats();
      
      // Reload chats when page becomes visible (user returns to tab/app)
      const handleVisibilityChange = () => {
        if (!document.hidden && accessToken) {
          loadChats();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
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
    } else {
      // Reload chats when returning to list view
      if (accessToken) {
        loadChats();
      }
    }
  }, [currentChat?.id]);

  const loadChats = async () => {
    if (!accessToken) {
      console.log('⚠️ No access token, cannot load chats');
      return;
    }
    try {
      console.log('🔄 Loading chats...');
      const data = await chatService.getChats(accessToken);
      console.log('✅ Loaded chats:', data.length, 'chats');
      console.log('📋 Chats data:', data);
      setChats(data);
    } catch (error) {
      console.error('❌ Load chats error:', error);
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
          // Only add if not already in list (prevent duplicates)
          setChats(prev => {
            const exists = prev.find(c => c.id === data.data.id);
            if (exists) {
              // Update existing chat
              return prev.map(c => c.id === data.data.id ? data.data : c);
            }
            // Add new chat
            return [...prev, data.data];
          });
        }
      }
    } catch (error) {
      console.error('Load chat by ID error:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!accessToken) {
      console.log('⚠️ No access token for loading messages');
      return;
    }
    try {
      console.log('🔄 Loading messages for chat:', chatId);
      setLoading(true);
      const msgs = await chatService.getMessages(chatId, accessToken);
      console.log('✅ Loaded messages:', msgs.length, 'messages');
      console.log('📋 Messages:', msgs);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // Mark all messages in this chat as read (WhatsApp-style)
      markChatAsRead(chatId);
    } catch (error) {
      console.error('❌ Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markChatAsRead = async (chatId: string) => {
    if (!accessToken) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${chatId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Update local chat list to reflect read status
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 } 
            : chat
        )
      );
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedImage) || !currentChat || !accessToken || sending) return;
    
    setSending(true);
    
    try {
      let imageUrl = '';
      
      // Upload image first if selected
      if (selectedImage) {
        try {
          const uploadResult = await chatService.uploadFile(accessToken, selectedImage);
          if (uploadResult.success && uploadResult.data?.url) {
            imageUrl = uploadResult.data.url;
          } else {
            throw new Error('Failed to upload image');
          }
        } catch (uploadError: any) {
          showToast(uploadError.message || 'Failed to upload image', 'error');
          setSending(false);
          return;
        }
      }
      
      const content = messageText.trim() || ''; // Don't add "Image" text
      const messageData: any = { 
        content, 
        type: imageUrl ? 'IMAGE' : 'TEXT',
        attachments: imageUrl ? [imageUrl] : []
      };
      
      if (replyingTo) {
        messageData.replyToId = replyingTo.id;
      }
      
      setMessageText('');
      setSelectedImage(null);
      setShowEmojiPicker(false);
      
      const newMsg = await chatService.sendMessage(currentChat.id, messageData, accessToken);
      setMessages(prev => [...prev, newMsg]);
      setReplyingTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error: any) {
      showToast(error.message || 'Failed to send', 'error');
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

  const getLastMessage = (chat: Chat) => {
    const messages = (chat as any).messages;
    if (messages && messages.length > 0) {
      return messages[0];
    }
    return null;
  };

  const formatTime = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (hours < 168) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // WhatsApp-style: Hide AppShell chrome when in conversation on mobile
  const isInConversation = !!currentChat;
  
  return (
    <AppShell hideNavOnMobile={isInConversation} hideBottomNavOnMobile={isInConversation}>
      {/* Fixed height container - WhatsApp style fullscreen on mobile */}
      <div className={`fixed inset-0 flex flex-col lg:block ${isInConversation ? 'top-0 bottom-0 lg:top-16 lg:bottom-0' : 'top-16 bottom-20 lg:bottom-0'}`}>
        {/* Chat container */}
        <div className="h-full flex flex-col lg:flex-row lg:max-w-7xl lg:mx-auto lg:gap-4 lg:p-4 overflow-hidden">
          
          {/* Chat List */}
          <div className={`${currentChat ? 'hidden' : 'flex'} lg:flex lg:w-80 flex-col bg-slate-800 lg:rounded-xl border-r lg:border border-slate-700 overflow-hidden`}>
            <div className="p-4 border-b border-slate-700 flex-shrink-0 bg-slate-800/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Messages</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Your conversations</p>
                </div>
                <button
                  onClick={loadChats}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Refresh chats"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-900/50">
              {chats.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <IoChatbubbleEllipsesOutline className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No conversations yet</p>
                  <p className="text-gray-500 text-xs mt-1">Follow friends to start chatting</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setCurrentChat(chat);
                      window.history.pushState({}, '', `/chat?id=${chat.id}`);
                    }}
                    className={`w-full p-4 hover:bg-slate-700/50 border-b border-slate-700/50 transition-all text-left ${
                      currentChat?.id === chat.id ? 'bg-slate-700/70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getAvatar(chat) ? (
                        <img src={getAvatar(chat)!} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-slate-600">
                          <span className="text-white font-semibold">{getDisplayName(chat).charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{getDisplayName(chat)}</h3>
                            {(getOtherUser(chat)?.user as any)?.verificationBadge?.status === 'active' && (
                              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(getLastMessage(chat)?.createdAt || chat.updatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {getLastMessage(chat)?.content || 'Start a conversation'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Conversation */}
          <div className={`${!currentChat ? 'hidden' : 'flex'} lg:flex flex-1 flex-col bg-slate-900 lg:rounded-xl lg:border border-slate-700 overflow-hidden`}>
            {!currentChat ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <IoChatbubbleEllipsesOutline className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium">Select a chat</p>
                  <p className="text-gray-500 text-sm mt-1">Choose a conversation to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header - WhatsApp Style */}
                <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 px-2 py-2 xs:px-3 xs:py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 xs:gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      setCurrentChat(null);
                      window.history.pushState({}, '', '/chat');
                    }}
                    className="lg:hidden p-1 xs:p-1.5 hover:bg-slate-700 rounded-full transition-colors flex-shrink-0"
                  >
                    <IoArrowBackOutline className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                  </button>
                  <button
                    onClick={() => {
                      const otherUser = getOtherUser(currentChat);
                      if (otherUser?.user?.id) {
                        window.location.href = `/user/${otherUser.user.id}`;
                      }
                    }}
                    className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    {getAvatar(currentChat) ? (
                      <img src={getAvatar(currentChat)!} alt="" className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-700" />
                    ) : (
                      <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-slate-600">
                        <span className="text-white text-sm xs:text-base font-semibold">{getDisplayName(currentChat).charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1">
                        <h2 className="font-semibold text-white text-sm xs:text-base sm:text-lg truncate">{getDisplayName(currentChat)}</h2>
                        {(getOtherUser(currentChat)?.user as any)?.verificationBadge?.status === 'active' && (
                          <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[10px] xs:text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                        Online
                      </p>
                    </div>
                  </button>
                  
                  {/* 3-Dot Menu */}
                  <div className="relative">
                    <button
                      ref={menuButtonRef}
                      onClick={() => {
                        if (!showChatMenu && menuButtonRef.current) {
                          setMenuButtonRect(menuButtonRef.current.getBoundingClientRect());
                        }
                        setShowChatMenu(!showChatMenu);
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>


                </div>

                {/* Messages - WhatsApp Style Background */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-2 xs:p-3 sm:p-4 space-y-1 xs:space-y-1.5 sm:space-y-2" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%230f172a\'/%3E%3Cpath d=\'M20 20l5 5m10-5l5 5m10-5l5 5m10-5l5 5M20 40l5 5m10-5l5 5m10-5l5 5m10-5l5 5M20 60l5 5m10-5l5 5m10-5l5 5m10-5l5 5M20 80l5 5m10-5l5 5m10-5l5 5m10-5l5 5\' stroke=\'%231e293b\' stroke-width=\'0.5\' opacity=\'0.1\'/%3E%3C/svg%3E")',
                  backgroundSize: '100px 100px'
                }}>
                  {loading ? (
                    <div className="text-center py-16">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 text-sm mt-3">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <p className="text-gray-400">No messages yet. Say hi! 👋</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.userId === user?.id;
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group px-1`}
                        >
                          <div 
                            className={`relative max-w-[70%] sm:max-w-[65%] touch-pan-y`}
                            onTouchStart={(e) => {
                              const touch = e.touches[0];
                              const startX = touch.clientX;
                              const startY = touch.clientY;
                              const element = e.currentTarget as HTMLElement;
                              const messageElement = element.querySelector('.message-bubble') as HTMLElement;
                              const replyIcon = element.querySelector('.reply-icon') as HTMLElement;
                              let isDragging = false;
                              
                              const handleTouchMove = (moveEvent: TouchEvent) => {
                                const moveTouch = moveEvent.touches[0];
                                const diffX = moveTouch.clientX - startX;
                                const diffY = moveTouch.clientY - startY;
                                
                                // Only trigger horizontal swipe if moving more horizontally than vertically
                                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                                  isDragging = true;
                                  moveEvent.preventDefault();
                                  
                                  // Determine swipe direction based on message ownership
                                  const maxSwipe = 80;
                                  let swipeAmount = 0;
                                  
                                  if (isOwn) {
                                    // Own messages: swipe left (negative)
                                    swipeAmount = Math.max(Math.min(diffX, 0), -maxSwipe);
                                  } else {
                                    // Other's messages: swipe right (positive)
                                    swipeAmount = Math.min(Math.max(diffX, 0), maxSwipe);
                                  }
                                  
                                  // Apply transform with smooth transition
                                  if (messageElement) {
                                    messageElement.style.transform = `translateX(${swipeAmount}px)`;
                                    messageElement.style.transition = 'none';
                                  }
                                  
                                  // Show reply icon with fade in
                                  if (replyIcon && Math.abs(swipeAmount) > 20) {
                                    replyIcon.style.opacity = String(Math.min(Math.abs(swipeAmount) / 60, 1));
                                  }
                                  
                                  // Trigger reply at threshold
                                  if (Math.abs(swipeAmount) >= 60) {
                                    setReplyingTo(msg);
                                    // Haptic feedback if available
                                    if (navigator.vibrate) {
                                      navigator.vibrate(50);
                                    }
                                    // Auto snap back immediately when reply triggers
                                    if (messageElement) {
                                      messageElement.style.transition = 'transform 0.3s ease-out';
                                      messageElement.style.transform = 'translateX(0)';
                                    }
                                    if (replyIcon) {
                                      replyIcon.style.transition = 'opacity 0.3s ease-out';
                                      replyIcon.style.opacity = '0';
                                    }
                                    cleanup();
                                  }
                                }
                              };
                              
                              const handleTouchEnd = () => {
                                if (isDragging && messageElement) {
                                  // Smooth snap back
                                  messageElement.style.transition = 'transform 0.3s ease-out';
                                  messageElement.style.transform = 'translateX(0)';
                                  if (replyIcon) {
                                    replyIcon.style.opacity = '0';
                                  }
                                }
                                cleanup();
                              };
                              
                              const cleanup = () => {
                                document.removeEventListener('touchmove', handleTouchMove);
                                document.removeEventListener('touchend', handleTouchEnd);
                              };
                              
                              document.addEventListener('touchmove', handleTouchMove, { passive: false });
                              document.addEventListener('touchend', handleTouchEnd);
                            }}
                          >
                            {/* Reply Icon - Shows during swipe */}
                            <div 
                              className={`reply-icon absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 transition-opacity pointer-events-none`}
                            >
                              <div className="p-2 bg-blue-500/20 rounded-full">
                                <IoArrowUndoOutline className="w-4 h-4 text-blue-400" />
                              </div>
                            </div>
                            
                            {/* Desktop hover reply button */}
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="absolute -left-7 top-1/2 -translate-y-1/2 p-1 bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                              title="Reply"
                            >
                              <IoArrowUndoOutline className="w-3.5 h-3.5 text-gray-300" />
                            </button>
                            
                            <div className={`message-bubble inline-block rounded-2xl shadow-md ${
                              msg.type === 'IMAGE' && msg.attachments?.length && !msg.content ? 'p-1' : 'px-2.5 xs:px-3 py-1.5 xs:py-2'
                            } ${
                              isOwn ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-800 text-white rounded-bl-md border border-slate-700'
                            }`}>
                              {msg.replyTo && (
                                <div className="mb-0.5 pb-0.5 border-b border-white/20">
                                  <p className="text-[8px] opacity-70 flex items-center gap-0.5">
                                    <IoArrowUndoOutline className="w-2 h-2" />
                                    Reply to {msg.replyTo.sender?.firstName || 'User'}
                                  </p>
                                  <p className="text-[9px] opacity-80 truncate">{msg.replyTo.content}</p>
                                </div>
                              )}
                              
                              {/* Display image if message type is IMAGE and has attachments - Minimal padding */}
                              {msg.type === 'IMAGE' && msg.attachments && msg.attachments.length > 0 && (
                                <img 
                                  src={msg.attachments[0]} 
                                  alt="Shared image" 
                                  className="max-w-[120px] sm:max-w-[140px] max-h-[120px] sm:max-h-[140px] rounded object-cover cursor-pointer block"
                                  onClick={() => window.open(msg.attachments[0], '_blank')}
                                />
                              )}
                              
                              {msg.content && <p className={`text-[11px] sm:text-xs break-words leading-[1.3] whitespace-pre-wrap ${msg.type === 'IMAGE' && msg.attachments?.length ? 'mt-0.5' : ''}`}>{msg.content}</p>}
                              
                              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                <span className="text-[8px] opacity-70">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isOwn && <IoCheckmarkDoneOutline className="w-2 h-2 opacity-70" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - WhatsApp Style */}
                <div className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 px-2 py-2 xs:px-3 xs:py-2.5 sm:px-4 sm:py-3 flex-shrink-0">
                  {/* Reply Preview - Compact */}
                  {replyingTo && (
                    <div className="mb-1.5 flex items-center gap-1.5 bg-slate-700/50 rounded-lg p-1.5 border-l-2 border-blue-500">
                      <IoArrowUndoOutline className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-blue-400 font-medium">Replying to {replyingTo.sender?.firstName || replyingTo.user?.firstName || 'User'}</p>
                        <p className="text-[10px] text-gray-300 truncate">{replyingTo.content}</p>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="p-0.5 hover:bg-slate-600 rounded transition-colors"
                      >
                        <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="mb-2 bg-slate-700 rounded-lg p-2 border border-slate-600">
                      <div className="grid grid-cols-10 gap-1">
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setMessageText(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-xl hover:bg-slate-600 rounded p-1 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {selectedImage && (
                    <div className="mb-2 relative inline-block">
                      <img 
                        src={URL.createObjectURL(selectedImage)} 
                        alt="Preview" 
                        className="max-h-20 rounded-lg"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 xs:gap-2">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 xs:p-2 hover:bg-slate-700 text-gray-400 hover:text-white rounded-full transition-colors flex-shrink-0"
                    >
                      <IoHappyOutline className="w-5 h-5 xs:w-6 xs:h-6" />
                    </button>
                    <label className="p-1.5 xs:p-2 hover:bg-slate-700 text-gray-400 hover:text-white rounded-full transition-colors flex-shrink-0 cursor-pointer">
                      <IoImageOutline className="w-5 h-5 xs:w-6 xs:h-6" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedImage(file);
                            showToast('Image selected', 'success');
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder={replyingTo ? "Reply..." : "Type a message"}
                      disabled={sending}
                      className="flex-1 min-w-0 px-3 xs:px-4 py-2 xs:py-2.5 border border-slate-600 rounded-full bg-slate-700 text-white text-sm xs:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={(!messageText.trim() && !selectedImage) || sending}
                      className="p-2 xs:p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <IoSendOutline className="w-5 h-5 xs:w-6 xs:h-6" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Menu Dropdown - Using Portal for proper z-index */}
      {showChatMenu && menuButtonRect && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[100000]" 
            onClick={() => setShowChatMenu(false)}
          ></div>
          <div 
            className="fixed w-48 border-2 border-slate-700 rounded-lg shadow-2xl overflow-hidden" 
            style={{
              backgroundColor: '#0f172a', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              zIndex: 100001,
              top: `${menuButtonRect.bottom + 4}px`,
              right: `${window.innerWidth - menuButtonRect.right}px`,
            }}
          >
            <button
              onClick={() => {
                setShowChatMenu(false);
                setShowReportModal(true);
              }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-slate-800 transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">Report User</span>
            </button>
            <button
              onClick={() => {
                setShowChatMenu(false);
                setShowBlockModal(true);
              }}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-3 border-t-2 border-slate-700"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="font-medium">Block User</span>
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Report User</h2>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setCustomReason('');
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <IoCloseOutline className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-300">Why are you reporting {getDisplayName(currentChat!)}?</p>
              
              <div className="space-y-2">
                {['Spam', 'Harassment', 'Inappropriate Content', 'Scam/Fraud', 'Other'].map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-white">{reason}</span>
                  </label>
                ))}
              </div>

              {reportReason === 'Other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe the issue..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                    setCustomReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!reportReason) {
                      showToast('Please select a reason', 'error');
                      return;
                    }
                    if (reportReason === 'Other' && !customReason.trim()) {
                      showToast('Please describe the issue', 'error');
                      return;
                    }
                    
                    try {
                      const token = localStorage.getItem('accessToken');
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          reportedUserId: getOtherUser(currentChat!)?.userId,
                          reason: reportReason === 'Other' ? customReason : reportReason,
                          type: 'USER',
                          chatId: currentChat?.id,
                        }),
                      });
                      
                      if (response.ok) {
                        showToast('Report submitted successfully', 'success');
                        setShowReportModal(false);
                        setReportReason('');
                        setCustomReason('');
                      } else {
                        showToast('Failed to submit report', 'error');
                      }
                    } catch (error) {
                      showToast('Error submitting report', 'error');
                    }
                  }}
                  disabled={!reportReason || (reportReason === 'Other' && !customReason.trim())}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Block User</h2>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setReportReason('');
                  setCustomReason('');
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <IoCloseOutline className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-300">Why are you blocking {getDisplayName(currentChat!)}?</p>
              
              <div className="space-y-2">
                {['Spam', 'Harassment', 'Unwanted Contact', 'Inappropriate Behavior', 'Other'].map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="blockReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="text-sm text-white">{reason}</span>
                  </label>
                ))}
              </div>

              {reportReason === 'Other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe why you're blocking this user..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                />
              )}

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">
                  ⚠️ Blocking will prevent this user from contacting you. This action can be undone in settings.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setReportReason('');
                    setCustomReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!reportReason) {
                      showToast('Please select a reason', 'error');
                      return;
                    }
                    if (reportReason === 'Other' && !customReason.trim()) {
                      showToast('Please describe the reason', 'error');
                      return;
                    }
                    
                    try {
                      const token = localStorage.getItem('accessToken');
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/block`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          blockedUserId: getOtherUser(currentChat!)?.userId,
                          reason: reportReason === 'Other' ? customReason : reportReason,
                        }),
                      });
                      
                      if (response.ok) {
                        showToast('User blocked successfully', 'success');
                        setShowBlockModal(false);
                        setReportReason('');
                        setCustomReason('');
                        setCurrentChat(null);
                        window.history.pushState({}, '', '/chat');
                      } else {
                        showToast('Failed to block user', 'error');
                      }
                    } catch (error) {
                      showToast('Error blocking user', 'error');
                    }
                  }}
                  disabled={!reportReason || (reportReason === 'Other' && !customReason.trim())}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
