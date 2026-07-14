"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoAddCircleOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { communityService, Community } from '@/services/community.service';
import { chatService, Chat } from '@/services/chat.service';

export default function MessagesPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [directChats, setDirectChats] = useState<Chat[]>([]);
  const [discoverCommunities, setDiscoverCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load communities and direct chats in parallel
      const [myCommunities, allChats, discover] = await Promise.all([
        communityService.getMyCommunities(),
        chatService.getChats(accessToken),
        communityService.getDiscoverCommunities(),
      ]);
      
      // Filter out GROUP chats from direct chats
      const onlyDirectChats = allChats.filter(chat => chat.type === 'DIRECT');
      
      setCommunities(myCommunities);
      setDirectChats(onlyDirectChats);
      setDiscoverCommunities(discover);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
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
    return 'User';
  };

  const formatTime = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (hours < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen bg-black">
        {/* Header */}
        <div className="bg-black px-4 py-3 flex-shrink-0 border-b border-[#2f3336] flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Messages</h1>
        </div>

        {/* Discover Communities - Horizontal Scroll */}
        <div className="bg-black px-4 py-3 border-b border-[#2f3336]">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Discover Communities</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {discoverCommunities.map((community) => (
              <button
                key={community.id}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
                onClick={() => router.push(`/communities/${community.id}`)}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-blue-500/50 group-hover:ring-blue-500 transition-all bg-[#2a2a2a] flex items-center justify-center">
                    {community.image ? (
                      <img 
                        src={community.image} 
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🎮</span>
                    )}
                  </div>
                  {community.isJoined && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center max-w-[70px]">
                  <p className="text-white text-[11px] font-medium leading-tight truncate">{community.name}</p>
                  <p className="text-gray-400 text-[10px]">
                    {community.isJoined ? 'Joined' : `${community.memberCount} members`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* My Communities Section */}
              {communities.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-2 bg-[#0a0a0a] border-y border-[#1a1a1a]">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      📌 My Communities
                    </h3>
                  </div>
                  {communities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => router.push(`/communities/${community.id}/chat`)}
                      className="w-full p-4 hover:bg-[#0a0a0a] transition-colors text-left flex items-center gap-3 border-b border-[#1a1a1a]"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {community.image ? (
                          <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🎮</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate">{community.name}</h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(community.lastMessage?.createdAt)}
                          </span>
                        </div>
                        {community.lastMessage && (
                          <p className="text-sm text-gray-400 truncate">
                            <span className="text-gray-500">{community.lastMessage.senderName}:</span> {community.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {community.unreadCount && community.unreadCount > 0 && (
                        <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {community.unreadCount > 99 ? '99+' : community.unreadCount}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Direct Messages Section */}
              {directChats.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-[#0a0a0a] border-y border-[#1a1a1a]">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      💬 Direct Messages
                    </h3>
                  </div>
                  {directChats.map((chat) => {
                    const other = getOtherUser(chat);
                    return (
                      <button
                        key={chat.id}
                        onClick={() => router.push(`/messages/direct/${chat.id}`)}
                        className="w-full p-4 hover:bg-[#0a0a0a] transition-colors text-left flex items-center gap-3 border-b border-[#1a1a1a]"
                      >
                        {other?.user?.avatar ? (
                          <img 
                            src={other.user.avatar} 
                            alt="" 
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold">{getDisplayName(chat).charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">{getDisplayName(chat)}</h3>
                              {other?.user && (other.user as any).verificationBadge?.status === 'verified' && (
                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(chat.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {(chat as any).messages?.[0]?.content || 'Start a conversation'}
                          </p>
                        </div>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {communities.length === 0 && directChats.length === 0 && (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 text-sm mb-4">No conversations yet</p>
                  <p className="text-gray-600 text-xs">Join a community or start a direct chat to begin</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
