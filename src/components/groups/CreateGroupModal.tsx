'use client';

import { useState, useEffect } from 'react';
import { IoClose, IoSearch, IoCheckmark } from 'react-icons/io5';
import { groupService } from '@/services/group.service';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const { showToast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  // Fetch followers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    } else {
      // Reset state when modal closes
      setGroupName('');
      setGroupDescription('');
      setSearchQuery('');
      setSelectedMembers(new Set());
    }
  }, [isOpen]);

  const fetchFollowers = async () => {
    setIsLoadingFollowers(true);
    try {
      const response = await apiClient.get('/api/follow/followers');
      setFollowers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      showToast('Failed to load followers', 'error');
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }

    if (selectedMembers.size === 0) {
      showToast('Select at least one member', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await groupService.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        memberIds: Array.from(selectedMembers),
      });

      showToast('Group created successfully! 🎉', 'success');
      onGroupCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating group:', error);
      showToast(error.response?.data?.message || 'Failed to create group', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFollowers = followers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-[#2f3336]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2f3336]">
          <h2 className="text-xl font-bold text-white">Create Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2f3336] rounded-full transition-colors"
          >
            <IoClose className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
              className="w-full bg-[#262626] text-white px-4 py-3 rounded-lg border border-[#2f3336] focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">{groupName.length}/50</p>
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              maxLength={200}
              rows={3}
              className="w-full bg-[#262626] text-white px-4 py-3 rounded-lg border border-[#2f3336] focus:border-blue-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{groupDescription.length}/200</p>
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add Members <span className="text-red-500">*</span>
            </label>

            {/* Search */}
            <div className="relative mb-3">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search followers..."
                className="w-full bg-[#262626] text-white pl-10 pr-4 py-2 rounded-lg border border-[#2f3336] focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Selected Count */}
            {selectedMembers.size > 0 && (
              <p className="text-sm text-blue-400 mb-2">
                {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
              </p>
            )}

            {/* Follower List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {isLoadingFollowers ? (
                <p className="text-gray-400 text-sm text-center py-4">Loading followers...</p>
              ) : filteredFollowers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  {searchQuery ? 'No followers found' : 'No followers yet'}
                </p>
              ) : (
                filteredFollowers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedMembers.has(user.id)
                        ? 'bg-blue-500/20 border border-blue-500/50'
                        : 'bg-[#262626] border border-transparent hover:bg-[#2f3336]'
                    }`}
                  >
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-gray-400 text-xs">@{user.username}</p>
                    </div>
                    {selectedMembers.has(user.id) && (
                      <IoCheckmark className="w-5 h-5 text-blue-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2f3336] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-[#262626] hover:bg-[#2f3336] text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !groupName.trim() || selectedMembers.size === 0}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
