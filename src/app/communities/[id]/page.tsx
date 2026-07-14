"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IoArrowBackOutline, IoPeople, IoCalendar, IoChatbubbles, IoExitOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { communityService, Community, CommunityMember } from '@/services/community.service';

export default function CommunityPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params?.id as string;
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  
  const [community, setCommunity] = useState<Community & { members: CommunityMember[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (accessToken && communityId) {
      loadCommunity();
    }
  }, [accessToken, communityId]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const data = await communityService.getCommunityDetails(communityId);
      setCommunity(data);
    } catch (error) {
      console.error('Failed to load community:', error);
      showToast('Failed to load community', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      await communityService.joinCommunity(communityId);
      showToast('Joined community!', 'success');
      loadCommunity();
    } catch (error) {
      showToast('Failed to join community', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this community?')) return;
    
    try {
      setJoining(true);
      await communityService.leaveCommunity(communityId);
      showToast('Left community', 'success');
      router.push('/messages');
    } catch (error) {
      showToast('Failed to leave community', 'error');
    } finally {
      setJoining(false);
    }
  };

  if (loading || !community) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen bg-black">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-screen bg-black">
        {/* Header */}
        <div className="bg-black px-4 py-3 flex-shrink-0 border-b border-[#2f3336] flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
          >
            <IoArrowBackOutline className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Community Info</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Banner */}
          {community.banner && (
            <div className="w-full h-32 bg-[#1a1a1a]">
              <img src={community.banner} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Community Info */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {community.image ? (
                  <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🎮</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{community.name}</h2>
                {community.description && (
                  <p className="text-gray-400 text-sm">{community.description}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1a1a1a] p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <IoPeople className="w-5 h-5" />
                  <span className="text-sm">Members</span>
                </div>
                <p className="text-2xl font-bold text-white">{community.memberCount}</p>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <IoCalendar className="w-5 h-5" />
                  <span className="text-sm">Created</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {new Date(community.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Members List */}
            <button
              onClick={() => router.push(`/communities/${communityId}/members`)}
              className="w-full bg-[#1a1a1a] p-4 rounded-xl flex items-center justify-between hover:bg-[#2a2a2a] transition-colors mb-6"
            >
              <div className="flex items-center gap-3">
                <IoPeople className="w-6 h-6 text-blue-500" />
                <span className="text-white font-medium">View All Members</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Action Buttons */}
            <div className="space-y-3">
              {community.isJoined ? (
                <>
                  <button
                    onClick={() => router.push(`/communities/${communityId}/chat`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <IoChatbubbles className="w-5 h-5" />
                    Open Chat
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={joining}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <IoExitOutline className="w-5 h-5" />
                    {joining ? 'Leaving...' : 'Leave Community'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {joining ? 'Joining...' : 'Join Community'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
