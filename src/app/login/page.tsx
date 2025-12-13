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
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      {/* Back to Home Button */}
      <Link 
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group"
      >
        <IoArrowBackOutline className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        <IoHomeOutline className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline text-sm font-medium">Back to Home</span>
      </Link>
      
      <div className="relative max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/50 p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">CP</div>
            </div>
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Clan Plug
              </h1>
              <h2 className="text-base sm:text-lg text-gray-300 font-medium">Welcome back</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              Sign in to your account or{' '}
              <Link 
                href="/register" 
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                create a new account
              </Link>
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoMailOutline className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoLockClosedOutline className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 focus:outline-none transition-colors duration-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <IoEyeOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link 
                    href="/forgot-password"
                    className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium"
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
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <div className="text-sm text-red-300 font-medium">{error}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-3 sm:space-y-4">
              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="group relative w-full flex justify-center items-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">Signing in...</span>
                  </>
                ) : (
                  <>
                    <IoShieldCheckmarkOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Sign In</span>
                    <IoArrowForwardOutline className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
              
              {/* Validation Message */}
              {!isValid && (
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Enter a valid email and at least 6 characters for password
                  </p>
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pt-3 sm:pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400">
              Secure login powered by advanced encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}