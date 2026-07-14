'use client';

import React, { useEffect, useState } from 'react';
import { IoCloseOutline, IoPeople, IoCheckmarkCircle } from 'react-icons/io5';
import { groupService, Group } from '@/services/group.service';
import { useToast } from '@/contexts/ToastContext';

interface GroupDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupJoined: () => void;
  accessToken: string | null;
}

export default function GroupDiscoveryModal({ isOpen, onClose, onGroupJoined, accessToken }: GroupDiscoveryModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && accessToken) {
      loadGroups();
    }
  }, [isOpen, accessToken]);

  const loadGroups = async () => {
    if (!accessToken) {
      console.error('❌ No access token available for loading groups');
      showToast('Please log in to see groups', 'error');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📋 Loading groups with token:', accessToken.substring(0, 20) + '...');
      const data = await groupService.getGroups(accessToken);
      console.log('✅ Groups loaded:', data);
      setGroups(data);
    } catch (error: any) {
      console.error('❌ Failed to load groups:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showToast('Session expired. Please log in again.', 'error');
      } else {
        showToast(error.message || 'Failed to load groups', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (chatId: string) => {
    if (!accessToken) return;
    try {
      setJoiningGroup(chatId);
      await groupService.joinGroup(chatId, accessToken);
      showToast('Joined group successfully!', 'success');
      
      // Close modal and trigger chat list reload
      onClose(); // Close modal first
      onGroupJoined(); // Then refresh chat list
    } catch (error: any) {
      showToast(error.message || 'Failed to join group', 'error');
    } finally {
      setJoiningGroup(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0a0a0a] w-full sm:max-w-lg sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-b-3xl border border-[#2f3336]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2f3336]">
          <h2 className="text-xl font-bold text-white">Join a Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
          >
            <IoCloseOutline className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <IoPeople className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No groups available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2f3336]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg mb-1">{group.name}</h3>
                      {group.description && (
                        <p className="text-gray-400 text-sm mb-2">{group.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <IoPeople className="w-4 h-4" />
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        {group.lastMessage && (
                          <span className="truncate">
                            Last: {new Date(group.lastMessage.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-3 flex-shrink-0">
                      {group.isJoined ? (
                        <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg">
                          <IoCheckmarkCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Joined</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={joiningGroup === group.id}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {joiningGroup === group.id ? 'Joining...' : 'Join'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
