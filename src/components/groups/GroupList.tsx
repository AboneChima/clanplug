'use client';

import { useState, useEffect } from 'react';
import { IoPeople, IoEnter } from 'react-icons/io5';
import { Group, groupService } from '@/services/group.service';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function GroupList() {
  const router = useRouter();
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchGroups();
    }
  }, [accessToken]);

  const getGroupImage = (groupName: string): string => {
    // Map group names to their corresponding images based on the provided image
    const imageMap: Record<string, string> = {
      'Call of Duty Mobile': '/codm.jpeg',
      'COD Mobile': '/codm.jpeg',
      'Free Fire': '/free fire.jpeg',
      'PUBG Mobile': '/pubg.jpeg',
      'Warzone Mobile': '/warzone mobile.jpeg',
      'eFootball': '/e football.jpeg',
      'FIFA Mobile': '/fifa.jpeg',
      'Delta Force': '/Delta Force on Steam.jpeg',
      'Farlight 84': '/farlight.jpeg',
      'Farlight': '/farlight.jpeg',
      'Blood Strike': '/blood strike.jpeg',
      'Critical Ops': '/critical ops.jpeg',
      'EA SPORTS FC': '/ea sport fc.jpeg',
      'EA Sports FC': '/ea sport fc.jpeg',
      'Fortnite': '/fortnite.jpeg',
      'General Gaming': '/game accessories.jpg',
    };

    // Try to find exact match first (case-sensitive)
    if (imageMap[groupName]) {
      return imageMap[groupName];
    }

    // Try case-insensitive match
    const lowerName = groupName.toLowerCase();
    for (const [key, value] of Object.entries(imageMap)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }

    // Try partial match
    const normalizedName = lowerName.replace(/[-\s]/g, '');
    for (const [key, value] of Object.entries(imageMap)) {
      const normalizedKey = key.toLowerCase().replace(/[-\s]/g, '');
      if (normalizedName === normalizedKey || 
          normalizedName.includes(normalizedKey) || 
          normalizedKey.includes(normalizedName)) {
        return value;
      }
    }

    // No match found - return empty string
    return '';
  };

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      // Add cache-busting timestamp to force fresh data
      const timestamp = Date.now();
      const data = await groupService.getUserGroups();
      console.log('📥 Groups response:', data, 'timestamp:', timestamp);
      // Ensure we always set an array, even if response is undefined/null
      if (Array.isArray(data)) {
        setGroups(data);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      // Don't show error toast - just show empty state
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking join button
    
    setJoiningGroupId(groupId);
    try {
      await groupService.joinGroup(groupId);
      showToast('Successfully joined group!', 'success');
      // Refresh groups to update membership status
      await fetchGroups();
    } catch (error: any) {
      console.error('Error joining group:', error);
      showToast(error.message || 'Failed to join group', 'error');
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleGroupClick = (group: Group) => {
    if (group.isMember) {
      router.push(`/chat?groupId=${group.id}`);
    } else {
      // Optionally show a message or auto-join
      showToast('Please join the group first', 'info');
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#262626] rounded-lg">
              <div className="w-12 h-12 bg-[#3f3f3f] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#3f3f3f] rounded w-3/4" />
                <div className="h-3 bg-[#3f3f3f] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Group List */}
        <div className="flex-1 overflow-y-auto pb-48">
          {groups.length === 0 ? (
            <div className="p-8 text-center">
              <IoPeople className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-2">No groups yet</p>
              <p className="text-gray-500 text-xs">Groups will appear here when admins create them</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {groups.map((group) => {
                const groupImage = getGroupImage(group.name);
                const avatarSrc = group.avatar || groupImage;
                
                return (
                  <button
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] active:bg-[#2a2a2a] transition-colors text-left"
                  >
                    {/* Group Avatar */}
                    <div className="relative flex-shrink-0">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={group.name}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <IoPeople className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {/* Unread Badge - only for joined groups */}
                      {group.isMember && group.unreadCount && group.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {group.unreadCount > 99 ? '99+' : group.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Group Info - WhatsApp Style */}
                    <div className="flex-1 min-w-0 border-b border-[#1a1a1a] pb-3">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <h3 className="font-medium text-[14px] text-white truncate">
                          {group.name}
                        </h3>
                        {/* Time - only for joined groups with messages */}
                        {group.isMember && group.lastMessageAt && (
                          <span className="text-[11px] text-gray-500 whitespace-nowrap flex-shrink-0">
                            {formatTime(group.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {group.lastMessage ? (
                          <p className="text-[13px] text-gray-400 truncate">
                            {group.lastMessage}
                          </p>
                        ) : group.isMember ? (
                          <p className="text-[13px] text-gray-500 italic">
                            No messages yet
                          </p>
                        ) : (
                          <p className="text-[13px] text-gray-400 flex items-center gap-1">
                            <IoPeople className="w-3 h-3" />
                            {group.memberCount} members
                          </p>
                        )}
                        
                        {/* Join Button - only for non-members */}
                        {!group.isMember && (
                          <button
                            onClick={(e) => handleJoinGroup(group.id, e)}
                            disabled={joiningGroupId === group.id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[12px] font-medium rounded transition-colors disabled:opacity-50 flex-shrink-0"
                          >
                            {joiningGroupId === group.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <IoEnter className="w-3 h-3" />
                                <span>Join</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
