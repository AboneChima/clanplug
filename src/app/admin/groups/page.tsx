'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowBack, IoPeople, IoAdd, IoCreate, IoTrash, IoCheckmark, IoClose, IoImage } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  memberCount: number;
  createdAt: string;
}

export default function AdminGroupsPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  // Create new group state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string>('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/groups', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const groupsData = response.data?.data || response.data || [];
      setGroups(groupsData);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    setNewAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCreate = () => {
    setIsCreating(true);
    setNewName('');
    setNewDescription('');
    setNewAvatarFile(null);
    setNewAvatarPreview('');
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setNewName('');
    setNewDescription('');
    setNewAvatarFile(null);
    setNewAvatarPreview('');
  };

  const createGroup = async () => {
    if (!accessToken) return;
    
    if (!newName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = null;

      // Upload avatar if provided
      if (newAvatarFile) {
        const formData = new FormData();
        formData.append('media', newAvatarFile);

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload error:', errorText);
          throw new Error('Failed to upload avatar');
        }

        const uploadData = await uploadResponse.json();
        console.log('Upload response:', uploadData);
        avatarUrl = uploadData.data?.urls?.[0] || uploadData.data?.url || uploadData.url || uploadData.urls?.[0];
      }

      await apiClient.post(
        '/api/admin/groups',
        {
          name: newName.trim(),
          description: newDescription.trim() || null,
          avatar: avatarUrl,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      showToast('Group created successfully', 'success');
      await loadGroups();
      cancelCreate();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to create group', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description || '');
    setEditAvatarFile(null);
    setEditAvatarPreview(group.avatar || '');
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setEditName('');
    setEditDescription('');
    setEditAvatarFile(null);
    setEditAvatarPreview('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    setEditAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editingGroup || !accessToken) return;
    
    if (!editName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = editingGroup.avatar;

      // Upload avatar if changed
      if (editAvatarFile) {
        const formData = new FormData();
        formData.append('media', editAvatarFile);

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload error:', errorText);
          throw new Error('Failed to upload avatar');
        }

        const uploadData = await uploadResponse.json();
        console.log('Upload response:', uploadData);
        avatarUrl = uploadData.data?.urls?.[0] || uploadData.data?.url || uploadData.url || uploadData.urls?.[0];
      }

      await apiClient.put(
        `/api/admin/groups/${editingGroup.id}`,
        {
          name: editName.trim(),
          description: editDescription.trim() || null,
          avatar: avatarUrl,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      showToast('Group updated successfully', 'success');
      await loadGroups();
      cancelEdit();
    } catch (error: any) {
      console.error('Failed to update group:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to update group', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupId: string, groupName: string) => {
    if (!accessToken) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/api/admin/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      showToast('Group deleted successfully', 'success');
      await loadGroups();
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      showToast(error.response?.data?.message || 'Failed to delete group', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-[#1c1c1e] rounded-2xl h-40 md:h-48" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-[#1c1c1e] border-b border-[#38383a] sticky top-0 z-10 backdrop-blur-lg bg-opacity-95">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/admin')}
                className="text-[#0a84ff] font-medium text-lg active:opacity-70"
              >
                Admin
              </button>
              <h1 className="text-lg font-semibold text-white">
                Groups
              </h1>
              {!isCreating && !editingGroup && (
                <button
                  onClick={startCreate}
                  className="p-2 bg-[#0a84ff] text-white rounded-full active:opacity-70"
                >
                  <IoAdd className="w-5 h-5" />
                </button>
              )}
              {(isCreating || editingGroup) && <div className="w-9" />}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center gap-4 px-6 py-5">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-[#2c2c2e] rounded-full transition-colors"
            >
              <IoArrowBack className="w-6 h-6 text-[#0a84ff]" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <IoPeople className="w-8 h-8 text-[#0a84ff]" />
                Manage Groups
              </h1>
              <p className="text-[#8e8e93] text-sm mt-1">{groups.length} {groups.length === 1 ? 'group' : 'groups'}</p>
            </div>
            {!isCreating && !editingGroup && (
              <button
                onClick={startCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0a84ff] text-white font-semibold rounded-xl hover:opacity-80 transition-opacity"
              >
                <IoAdd className="w-5 h-5" />
                New Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Create/Edit Form Modal */}
        {(isCreating || editingGroup) && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden border border-[#38383a]">
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {isCreating ? (
                      <>
                        <IoAdd className="w-6 h-6 text-[#0a84ff]" />
                        Create New Group
                      </>
                    ) : (
                      <>
                        <IoCreate className="w-6 h-6 text-[#0a84ff]" />
                        Edit Group
                      </>
                    )}
                  </h2>
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#8e8e93] mb-3">
                    Group Icon {isCreating && '(Optional)'}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {(isCreating ? newAvatarPreview : editAvatarPreview) ? (
                        <img
                          src={isCreating ? newAvatarPreview : editAvatarPreview}
                          alt="Group avatar"
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-[#38383a]"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <IoImage className="w-10 h-10 md:w-12 md:h-12 text-white opacity-50" />
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-[#0a84ff] p-2 rounded-full cursor-pointer active:opacity-70 shadow-lg">
                        <IoAdd className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={isCreating ? handleNewAvatarChange : handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        Upload icon
                      </p>
                      <p className="text-xs text-[#8e8e93] mt-1">
                        Max 5MB • 512×512px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-[#8e8e93] mb-2">
                    Group Name {isCreating && '*'}
                  </label>
                  <input
                    type="text"
                    value={isCreating ? newName : editName}
                    onChange={(e) => isCreating ? setNewName(e.target.value) : setEditName(e.target.value)}
                    maxLength={50}
                    className="w-full bg-[#2c2c2e] text-white px-4 py-3 rounded-xl border border-[#38383a] focus:border-[#0a84ff] focus:outline-none transition-colors"
                    placeholder="Enter group name"
                    autoFocus
                  />
                  <p className="text-xs text-[#8e8e93] mt-2 text-right">
                    {(isCreating ? newName : editName).length}/50
                  </p>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium text-[#8e8e93] mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={isCreating ? newDescription : editDescription}
                    onChange={(e) => isCreating ? setNewDescription(e.target.value) : setEditDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full bg-[#2c2c2e] text-white px-4 py-3 rounded-xl border border-[#38383a] focus:border-[#0a84ff] focus:outline-none resize-none transition-colors"
                    placeholder="Enter group description"
                  />
                  <p className="text-xs text-[#8e8e93] mt-2 text-right">
                    {(isCreating ? newDescription : editDescription).length}/200
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={isCreating ? createGroup : saveEdit}
                    disabled={saving || (isCreating ? !newName.trim() : !editName.trim())}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#0a84ff] text-white font-semibold rounded-xl active:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <IoCheckmark className="w-5 h-5" />
                    {saving ? (isCreating ? 'Creating...' : 'Saving...') : (isCreating ? 'Create' : 'Save')}
                  </button>
                  <button
                    onClick={isCreating ? cancelCreate : cancelEdit}
                    disabled={saving}
                    className="px-6 py-3 bg-[#2c2c2e] text-white font-semibold rounded-xl active:opacity-70 transition-opacity disabled:opacity-40 border border-[#38383a]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        {groups.length === 0 && !isCreating ? (
          <div className="bg-[#1c1c1e] rounded-2xl p-12 text-center border border-[#38383a] max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#2c2c2e] rounded-full flex items-center justify-center">
              <IoPeople className="w-10 h-10 text-[#8e8e93]" />
            </div>
            <p className="text-white text-lg font-medium mb-2">No Groups Yet</p>
            <p className="text-[#8e8e93] text-sm mb-6 max-w-md mx-auto">
              Create your first group to organize community discussions
            </p>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a84ff] text-white font-semibold rounded-xl hover:opacity-80 transition-opacity"
            >
              <IoAdd className="w-5 h-5" />
              Create First Group
            </button>
          </div>
        ) : !isCreating && !editingGroup && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-[#1c1c1e] rounded-2xl overflow-hidden border border-[#38383a] hover:border-[#48484a] transition-colors"
              >
                {/* Group Card */}
                <div className="p-4 flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative mb-3">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <IoPeople className="w-10 h-10 md:w-12 md:h-12 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="text-base md:text-lg font-semibold text-white mb-1 line-clamp-1 w-full">
                    {group.name}
                  </h3>
                  
                  {group.description && (
                    <p className="text-xs md:text-sm text-[#8e8e93] line-clamp-2 mb-3 min-h-[2.5rem]">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-xs text-[#8e8e93] mb-4">
                    <IoPeople className="w-3.5 h-3.5" />
                    <span>{group.memberCount}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => startEdit(group)}
                      className="flex-1 p-2 bg-[#0a84ff] hover:opacity-80 rounded-lg transition-opacity active:scale-95"
                      title="Edit"
                    >
                      <IoCreate className="w-4 h-4 md:w-5 md:h-5 text-white mx-auto" />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id, group.name)}
                      className="flex-1 p-2 bg-[#ff3b30] hover:opacity-80 rounded-lg transition-opacity active:scale-95"
                      title="Delete"
                    >
                      <IoTrash className="w-4 h-4 md:w-5 md:h-5 text-white mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
