'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams?.get('token');
    const refreshToken = searchParams?.get('refreshToken');
    const userStr = searchParams?.get('user');
    const error = searchParams?.get('error');
    const success = searchParams?.get('success');

    console.log('OAuth callback received:', { token: !!token, refreshToken: !!refreshToken, user: !!userStr, error, success });

    if (error) {
      console.error('OAuth error:', error);
      router.push('/login?error=' + error);
      return;
    }

    // NEW: Try to get tokens from cookies first (for OAuth)
    if (success === 'true') {
      try {
        console.log('OAuth success via cookies, reading cookie data...');
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

        const cookieToken = cookies['accessToken'];
        const cookieRefreshToken = cookies['refreshToken'];
        const cookieUserData = cookies['userData'];

        if (cookieToken && cookieUserData) {
          const user = JSON.parse(decodeURIComponent(cookieUserData));
          console.log('OAuth successful via cookies, logging in user:', user.email);
          
          // Save tokens and user data to localStorage
          localStorage.setItem('accessToken', cookieToken);
          if (cookieRefreshToken) {
            localStorage.setItem('refreshToken', cookieRefreshToken);
          }
          localStorage.setItem('user', JSON.stringify(user));
          
          // Clear the userData cookie (keep tokens for API calls)
          document.cookie = 'userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.clanplug.site';
          
          // Redirect to feed
          router.push('/feed');
          return;
        } else {
          console.error('OAuth cookies missing');
          router.push('/login?error=missing_cookies');
          return;
        }
      } catch (err) {
        console.error('Failed to parse cookie data:', err);
        router.push('/login?error=invalid_cookie_data');
        return;
      }
    }

    // OLD: Fallback to URL parameters (for backward compatibility)
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        console.log('OAuth successful, logging in user:', user.email);
        
        // Save tokens and user data
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to feed - the app will auto-login from localStorage
        router.push('/feed');
      } catch (err) {
        console.error('Failed to parse user data:', err);
        router.push('/login?error=invalid_data');
      }
    } else {
      console.error('Missing token or user data');
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
      <p className="text-white text-lg">Completing sign in...</p>
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
