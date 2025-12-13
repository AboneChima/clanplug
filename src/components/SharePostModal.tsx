'use client';

import React, { useState, useEffect } from 'react';
import {
  IoClose,
  IoShareSocialOutline,
  IoCopyOutline,
  IoCheckmarkCircle,
  IoSearchOutline,
  IoSendOutline,
  IoPeopleOutline,
} from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';

interface SharePostModalProps {
  postId: string;
  onClose: () => void;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

const SharePostModal: React.FC<SharePostModalProps> = ({ postId, onClose }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const shareUrl = `${window.location.origin}/post/${postId}`;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobica-backend.onrender.com';
      
      // First try to fetch friends (mutual follows)
      const friendsResponse = await fetch(`${API_URL}/api/follow/${user?.id}/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        console.log('Friends data:', friendsData);
        const friendsList = friendsData.data || [];
        
        if (friendsList.length > 0) {
          setUsers(friendsList);
          return;
        }
      }
      
      // If no friends, fetch following users as fallback
      const followingResponse = await fetch(`${API_URL}/api/follow/${user?.id}/following`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        console.log('Following data:', followingData);
        const followingList = followingData.data || [];
        setUsers(followingList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToUsers = async () => {
    if (selectedUsers.length === 0) return;

    setSending(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobica-backend.onrender.com';

      console.log('🚀 Sharing post to users:', selectedUsers);

      // Send post link to each selected user via chat
      for (const userId of selectedUsers) {
        console.log('📤 Sending to user:', userId);
        
        // Create or get existing chat first
        const chatResponse = await fetch(`${API_URL}/api/chats`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'DIRECT',
            participants: [userId],
          }),
        });

        const chatData = await chatResponse.json();
        console.log('📥 Chat Response:', chatResponse.status, chatData);

        if (!chatResponse.ok) {
          console.error('❌ Failed to create/get chat with user:', userId, chatData);
          continue;
        }

        const chatId = chatData.data?.id || chatData.id;
        
        if (!chatId) {
          console.error('❌ No chat ID returned for user:', userId);
          continue;
        }

        console.log('✅ Got chat ID:', chatId);

        // Now send the message with post link
        const messageResponse = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `📌 Shared a post with you\n\n${shareUrl}`,
            type: 'TEXT'
          }),
        });

        const messageResult = await messageResponse.json();
        console.log('📥 Message Response:', messageResponse.status, messageResult);

        if (!messageResponse.ok) {
          console.error('❌ Failed to send message to user:', userId, messageResult);
        } else {
          console.log('✅ Successfully sent to user:', userId);
        }
      }

      setSent(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('❌ Failed to share:', error);
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 max-[360px]:p-2 p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl max-[360px]:max-w-[95vw] max-w-sm sm:max-w-md w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-scale-in border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 max-[360px]:p-2.5 p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center max-[360px]:gap-1.5 gap-2 text-white">
            <IoShareSocialOutline className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="max-[360px]:text-sm text-base sm:text-lg font-bold">Share Post</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white transition-colors max-[360px]:p-1 p-1.5"
          >
            <IoClose className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {sent ? (
          <div className="max-[360px]:p-6 p-8 text-center">
            <IoCheckmarkCircle className="max-[360px]:w-12 max-[360px]:h-12 w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="max-[360px]:text-base text-lg font-semibold text-white">Sent!</p>
            <p className="max-[360px]:text-xs text-sm text-gray-400 mt-2">Post shared successfully</p>
          </div>
        ) : (
          <div className="max-[360px]:p-2.5 p-3 sm:p-4 max-[360px]:space-y-2.5 space-y-3 sm:space-y-4">
            {/* Copy Link */}
            <div>
              <label className="max-[360px]:text-xs text-sm font-medium text-gray-300 max-[360px]:mb-1.5 mb-2 block">
                Share Link
              </label>
              <div className="flex max-[360px]:gap-1.5 gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 max-[360px]:px-2 max-[360px]:py-1.5 max-[360px]:text-xs px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white"
                />
                <button
                  onClick={handleCopyLink}
                  className="max-[360px]:px-2 max-[360px]:py-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center max-[360px]:gap-1 gap-2"
                >
                  {copied ? (
                    <>
                      <IoCheckmarkCircle className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5" />
                      <span className="max-[360px]:text-xs text-sm max-[360px]:hidden">Copied!</span>
                    </>
                  ) : (
                    <>
                      <IoCopyOutline className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5" />
                      <span className="max-[360px]:text-xs text-sm max-[360px]:hidden">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-700 max-[360px]:my-2 my-3"></div>

            {/* Share to Users */}
            <div>
              <label className="max-[360px]:text-xs text-sm font-medium text-gray-300 max-[360px]:mb-1.5 mb-2 block">
                Send to Users
              </label>
              
              {/* Search */}
              <div className="relative max-[360px]:mb-2 mb-3">
                <IoSearchOutline className="absolute max-[360px]:left-2 left-3 top-1/2 -translate-y-1/2 max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-[360px]:pl-8 max-[360px]:pr-2 max-[360px]:py-1.5 max-[360px]:text-xs pl-10 pr-4 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* User List */}
              <div className="max-[360px]:max-h-48 max-h-56 sm:max-h-64 overflow-y-auto max-[360px]:space-y-1.5 space-y-2 max-[360px]:mb-2 mb-3 sm:mb-4">
                {users.length === 0 && !searchQuery ? (
                  <div className="text-center max-[360px]:py-6 py-8">
                    <IoPeopleOutline className="max-[360px]:w-10 max-[360px]:h-10 w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 max-[360px]:text-xs text-sm">No connections yet</p>
                    <p className="text-gray-500 max-[360px]:text-[10px] text-xs mt-1">Follow users to share posts</p>
                  </div>
                ) : filteredUsers.length === 0 && searchQuery ? (
                  <div className="text-center max-[360px]:py-6 py-8">
                    <IoSearchOutline className="max-[360px]:w-10 max-[360px]:h-10 w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 max-[360px]:text-xs text-sm">No users found</p>
                    <p className="text-gray-500 max-[360px]:text-[10px] text-xs mt-1">Try a different search</p>
                  </div>
                ) : (
                  filteredUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleUserSelection(u.id)}
                    className={`flex items-center max-[360px]:gap-2 gap-3 max-[360px]:p-1.5 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(u.id)
                        ? 'bg-blue-600/20 border-2 border-blue-500'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-2 border-transparent'
                    }`}
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.username}
                        className="max-[360px]:w-8 max-[360px]:h-8 w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="max-[360px]:w-8 max-[360px]:h-8 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white max-[360px]:text-xs text-sm font-bold">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold max-[360px]:text-xs text-sm text-white truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="max-[360px]:text-[10px] text-xs text-gray-400 truncate">@{u.username}</p>
                    </div>
                    {selectedUsers.includes(u.id) && (
                      <IoCheckmarkCircle className="max-[360px]:w-5 max-[360px]:h-5 w-6 h-6 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  ))
                )}
              </div>

              {/* Send Button */}
              {selectedUsers.length > 0 && (
                <button
                  onClick={handleShareToUsers}
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white max-[360px]:py-2 max-[360px]:text-xs py-2.5 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center max-[360px]:gap-1.5 gap-2 disabled:opacity-50"
                >
                  <IoSendOutline className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5" />
                  {sending ? 'Sending...' : `Send to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePostModal;
