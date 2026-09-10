'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processAuthCallback = () => {
      try {
        // Get data from URL fragment (after #)
        const hash = window.location.hash.substring(1); // Remove the #
        
        if (!hash) {
          setError('No authentication data received');
          setStatus('error');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Decode the base64 data
        const authDataString = atob(hash);
        const authData = JSON.parse(authDataString);

        console.log('✅ Auth data received:', {
          hasToken: !!authData.token,
          hasRefreshToken: !!authData.refreshToken,
          hasUser: !!authData.user,
          userId: authData.user?.id
        });

        // Store tokens in localStorage
        if (authData.token) {
          localStorage.setItem('token', authData.token);
          console.log('✅ Token saved to localStorage');
        }
        
        if (authData.refreshToken) {
          localStorage.setItem('refreshToken', authData.refreshToken);
          console.log('✅ Refresh token saved');
        }

        // Store user data
        if (authData.user) {
          localStorage.setItem('user', JSON.stringify(authData.user));
          console.log('✅ User data saved');
        }

        setStatus('success');

        // Force reload to ensure all components see the new auth state
        console.log('✅ Redirecting to home...');
        window.location.href = '/';

      } catch (error) {
        console.error('❌ Error processing auth callback:', error);
        setError('Failed to process authentication data');
        setStatus('error');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    processAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700">
          {status === 'processing' && (
            <div className="text-center">
              <div className="inline-block mb-6">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Completing Sign In...
              </h2>
              <p className="text-slate-400">
                Please wait while we log you in
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="inline-block mb-6">
                <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Success!
              </h2>
              <p className="text-slate-400">
                Redirecting you to the app...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="inline-block mb-6">
                <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Authentication Failed
              </h2>
              <p className="text-slate-400 mb-4">
                {error || 'Something went wrong'}
              </p>
              <p className="text-sm text-slate-500">
                Redirecting to login page...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
