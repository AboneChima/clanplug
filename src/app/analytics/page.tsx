"use client";

import { useEffect, useState } from 'react';
import { IoStatsChartOutline, IoTrendingUpOutline, IoTrendingDownOutline, IoEyeOutline, IoHeartOutline, IoChatbubbleOutline, IoTimeOutline, IoCalendarOutline, IoBarChartOutline, IoPieChartOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type AnalyticsData = {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
  viewsChange: number;
  likesChange: number;
  commentsChange: number;
  postsChange: number;
};

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      // Simulate loading analytics data
      setTimeout(() => {
        setAnalyticsData({
          totalViews: 12450,
          totalLikes: 3240,
          totalComments: 890,
          totalPosts: 45,
          viewsChange: 12.5,
          likesChange: -2.3,
          commentsChange: 8.7,
          postsChange: 15.2,
        });
        setDataLoading(false);
      }, 1000);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      {/* Hero Section */}
      <div className="relative mb-6 sm:mb-8 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-brand-600/5 to-purple-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-800/70 dark:to-gray-900/50 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/30 to-brand-600/30 rounded-2xl blur-xl"></div>
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 via-brand-600/15 to-brand-500/20 border border-brand-500/30 backdrop-blur-sm flex items-center justify-center">
                <IoStatsChartOutline className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-brand-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-1 sm:mb-2">
                Analytics
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 font-medium">
                Track your performance and engagement metrics
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="text-center flex-1 sm:flex-none">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-600 dark:text-brand-400">24h</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Period</div>
              </div>
              <div className="text-center flex-1 sm:flex-none">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-success-600 dark:text-success-400">Live</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Status</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Views */}
            <div className="relative animate-fade-in hover:shadow-brand-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-600/5 to-blue-500/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-800/70 dark:to-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-blue-500/10 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg">
                    <IoEyeOutline className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    analyticsData!.viewsChange > 0 
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' 
                      : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                  }`}>
                    {analyticsData!.viewsChange > 0 ? <IoTrendingUpOutline className="w-3 h-3" /> : <IoTrendingDownOutline className="w-3 h-3" />}
                    {Math.abs(analyticsData!.viewsChange)}%
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {analyticsData!.totalViews.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Views</div>
              </div>
            </div>

            {/* Total Likes */}
            <div className="relative animate-fade-in hover:shadow-brand-lg transition-all duration-300" style={{animationDelay: '0.1s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-500/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-800/70 dark:to-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-red-500/10 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center shadow-lg">
                    <IoHeartOutline className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    analyticsData!.likesChange > 0 
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' 
                      : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                  }`}>
                    {analyticsData!.likesChange > 0 ? <IoTrendingUpOutline className="w-3 h-3" /> : <IoTrendingDownOutline className="w-3 h-3" />}
                    {Math.abs(analyticsData!.likesChange)}%
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {analyticsData!.totalLikes.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Likes</div>
              </div>
            </div>

            {/* Total Comments */}
            <div className="relative animate-fade-in hover:shadow-brand-lg transition-all duration-300" style={{animationDelay: '0.2s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-green-600/5 to-green-500/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-800/70 dark:to-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-green-500/10 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center shadow-lg">
                    <IoChatbubbleOutline className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    analyticsData!.commentsChange > 0 
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' 
                      : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                  }`}>
                    {analyticsData!.commentsChange > 0 ? <IoTrendingUpOutline className="w-3 h-3" /> : <IoTrendingDownOutline className="w-3 h-3" />}
                    {Math.abs(analyticsData!.commentsChange)}%
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {analyticsData!.totalComments.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Comments</div>
              </div>
            </div>

            {/* Total Posts */}
            <div className="relative animate-fade-in hover:shadow-brand-lg transition-all duration-300" style={{animationDelay: '0.3s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-purple-600/5 to-purple-500/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-800/70 dark:to-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-purple-500/10 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg">
                    <IoBarChartOutline className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    analyticsData!.postsChange > 0 
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' 
                      : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                  }`}>
                    {analyticsData!.postsChange > 0 ? <IoTrendingUpOutline className="w-3 h-3" /> : <IoTrendingDownOutline className="w-3 h-3" />}
                    {Math.abs(analyticsData!.postsChange)}%
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {analyticsData!.totalPosts.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Posts</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Performance Chart */}
            <div className="relative animate-fade-in hover:shadow-brand-lg transition-all duration-300" style={{animationDelay: '0.4s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-accent/5 to-success/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-800/70 dark:to-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-brand-500/10 p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent/20 border border-brand-500/30 flex items-center justify-center shadow-lg">
                    <IoBarChartOutline className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Performance Overview</div>
                    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Last 30 days activity</div>
                  </div>
                </div>
                <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <IoPieChartOutline className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Chart visualization coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Trends */}
            <div className="relative animate-fade-in hover:shadow-brand-lg transition-all duration-300" style={{animationDelay: '0.5s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-brand-500/5 to-accent/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-800/70 dark:to-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-success/10 p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-success/20 to-brand-500/20 border border-success/30 flex items-center justify-center shadow-lg">
                    <IoTrendingUpOutline className="w-5 h-5 sm:w-6 sm:h-6 text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Engagement Trends</div>
                    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">User interaction patterns</div>
                  </div>
                </div>
                <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <IoStatsChartOutline className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Trend analysis coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}