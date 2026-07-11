"use client";

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  IoSendOutline, 
  IoArrowBackOutline,
  IoCheckmarkDoneOutline,
  IoEllipsisVerticalOutline,
  IoImageOutline,
  IoCloseOutline,
  IoAlertCircleOutline,
  IoHappyOutline,
  IoShareOutline,
  IoArrowForwardOutline,
  IoTrashOutline
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
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set());
  const [messageReactions, setMessageReactions] = useState<{[key: string]: string}>({});
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😭', '💯', '🙏', '👏', '✨', '💪', '🎮', '🎯', '🚀', '⭐', '💰', '🎁'];

  // Setup real-time chat connection
  useEffect(() => {
    if (currentChat && accessToken) {
      console.log('🔌 Connecting to real-time chat for chat:', currentChat.id);
      chatService.connectRealtime(accessToken);
      
      const unsubscribeMessage = chatService.onMessage((newMessage) => {
        console.log('📨 New message received via SSE:', newMessage);
        if (newMessage.chatId === currentChat.id) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              console.log('⚠️ Duplicate message, skipping:', newMessage.id);
              return prev;
            }
            console.log('✅ Adding new message to chat');
            return [...prev, newMessage];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          console.log('⚠️ Message for different chat, ignoring');
        }
      });

      const unsubscribeConnection = chatService.onConnectionChange((connected) => {
        console.log('🔌 Chat connection status:', connected ? 'CONNECTED' : 'DISCONNECTED');
        setIsConnected(connected);
      });

      return () => {
        console.log('🔌 Cleaning up chat connection');
        unsubscribeMessage();
        unsubscribeConnection();
        chatService.disconnectRealtime();
      };
    }
  }, [currentChat?.id, accessToken]);

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, msg: ChatMessage) => {
    // Prevent default context menu on long press
    e.preventDefault();
    
    const timer = setTimeout(() => {
      // Haptic feedback (vibration) - WhatsApp uses 50ms
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setSelectedMessage(msg);
      setShowMessageMenu(true);
      setLongPressTimer(null); // Clear timer reference after triggering
    }, 500); // WhatsApp standard is 500ms
    
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    // Clear timer if menu hasn't been triggered yet
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger (scrolling)
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const canDeleteForEveryone = (msg: ChatMessage): boolean => {
    if (msg.userId !== user?.id) return false;
    const messageTime = new Date(msg.createdAt).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return (now - messageTime) <= oneHour;
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage) return;
    try {
      // Just hide it locally - store in localStorage for persistence
      const hiddenMessages = JSON.parse(localStorage.getItem('hiddenMessages') || '{}');
      hiddenMessages[selectedMessage.id] = true;
      localStorage.setItem('hiddenMessages', JSON.stringify(hiddenMessages));
      
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      showToast('Message deleted', 'success');
      setShowMessageMenu(false);
      setSelectedMessage(null);
    } catch (error) {
      showToast('Failed to delete message', 'error');
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage || !currentChat) return;
    
    if (!canDeleteForEveryone(selectedMessage)) {
      showToast('You can only delete messages within 1 hour', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${currentChat.id}/messages/${selectedMessage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      setMessages(prev => prev.map(m => 
        m.id === selectedMessage.id 
          ? { ...m, isDeleted: true, content: 'This message was deleted' }
          : m
      ));
      showToast('Message deleted for everyone', 'success');
      setShowMessageMenu(false);
      setSelectedMessage(null);
    } catch (error) {
      showToast('Failed to delete message', 'error');
    }
  };

  const handleForwardMessage = () => {
    if (!selectedMessage) return;
    // TODO: Implement forward to another chat
    showToast('Forward feature coming soon', 'info');
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const handleShareMessage = async () => {
    if (!selectedMessage) return;
    try {
      if (navigator.share) {
        await navigator.share({
          text: selectedMessage.content,
        });
      } else {
        await navigator.clipboard.writeText(selectedMessage.content);
        showToast('Message copied to clipboard', 'success');
      }
      setShowMessageMenu(false);
      setSelectedMessage(null);
    } catch (error) {
      showToast('Failed to share message', 'error');
    }
  };

  const handleReplyToMessage = () => {
    if (!selectedMessage) return;
    setReplyToMessage(selectedMessage);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const handleReactWithEmoji = (emoji: string) => {
    if (!selectedMessage) return;
    // Toggle emoji reaction - if same emoji, remove it
    setMessageReactions(prev => {
      const current = prev[selectedMessage.id];
      if (current === emoji) {
        // Remove reaction
        const newReactions = { ...prev };
        delete newReactions[selectedMessage.id];
        return newReactions;
      } else {
        // Add or replace reaction
        return {
          ...prev,
          [selectedMessage.id]: emoji
        };
      }
    });
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const handleRemoveReaction = (msgId: string) => {
    setMessageReactions(prev => {
      const newReactions = { ...prev };
      delete newReactions[msgId];
      return newReactions;
    });
  };

  const handlePinMessage = () => {
    if (!selectedMessage) return;
    const newPinned = new Set(pinnedMessages);
    if (newPinned.has(selectedMessage.id)) {
      newPinned.delete(selectedMessage.id);
    } else {
      newPinned.add(selectedMessage.id);
    }
    setPinnedMessages(newPinned);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const handleStarMessage = () => {
    if (!selectedMessage) return;
    const newStarred = new Set(starredMessages);
    if (newStarred.has(selectedMessage.id)) {
      newStarred.delete(selectedMessage.id);
    } else {
      newStarred.add(selectedMessage.id);
    }
    setStarredMessages(newStarred);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const handleShowMessageInfo = () => {
    setShowMessageMenu(false);
    setShowMessageInfo(true);
  };

  const handleShowForwardModal = () => {
    setShowMessageMenu(false);
    setShowForwardModal(true);
  };

  const handleForwardToChat = async (chatId: string) => {
    if (!selectedMessage) return;
    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('🔄 Forwarding message:', selectedMessage);
      console.log('📤 To chat:', chatId);
      
      const messageData: any = {
        content: selectedMessage.content || '',
        type: selectedMessage.type,
      };
      
      if (selectedMessage.attachments && selectedMessage.attachments.length > 0) {
        messageData.attachments = selectedMessage.attachments;
        console.log('📎 With attachments:', messageData.attachments);
      }
      
      console.log('📨 Sending message data:', messageData);
      
      const result = await chatService.sendMessage(chatId, messageData, token!);
      
      console.log('✅ Forward result:', result);
      
      showToast('Message forwarded successfully', 'success');
      setShowForwardModal(false);
      setSelectedMessage(null);
      
      // Reload messages if forwarding to current chat
      if (chatId === currentChat?.id) {
        await loadMessages(chatId);
      }
    } catch (error: any) {
      console.error('❌ Forward error:', error);
      showToast(error.message || 'Failed to forward message', 'error');
    }
  };

  // Load chats on mount
  useEffect(() => {
    if (accessToken) {
      loadChats();
    }
  }, [accessToken]);

  // Open specific chat from URL
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setCurrentChat(chat);
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
      const sortedChats = data.sort((a: Chat, b: Chat) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
      setChats(sortedChats);
    } catch (error) {
      console.error('Load chats error:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const msgs = await chatService.getMessages(chatId, accessToken);
      
      // Filter out messages that are deleted or hidden locally
      const hiddenMessages = JSON.parse(localStorage.getItem('hiddenMessages') || '{}');
      const filteredMsgs = msgs.filter(m => !m.isDeleted && !hiddenMessages[m.id]);
      
      setMessages(filteredMsgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      markChatAsRead(chatId);
    } catch (error) {
      console.error('Load messages error:', error);
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
      
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
        )
      );
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !imageFile) || !currentChat || !accessToken || sending) return;
    
    setSending(true);
    
    try {
      let imageUrl = '';
      
      // Upload image if present
      if (imageFile) {
        console.log('📤 Uploading image...', imageFile.name);
        const formData = new FormData();
        formData.append('media', imageFile);
        
        const token = localStorage.getItem('accessToken');
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          // Handle data.data.urls array format
          if (data.data?.urls && data.data.urls.length > 0) {
            imageUrl = data.data.urls[0];
          } else if (data.data?.url) {
            imageUrl = data.data.url;
          } else if (data.url) {
            imageUrl = data.url;
          }
          
          console.log('✅ Image uploaded successfully:', imageUrl);
          console.log('📦 Full upload response:', data);
          
          if (!imageUrl) {
            console.error('❌ Upload response missing URL:', data);
            showToast('Failed to get image URL', 'error');
            setSending(false);
            return;
          }
        } else {
          const errorText = await uploadRes.text();
          console.error('❌ Upload failed:', errorText);
          showToast('Failed to upload image', 'error');
          setSending(false);
          return;
        }
      }
      
      const content = messageText.trim() || (imageUrl ? 'Image' : '');
      
      if (!content && !imageUrl) {
        showToast('Please enter a message or select an image', 'error');
        setSending(false);
        return;
      }
      
      const messageData: any = { 
        content, 
        type: imageUrl ? 'IMAGE' : 'TEXT'
      };
      
      if (imageUrl) {
        messageData.attachments = [imageUrl];
        console.log('📨 Sending message with image:', { ...messageData, imageUrl });
      }

      // Add reply reference if replying
      if (replyToMessage) {
        messageData.replyTo = replyToMessage.id;
      }
      
      setMessageText('');
      setImageFile(null);
      setImagePreview('');
      setReplyToMessage(null); // Clear reply after sending
      
      console.log('📤 Final message payload:', JSON.stringify(messageData, null, 2));
      const newMsg = await chatService.sendMessage(currentChat.id, messageData, accessToken);
      console.log('✅ Message sent successfully:', newMsg);
      
      setMessages(prev => [...prev, newMsg]);
      
      setChats(prevChats => {
        const updatedChat = { ...currentChat, lastMessageAt: newMsg.createdAt };
        const otherChats = prevChats.filter(c => c.id !== currentChat.id);
        return [updatedChat, ...otherChats];
      });
      
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error: any) {
      console.error('❌ Send error:', error);
      showToast(error.message || 'Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReport = async () => {
    const finalReason = selectedReportReason === 'Other' ? reportReason : selectedReportReason;
    
    if (!finalReason.trim()) {
      showToast('Please select or provide a reason', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      const otherUser = getOtherUser(currentChat!);
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${otherUser?.user?.id}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: finalReason })
      });
      
      showToast('User reported successfully', 'success');
      setShowReportModal(false);
      setReportReason('');
      setSelectedReportReason('');
      setShowMenu(false);
    } catch (error) {
      showToast('Failed to report user', 'error');
    }
  };

  const handleBlock = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const otherUser = getOtherUser(currentChat!);
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${otherUser?.user?.id}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      showToast('User blocked successfully', 'success');
      setShowBlockConfirm(false);
      setShowMenu(false);
      setCurrentChat(null);
      window.history.replaceState({}, '', '/chat');
    } catch (error) {
      showToast('Failed to block user', 'error');
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
    if (hours < 24) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats;

  const isInConversation = !!currentChat;
  
  return (
    <AppShell hideNavOnMobile={isInConversation} hideBottomNavOnMobile={isInConversation}>
      <div className={`fixed inset-0 flex flex-col bg-black ${isInConversation ? 'top-0' : 'top-14'} bottom-0 lg:top-14`}>
        
        {/* Chat List */}
        {!currentChat && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-black px-4 py-3 flex-shrink-0 border-b border-[#2f3336]">
              <h1 className="text-xl font-bold text-white">Messages</h1>
            </div>

            {/* Game Communities Section */}
            <div className="bg-black px-4 py-3 border-b border-[#2f3336]">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Game Communities</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { name: 'Free Fire', image: '/free fire.jpeg', members: '1.2K' },
                  { name: 'Call of Duty', image: '/codm.jpeg', members: '980' },
                  { name: 'PUBG Mobile', image: '/pubg.jpeg', members: '856' },
                  { name: 'FIFA Mobile', image: '/fifa.jpeg', members: '645' }
                ].map((group) => (
                  <button
                    key={group.name}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                    onClick={() => showToast('Coming soon!', 'info')}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-blue-500/50 group-hover:ring-blue-500 transition-all">
                        <img 
                          src={group.image} 
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-black"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-white text-[10px] font-medium leading-tight">{group.name}</p>
                      <p className="text-gray-500 text-[9px]">{group.members} members</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setCurrentChat(chat);
                      window.history.pushState({}, '', `/chat?id=${chat.id}`);
                    }}
                    className="w-full p-4 hover:bg-[#0a0a0a] transition-colors text-left flex items-center gap-3 border-b border-[#1a1a1a]"
                  >
                    {getAvatar(chat) ? (
                      <img src={getAvatar(chat)!} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold">{getDisplayName(chat).charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{getDisplayName(chat)}</h3>
                          {((getOtherUser(chat)?.user as any)?.verificationBadge?.status === 'verified' || (getOtherUser(chat)?.user as any)?.verificationBadge?.status === 'active') && (
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(getLastMessage(chat)?.createdAt || chat.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-400 truncate flex-1 flex items-center gap-1">
                          {(() => {
                            const lastMsg = getLastMessage(chat);
                            if (!lastMsg) return 'Start a conversation';
                            if (lastMsg.type === 'IMAGE' && lastMsg.attachments?.length && (!lastMsg.content || !lastMsg.content.trim())) {
                              return (
                                <>
                                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>Image</span>
                                </>
                              );
                            }
                            return lastMsg.content || (
                              <>
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Image</span>
                              </>
                            );
                          })()}
                        </p>
                        {(chat.unreadCount ?? 0) > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-2 flex-shrink-0">
                            {(chat.unreadCount ?? 0) > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Conversation */}
        {currentChat && (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="bg-black px-4 py-3 flex items-center gap-3 flex-shrink-0 border-b border-[#2f3336] relative">
              <button
                onClick={() => {
                  setCurrentChat(null);
                  window.history.replaceState({}, '', '/chat');
                }}
                className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
              >
                <IoArrowBackOutline className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() => {
                  const otherUser = getOtherUser(currentChat);
                  if (otherUser?.user?.id) {
                    window.location.href = `/user/${otherUser.user.id}`;
                  }
                }}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                {getAvatar(currentChat) ? (
                  <img src={getAvatar(currentChat)!} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">{getDisplayName(currentChat).charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <h2 className="font-semibold text-white truncate">{getDisplayName(currentChat)}</h2>
                    {((getOtherUser(currentChat)?.user as any)?.verificationBadge?.status === 'verified' || (getOtherUser(currentChat)?.user as any)?.verificationBadge?.status === 'active') && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">
                      {isConnected ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                          Offline
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
              
              {/* Menu Button */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
              >
                <IoEllipsisVerticalOutline className="w-6 h-6 text-white" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute top-full right-4 mt-1 bg-[#1a1a1a] border border-[#2f3336] rounded-xl shadow-xl z-50 min-w-[160px]">
                  <button
                    onClick={() => {
                      setShowReportModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 border-b border-[#2f3336]"
                  >
                    <IoAlertCircleOutline className="w-4 h-4" />
                    Report User
                  </button>
                  <button
                    onClick={() => setShowBlockConfirm(true)}
                    className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                  >
                    <IoCloseOutline className="w-4 h-4" />
                    Block User
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black">
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500">No messages yet. Say hi! 👋</p>
                </div>
              ) : (
                <>
                  {/* Pinned Messages Section */}
                  {Array.from(pinnedMessages).length > 0 && (
                    <div className="sticky top-0 z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-400">Pinned Messages</span>
                        </div>
                        <button
                          onClick={() => setPinnedMessages(new Set())}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Clear All
                        </button>
                      </div>
                      {messages.filter(m => pinnedMessages.has(m.id)).map((msg) => {
                        const isOwn = msg.userId === user?.id;
                        return (
                          <div key={msg.id} className="mb-2 last:mb-0">
                            <div className={`text-xs p-2 rounded ${isOwn ? 'bg-blue-600/20' : 'bg-[#2a2a2a]'}`}>
                              <p className="text-white line-clamp-2">{msg.content || '📷 Photo'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Regular Messages */}
                  {messages.filter(m => !m.isDeleted).map((msg) => {
                  const isOwn = msg.userId === user?.id;
                  const hasImage = msg.type === 'IMAGE' && msg.attachments && msg.attachments.length > 0;
                  const isListingShare = (msg as any).metadata?.type === 'LISTING_SHARE';
                  
                  console.log('🔍 Rendering message:', { 
                    id: msg.id, 
                    type: msg.type, 
                    hasImage,
                    hasAttachments: !!msg.attachments, 
                    attachmentsLength: msg.attachments?.length,
                    attachments: msg.attachments,
                    firstAttachment: msg.attachments?.[0],
                    content: msg.content?.substring(0, 30),
                    isListingShare
                  });
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      onTouchStart={(e) => handleLongPressStart(e, msg)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchMove={handleTouchMove}
                      onMouseDown={(e) => handleLongPressStart(e, msg)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleTouchMove}
                      onContextMenu={(e) => e.preventDefault()} 
                    >
                      <div className="relative max-w-[75%]">
                        <div className={`${
                          isListingShare ? '' : 'rounded-2xl'
                        } ${
                          isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#2a2a2a] text-white rounded-bl-sm'
                        } ${hasImage && !isListingShare ? 'p-0 overflow-hidden' : isListingShare ? '' : isOwn ? 'px-2 py-1.5' : 'pl-2.5 pr-2 py-1.5'}`}>
                        
                        {/* Listing Share - Compact YouTube-style Thumbnail */}
                        
                        {/* Listing Share - Compact YouTube-style Thumbnail */}
                        {isListingShare && (msg as any).metadata && (
                          <a 
                            href={`/marketplace/${(msg as any).metadata.listingId}`}
                            className="block hover:opacity-90 transition-opacity max-w-[280px]"
                          >
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
                              {/* Thumbnail - 16:9 ratio like YouTube */}
                              {(msg as any).metadata.listingImage && (
                                <div className="relative w-full aspect-video bg-black">
                                  <img 
                                    src={(msg as any).metadata.listingImage} 
                                    alt={(msg as any).metadata.listingTitle}
                                    className="w-full h-full object-cover"
                                    onLoad={() => console.log('✅ Listing image loaded')}
                                    onError={(e) => {
                                      console.error('❌ Listing image failed');
                                      // Hide broken image and show placeholder
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent && !parent.querySelector('.listing-image-fallback')) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'listing-image-fallback absolute inset-0 flex items-center justify-center bg-[#0a0a0a]';
                                        fallback.innerHTML = `
                                          <div class="text-center p-4">
                                            <svg class="w-12 h-12 mx-auto text-gray-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                            </svg>
                                            <p class="text-gray-500 text-xs">Image unavailable</p>
                                          </div>
                                        `;
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              )}
                              {/* Info - Compact */}
                              <div className="p-2">
                                <p className="text-white font-medium text-xs mb-1 line-clamp-2 leading-tight">
                                  {(msg as any).metadata.listingTitle}
                                </p>
                                <p className="text-green-400 font-bold text-sm">
                                  {(msg as any).metadata.listingCurrency} {(msg as any).metadata.listingPrice?.toLocaleString()}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-blue-400 text-[10px]">
                                  <span>View Listing</span>
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className={`flex items-center justify-end gap-1 px-2 py-1 ${isOwn ? 'bg-blue-600' : 'bg-[#2a2a2a]'} rounded-b-lg`}>
                              <span className="text-[10px] opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && (
                                <IoCheckmarkDoneOutline className="w-3 h-3 opacity-70" />
                              )}
                            </div>
                          </a>
                        )}
                        
                        {/* Regular Image Message - WhatsApp/Telegram style with timestamp overlay */}
                        {!isListingShare && hasImage && (
                          <div className="relative w-full">
                            <img 
                              src={msg.attachments![0]} 
                              alt="Image" 
                              className="w-full max-h-[300px] object-cover block" 
                              onLoad={() => console.log('✅ Image loaded:', msg.attachments![0])}
                              onError={(e) => {
                                console.error('❌ Image failed to load:', msg.attachments![0]);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.image-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'image-fallback bg-[#2a2a2a] rounded-xl p-4 text-center';
                                  fallback.innerHTML = `
                                    <svg class="w-12 h-12 mx-auto text-gray-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                    </svg>
                                    <p class="text-gray-500 text-xs">Image no longer available</p>
                                  `;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                            {/* Timestamp overlay on image - only if there's no text below */}
                            {(!msg.content || msg.content === 'Image') && (
                              <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 rounded backdrop-blur-sm">
                                <span className="text-[10px] text-white/90">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isOwn && (
                                  <IoCheckmarkDoneOutline className="w-3 h-3 text-white/90" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Regular Text Message - WhatsApp style with inline or below timestamp */}
                        {!isListingShare && (
                          <>
                            {msg.content && msg.content !== 'Image' && (
                              <div className={`flex flex-wrap items-end leading-[1.3] ${hasImage ? 'px-2.5 pt-1.5 pb-1 gap-0.5' : 'gap-1.5 pb-1.5'}`}>
                                {/* Text content */}
                                <span className="text-[13px] break-words whitespace-pre-wrap flex-1 min-w-0">
                                  {msg.content}
                                </span>
                                {/* Timestamp - stays on same line if space, drops below if needed */}
                                <span className={`flex items-center gap-0.5 flex-shrink-0 self-end ${isOwn && !hasImage ? 'mr-1' : ''}`}>
                                  <span className="text-[10px] opacity-50 whitespace-nowrap">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isOwn && (
                                    <IoCheckmarkDoneOutline className="w-3 h-3 opacity-50" />
                                  )}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        </div>
                        
                        {/* Emoji Reaction - Bottom right corner of bubble */}
                        {messageReactions[msg.id] && (
                          <button
                            onClick={() => handleRemoveReaction(msg.id)}
                            className={`absolute -bottom-2 ${isOwn ? 'right-0' : 'left-0'} bg-white border border-gray-300 rounded-full px-1.5 py-0.5 shadow-md hover:scale-110 transition-transform`}
                          >
                            <span className="text-sm">{messageReactions[msg.id]}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-black px-4 py-3 flex-shrink-0 border-t border-[#2f3336]">
              {/* Reply Preview */}
              {replyToMessage && (
                <div className="mb-2 p-3 bg-[#1a1a1a] border-l-4 border-blue-600 rounded-lg flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Replying to</p>
                    <p className="text-sm text-white truncate">
                      {replyToMessage.content || '📷 Photo'}
                    </p>
                  </div>
                  <button
                    onClick={cancelReply}
                    className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <IoCloseOutline className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="rounded-lg w-24 h-24 object-cover" />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full"
                  >
                    <IoCloseOutline className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mb-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                  <div className="grid grid-cols-10 gap-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMessageText(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-2xl hover:bg-[#2a2a2a] rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {/* Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  <IoImageOutline className="w-5 h-5" />
                </button>
                
                {/* Emoji Picker Toggle */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={sending}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  <IoHappyOutline className="w-5 h-5" />
                </button>
                
                <textarea
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message"
                  disabled={sending}
                  rows={1}
                  className="flex-1 min-w-0 px-3 py-2 border border-[#2a2a2a] rounded-full bg-[#2a2a2a] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50 resize-none overflow-y-auto max-h-[100px]"
                  style={{ minHeight: '36px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={(!messageText.trim() && !imageFile) || sending}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <IoSendOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Report Modal */}
            {showReportModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2f3336]">
                  <div className="p-4 border-b border-[#2f3336]">
                    <h3 className="text-lg font-bold text-white">Report {getDisplayName(currentChat!)}</h3>
                    <p className="text-xs text-gray-400 mt-1">Why are you reporting this user?</p>
                  </div>
                  <div className="p-2">
                    {['Scam/Fraud', 'Spam', 'Harassment', 'Fake Account', 'Inappropriate Content', 'Other'].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => {
                          setSelectedReportReason(reason);
                          if (reason !== 'Other') {
                            setReportReason('');
                          }
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-[#2f3336] last:border-b-0 ${
                          selectedReportReason === reason
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-white hover:bg-[#2a2a2a]'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                    
                    {selectedReportReason === 'Other' && (
                      <div className="p-4">
                        <textarea
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          placeholder="Please describe the issue..."
                          rows={3}
                          className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-[#2f3336] flex gap-2">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setReportReason('');
                        setSelectedReportReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReport}
                      disabled={!selectedReportReason || (selectedReportReason === 'Other' && !reportReason.trim())}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                    >
                      Report
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Block Confirmation Modal */}
            {showBlockConfirm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-sm border border-[#2f3336]">
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                      <IoCloseOutline className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Block {getDisplayName(currentChat!)}?</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      You won't be able to receive messages or calls from this user.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowBlockConfirm(false)}
                        className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBlock}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Block
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message Actions Menu - Exact WhatsApp iOS Style */}
            {showMessageMenu && selectedMessage && (
              <div 
                className="fixed inset-0 z-50"
                onClick={() => setShowMessageMenu(false)}
                style={{
                  animation: 'fadeIn 0.25s ease-out forwards'
                }}
              >
                {/* Backdrop with blur */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                />
                
                {/* Message preview at original position */}
                <div className="absolute inset-x-4 top-1/4 pointer-events-none z-10">
                  <div 
                    className={`max-w-[85%] ${selectedMessage.userId === user?.id ? 'ml-auto' : 'mr-auto'}`}
                    style={{
                      animation: 'messagePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                    }}
                  >
                    <div className={`rounded-lg shadow-2xl ${
                      selectedMessage.userId === user?.id 
                        ? 'bg-[#056162]' 
                        : 'bg-[#1f2c34]'
                    } p-3`}>
                      <p className="text-white text-sm break-words">
                        {selectedMessage.content || '📷 Photo'}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[11px] text-gray-300">
                          {new Date(selectedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emoji Reactions Bar */}
                <div 
                  className="absolute top-[38%] left-1/2 transform -translate-x-1/2 z-20"
                  style={{
                    animation: 'emojiBarSlide 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards',
                    opacity: 0
                  }}
                >
                  <div className="bg-[#233138] rounded-full px-2 py-2.5 flex items-center gap-1 shadow-2xl">
                    {['👍', '❤️', '😂', '😮', '😢', '🙏', '🙌'].map((emoji, idx) => (
                      <button
                        key={emoji}
                        onClick={() => handleReactWithEmoji(emoji)}
                        className="w-10 h-10 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                        style={{
                          animation: `emojiPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.15 + idx * 0.03}s forwards`,
                          opacity: 0,
                          transform: 'scale(0)'
                        }}
                      >
                        <span className="text-2xl">{emoji}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowMessageMenu(false)}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:scale-110 active:scale-95 transition-transform"
                      style={{
                        animation: 'emojiPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.36s forwards',
                        opacity: 0,
                        transform: 'scale(0)'
                      }}
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  </div>
                </div>

                {/* Action Menu - Reduced width like WhatsApp */}
                <div 
                  className="absolute left-4 right-4 top-[48%] z-20"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    animation: 'menuSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards',
                    opacity: 0,
                    transform: 'translateY(30px)'
                  }}
                >
                  <div className="bg-[#233138] rounded-2xl overflow-hidden shadow-2xl max-w-xs mx-auto">
                    {/* Reply */}
                    <button
                      onClick={handleReplyToMessage}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between border-b border-white/5"
                    >
                      <span className="text-white text-sm">Reply</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>

                    {/* Forward */}
                    <button
                      onClick={handleShowForwardModal}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between border-b border-white/5"
                    >
                      <span className="text-white text-sm">Forward</span>
                      <IoArrowForwardOutline className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Info */}
                    <button
                      onClick={handleShowMessageInfo}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between border-b border-white/5"
                    >
                      <span className="text-white text-sm">Info</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    {/* Star */}
                    <button
                      onClick={handleStarMessage}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between border-b border-white/5"
                    >
                      <span className="text-white text-sm">
                        {selectedMessage && starredMessages.has(selectedMessage.id) ? 'Unstar' : 'Star'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill={selectedMessage && starredMessages.has(selectedMessage.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>

                    {/* Pin */}
                    <button
                      onClick={handlePinMessage}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between border-b border-white/5"
                    >
                      <span className="text-white text-sm">
                        {selectedMessage && pinnedMessages.has(selectedMessage.id) ? 'Unpin' : 'Pin'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill={selectedMessage && pinnedMessages.has(selectedMessage.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        handleDeleteForMe();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between"
                    >
                      <span className="text-[#ff3b30] text-sm">Delete</span>
                      <IoTrashOutline className="w-4 h-4 text-[#ff3b30]" />
                    </button>
                  </div>
                </div>

                {/* CSS Animations */}
                <style jsx>{`
                  @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  
                  @keyframes messagePop {
                    0% {
                      opacity: 0.5;
                      transform: scale(0.95);
                    }
                    60% {
                      transform: scale(1.02);
                    }
                    100% {
                      opacity: 1;
                      transform: scale(1);
                    }
                  }
                  
                  @keyframes emojiBarSlide {
                    0% {
                      opacity: 0;
                      transform: translateX(-50%) translateY(20px);
                    }
                    100% {
                      opacity: 1;
                      transform: translateX(-50%) translateY(0);
                    }
                  }
                  
                  @keyframes emojiPop {
                    0% {
                      opacity: 0;
                      transform: scale(0);
                    }
                    60% {
                      transform: scale(1.1);
                    }
                    100% {
                      opacity: 1;
                      transform: scale(1);
                    }
                  }
                  
                  @keyframes menuSlideUp {
                    0% {
                      opacity: 0;
                      transform: translateY(30px);
                    }
                    100% {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>
            )}

            {/* Message Info Modal */}
            {showMessageInfo && selectedMessage && (
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowMessageInfo(false)}
              >
                <div 
                  className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2f3336]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-[#2f3336] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Message Info</h3>
                    <button
                      onClick={() => setShowMessageInfo(false)}
                      className="p-1 hover:bg-[#2a2a2a] rounded-full transition-colors"
                    >
                      <IoCloseOutline className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Message</p>
                      <div className="bg-[#2a2a2a] rounded-lg p-3">
                        <p className="text-white text-sm">{selectedMessage.content || '📷 Photo'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Sent</p>
                        <p className="text-white text-sm">
                          {new Date(selectedMessage.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <div className="flex items-center gap-1">
                          <IoCheckmarkDoneOutline className="w-4 h-4 text-blue-400" />
                          <p className="text-white text-sm">Delivered</p>
                        </div>
                      </div>
                    </div>
                    {starredMessages.has(selectedMessage.id) && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-sm">Starred</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Forward Modal */}
            {showForwardModal && selectedMessage && (
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowForwardModal(false)}
              >
                <div 
                  className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2f3336] max-h-[80vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-[#2f3336] flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Forward to...</h3>
                    <button
                      onClick={() => setShowForwardModal(false)}
                      className="p-1 hover:bg-[#2a2a2a] rounded-full transition-colors"
                    >
                      <IoCloseOutline className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {chats.filter(c => c.id !== currentChat?.id).map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleForwardToChat(chat.id)}
                        className="w-full p-4 hover:bg-[#2a2a2a] transition-colors text-left flex items-center gap-3 border-b border-[#2f3336]"
                      >
                        {getAvatar(chat) ? (
                          <img src={getAvatar(chat)!} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold">{getDisplayName(chat).charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{getDisplayName(chat)}</h3>
                          <p className="text-xs text-gray-400">Tap to forward</p>
                        </div>
                      </button>
                    ))}
                    {chats.filter(c => c.id !== currentChat?.id).length === 0 && (
                      <div className="text-center py-16 px-4">
                        <p className="text-gray-500 text-sm">No other chats available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
