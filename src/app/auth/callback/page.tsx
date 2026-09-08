'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // First check for data in URL fragment (from intermediate OAuth page)
    const hash = window.location.hash.substring(1); // Remove the #
    
    if (hash) {
      try {
        console.log('OAuth callback: Reading from URL fragment');
        const authData = JSON.parse(atob(hash));
        
        if (authData.token && authData.user) {
          console.log('OAuth successful via fragment, logging in user:', authData.user.email);
          
          // Save tokens and user data
          localStorage.setItem('accessToken', authData.token);
          if (authData.refreshToken) {
            localStorage.setItem('refreshToken', authData.refreshToken);
          }
          localStorage.setItem('user', JSON.stringify(authData.user));
          
          // Clear the fragment
          window.location.hash = '';
          
          console.log('✅ OAuth data saved to localStorage, redirecting to feed...');
          
          // Use window.location.replace for better iOS Safari compatibility
          // Small delay to ensure localStorage is written
          setTimeout(() => {
            window.location.replace('/feed');
          }, 100);
          return;
        }
      } catch (err) {
        console.error('Failed to parse fragment data:', err);
      }
    }

    // Fallback: Check URL search params
    const token = searchParams?.get('token');
    const refreshToken = searchParams?.get('refreshToken');
    const userStr = searchParams?.get('user');
    const error = searchParams?.get('error');
    const success = searchParams?.get('success');

    console.log('OAuth callback received:', { token: !!token, refreshToken: !!refreshToken, user: !!userStr, error, success, hasFragment: !!hash });

    if (error) {
      console.error('OAuth error:', error);
      router.push('/login?error=' + error);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        console.log('OAuth successful via URL params, logging in user:', user.email);
        
        // Save tokens and user data
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to feed
        router.push('/feed');
      } catch (err) {
        console.error('Failed to parse user data:', err);
        router.push('/login?error=invalid_data');
      }
    } else if (!hash) {
      console.error('Missing OAuth data');
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
