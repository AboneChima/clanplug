'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  IoGameControllerOutline,
  IoSearchOutline,
  IoAddOutline,
  IoCloseOutline,
  IoImageOutline,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
  IoStarOutline,
  IoLogoTiktok,
  IoLogoInstagram,
  IoLogoYoutube,
  IoLogoFacebook,
  IoLogoTwitter,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

// Game cards data
const allGameCards = [
  {
    id: 'cod-mobile',
    name: 'Call of Duty Mobile',
    image: '/codm.jpeg',
  },
  {
    id: 'free-fire',
    name: 'Free Fire',
    image: '/free fire.jpeg',
  },
  {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    image: '/pubg.jpeg',
  },
  {
    id: 'warzone',
    name: 'Warzone Mobile',
    image: '/warzone mobile.jpeg',
  },
  {
    id: 'efootball',
    name: 'eFootball',
    image: '/e football.jpeg',
  },
  {
    id: 'fifa-mobile',
    name: 'FIFA Mobile',
    image: '/fifa.jpeg',
  },
  {
    id: 'delta-force',
    name: 'Delta Force',
    image: '/Delta Force on Steam.jpeg',
  },
  {
    id: 'farlight',
    name: 'Farlight 84',
    image: '/farlight.jpeg',
  },
  {
    id: 'blood-strike',
    name: 'Blood Strike',
    image: '/blood strike.jpeg',
  },
];

// Social cards data
const allSocialCards = [
  {
    id: 'tiktok',
    name: 'TikTok',
    image: '/tiktok.jpeg',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    image: '/instagram.jpeg',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    image: '/youtube.jpeg',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    image: '/facebook.jpeg',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    image: '/x.jpeg',
  },
  {
    id: 'google',
    name: 'Google',
    image: '/google.jpeg',
  },
  {
    id: 'vpn',
    name: 'VPN Services',
    image: '/vpn.jpeg',
  },
];

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedGame, setSelectedGame] = useState<string | null>(searchParams.get('game'));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [showAllSocials, setShowAllSocials] = useState(false);

  useEffect(() => {
    const game = searchParams.get('game');
    if (game) {
      setSelectedGame(game);
    }
  }, [searchParams]);

  const handleGameClick = (gameId: string) => {
    router.push(`/marketplace/listings?game=${gameId}`);
  };

  const handleCreateListing = (gameId: string) => {
    router.push(`/marketplace/create?game=${gameId}`);
  };

  const gameCards = showAllGames ? allGameCards : allGameCards.slice(0, 6);
  const socialCards = showAllSocials ? allSocialCards : allSocialCards.slice(0, 6);

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-48 lg:pb-8">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-4">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">Marketplace</h1>
              <p className="text-xs sm:text-base text-white/90">Buy and sell accounts</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Features */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <IoShieldCheckmarkOutline className="w-4 h-4 text-green-500" />
              <span>Secure Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <IoStarOutline className="w-4 h-4 text-yellow-500" />
              <span>Verified Sellers</span>
            </div>
            <div className="flex items-center gap-2">
              <IoFlashOutline className="w-4 h-4 text-blue-500" />
              <span>Instant Delivery</span>
            </div>
          </div>

          {/* In-Game Accounts Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">In-Game Accounts</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {gameCards.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameClick(game.id)}
                  className="group hover:scale-105 transition-transform duration-300"
                >
                  <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-2">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-xs sm:text-sm text-center px-1">
                    {game.name}
                  </h3>
                </button>
              ))}
            </div>
            {!showAllGames && allGameCards.length > 6 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllGames(true)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all border border-slate-700"
                >
                  See More Games
                </button>
              </div>
            )}
          </div>

          {/* Social Accounts Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Social Accounts</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {socialCards.map((social) => (
                <button
                  key={social.id}
                  onClick={() => handleGameClick(social.id)}
                  className="group hover:scale-105 transition-transform duration-300"
                >
                  <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-2">
                    <img
                      src={social.image}
                      alt={social.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-xs sm:text-sm text-center px-1">
                    {social.name}
                  </h3>
                </button>
              ))}
            </div>
            {!showAllSocials && allSocialCards.length > 6 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllSocials(true)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all border border-slate-700"
                >
                  See More Socials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
