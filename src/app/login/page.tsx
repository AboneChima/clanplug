'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  IoEyeOutline, 
  IoEyeOffOutline, 
  IoMailOutline, 
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoArrowBackOutline,
  IoHomeOutline
} from 'react-icons/io5';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isValid = email.includes('@') && password.length >= 6;
  
  const { login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login...');
      await login(email, password);
      console.log('Login successful, redirecting...');
      showToast('Login successful', 'success');
      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      {/* Back to Home Button */}
      <Link 
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-[#333] rounded-xl text-white hover:bg-[#2a2a2a]/80 transition-all duration-200 group shadow-lg"
      >
        <IoArrowBackOutline className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        <IoHomeOutline className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline text-sm font-medium">Home</span>
      </Link>
      
      <div className="relative max-w-md w-full z-10">
        {/* Main Card - iOS Bevel Style */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] backdrop-blur-xl border border-blue-500/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center">
            {/* App Icon - iOS Style */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-[2px] shadow-xl shadow-blue-500/30">
              <div className="w-full h-full rounded-[15px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  C
                </span>
              </div>
            </div>
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-1">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-400">Sign in to ClanPlug</p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <IoMailOutline className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border border-[#333] rounded-xl bg-[#0a0a0a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm sm:text-base"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <IoLockClosedOutline className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 sm:pl-12 pr-12 py-3 sm:py-3.5 border border-[#333] rounded-xl bg-[#0a0a0a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-500 hover:text-gray-300 focus:outline-none transition-colors duration-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="w-5 h-5" />
                    ) : (
                      <IoEyeOutline className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link 
                    href="/forgot-password"
                    className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="text-sm text-red-300 font-medium">{error}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="group relative w-full flex justify-center items-center gap-2 py-3 sm:py-3.5 px-4 border border-transparent text-sm sm:text-base font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <IoShieldCheckmarkOutline className="w-5 h-5" />
                    <span>Sign In</span>
                    <IoArrowForwardOutline className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
              
              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Don't have an account?{' '}
                  <Link 
                    href="/register" 
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-[#2f3336]">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <IoShieldCheckmarkOutline className="w-4 h-4 text-blue-500" />
              <span>Secure login with encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}