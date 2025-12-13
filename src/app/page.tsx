'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { 
  IoGameControllerOutline,
  IoWalletOutline,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
  IoLogoInstagram,
  IoLogoYoutube,
  IoLogoTiktok
} from 'react-icons/io5';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      router.push('/feed');
    }
  }, [user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const gameAccounts = [
    { name: 'PUBG Mobile', image: '/pubg.jpeg' },
    { name: 'Free Fire', image: '/free fire.jpeg' },
    { name: 'COD Mobile', image: '/codm.jpeg' },
    { name: 'FIFA', image: '/fifa.jpeg' },
    { name: 'Fortnite', image: '/fortnite.jpeg' },
    { name: 'Clash of Clans', image: '/clash of clans.jpeg' },
  ];

  const socialAccounts = [
    { name: 'TikTok', image: '/tiktok.jpeg' },
    { name: 'Instagram', image: '/instagram.jpeg' },
    { name: 'YouTube', image: '/youtube.jpeg' },
    { name: 'Facebook', image: '/facebook.jpeg' },
    { name: 'Twitter/X', image: '/x.jpeg' },
    { name: 'Snapchat', image: '/snapchat.jpeg' },
  ];

  return (
    <div className="min-h-screen bg-black font-sans">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-0 animate-video-fade"
        >
          <source src="/Landing%20page%20background.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black"></div>

        {/* Navigation */}
        <nav className="relative z-10 px-3 py-3 sm:px-4 sm:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 sm:px-5 sm:py-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-[10px] sm:text-xs">CP</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">Clan Plug</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login" className="px-3 py-1.5 text-[11px] sm:text-xs text-white/60 hover:text-white transition-all font-medium">
                Sign In
              </Link>
              <Link href="/register" className="px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs bg-white text-black rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16 sm:pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-[28px] sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight tracking-tight animate-slide-up">
              Trade Gaming Accounts
            </h1>
            
            <p className="text-xs sm:text-sm text-white/40 mb-5 sm:mb-6 animate-slide-up font-medium tracking-wide" style={{animationDelay: '0.1s'}}>
              Secure • Verified • Instant
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center mb-6 sm:mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <Link href="/register" className="px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-white text-black rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl">
                Start Trading
              </Link>
              <Link href="/posts" className="px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full font-semibold transition-all hover:bg-white/15">
                Browse Marketplace
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs sm:max-w-sm mx-auto animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                <div className="text-base sm:text-lg font-bold text-white">1K+</div>
                <div className="text-white/30 text-[9px] sm:text-[10px] font-medium">Users</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                <div className="text-base sm:text-lg font-bold text-white">500+</div>
                <div className="text-white/30 text-[9px] sm:text-[10px] font-medium">Sold</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                <div className="text-base sm:text-lg font-bold text-white">24/7</div>
                <div className="text-white/30 text-[9px] sm:text-[10px] font-medium">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-black py-10 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6 text-center scroll-reveal tracking-tight">
            Everything you need
          </h2>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/10 transition-all scroll-reveal group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2 sm:mb-2.5 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                <IoGameControllerOutline className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1">Gaming</h3>
              <p className="text-white/40 text-[9px] sm:text-[10px] leading-tight">Trade verified accounts</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/10 transition-all scroll-reveal group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-2 sm:mb-2.5 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                <IoWalletOutline className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1">Wallet</h3>
              <p className="text-white/40 text-[9px] sm:text-[10px] leading-tight">Secure payments</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/10 transition-all scroll-reveal group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-2 sm:mb-2.5 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
                <IoShieldCheckmarkOutline className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1">KYC</h3>
              <p className="text-white/40 text-[9px] sm:text-[10px] leading-tight">Verified sellers</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/10 transition-all scroll-reveal group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-2 sm:mb-2.5 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-500/20">
                <IoFlashOutline className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1">VTU</h3>
              <p className="text-white/40 text-[9px] sm:text-[10px] leading-tight">Instant airtime</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/10 transition-all scroll-reveal group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-2 sm:mb-2.5 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                <IoLogoInstagram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1">Social</h3>
              <p className="text-white/40 text-[9px] sm:text-[10px] leading-tight">Trade accounts</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:from-blue-500/20 hover:to-purple-500/20 transition-all scroll-reveal flex items-center justify-center">
              <Link href="/posts" className="text-xs sm:text-sm font-bold text-white hover:scale-105 transition-transform">
                View All →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-black py-10 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6 text-center scroll-reveal tracking-tight">
            Popular Categories
          </h2>

          <div className="mb-8 sm:mb-10 scroll-reveal">
            <h3 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4">Gaming Accounts</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
              {gameAccounts.map((game, index) => (
                <Link key={index} href="/posts" className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl overflow-hidden hover:bg-white/10 transition-all hover:scale-105">
                  <div className="relative aspect-square">
                    <Image src={game.image} alt={game.name} fill className="object-cover" />
                  </div>
                  <div className="p-1.5 sm:p-2">
                    <h4 className="text-[9px] sm:text-[10px] font-semibold text-white truncate">{game.name}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="scroll-reveal">
            <h3 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4">Social Accounts</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
              {socialAccounts.map((platform, index) => (
                <Link key={index} href="/posts" className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl overflow-hidden hover:bg-white/10 transition-all hover:scale-105">
                  <div className="relative aspect-square">
                    <Image src={platform.image} alt={platform.name} fill className="object-cover" />
                  </div>
                  <div className="p-1.5 sm:p-2">
                    <h4 className="text-[9px] sm:text-[10px] font-semibold text-white truncate">{platform.name}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-5 sm:mb-6">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold text-[10px] sm:text-xs">CP</span>
                </div>
                <span className="text-white font-bold text-xs sm:text-sm tracking-tight">Clan Plug</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-1.5 sm:mb-2 text-[10px] sm:text-xs">Marketplace</h4>
              <ul className="space-y-1 text-[10px] sm:text-xs">
                <li><Link href="/posts" className="text-white/40 hover:text-white transition-colors">Gaming</Link></li>
                <li><Link href="/posts" className="text-white/40 hover:text-white transition-colors">Social</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-1.5 sm:mb-2 text-[10px] sm:text-xs">Services</h4>
              <ul className="space-y-1 text-[10px] sm:text-xs">
                <li><Link href="/vtu" className="text-white/40 hover:text-white transition-colors">VTU</Link></li>
                <li><Link href="/wallet" className="text-white/40 hover:text-white transition-colors">Wallet</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-1.5 sm:mb-2 text-[10px] sm:text-xs">Account</h4>
              <ul className="space-y-1 text-[10px] sm:text-xs">
                <li><Link href="/login" className="text-white/40 hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="text-white/40 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
            <p className="text-white/30 text-[10px] sm:text-xs">© {new Date().getFullYear()} Clan Plug</p>
            <div className="flex gap-2.5 sm:gap-3">
              <Link href="#" className="text-white/30 hover:text-white transition-colors">
                <IoLogoInstagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link href="#" className="text-white/30 hover:text-white transition-colors">
                <IoLogoYoutube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link href="#" className="text-white/30 hover:text-white transition-colors">
                <IoLogoTiktok className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        @keyframes video-fade {
          to { opacity: 0.6; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-video-fade {
          animation: video-fade 2s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out backwards;
        }

        .scroll-reveal {
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.5s ease-out;
        }

        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #000;
        }

        ::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
