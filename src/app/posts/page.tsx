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

interface CategoryCount {
  [key: string]: number;
}

// Game cards data
const allGameCards = [
  {
    id: 'cod-mobile',
    name: 'Call of Duty Mobile',
    image: '/codm.jpeg',
    isMobile: true,
  },
  {
    id: 'free-fire',
    name: 'Free Fire',
    image: '/free fire.jpeg',
    isMobile: true,
  },
  {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    image: '/pubg.jpeg',
    isMobile: true,
  },
  {
    id: 'warzone',
    name: 'Warzone Mobile',
    image: '/warzone mobile.jpeg',
    isMobile: true,
  },
  {
    id: 'efootball',
    name: 'eFootball',
    image: '/e football.jpeg',
    isMobile: true,
  },
  {
    id: 'fifa-mobile',
    name: 'FIFA Mobile',
    image: '/fifa.jpeg',
    isMobile: true,
  },
  {
    id: 'delta-force',
    name: 'Delta Force',
    image: '/Delta Force on Steam.jpeg',
    isMobile: true,
  },
  {
    id: 'farlight',
    name: 'Farlight 84',
    image: '/farlight.jpeg',
    isMobile: true,
  },
  {
    id: 'blood-strike',
    name: 'Blood Strike',
    image: '/blood strike.jpeg',
    isMobile: true,
  },
  {
    id: 'critical-ops',
    name: 'Critical Ops',
    image: '/critical ops.jpeg',
    isMobile: true,
  },
  {
    id: 'ea-sports-fc',
    name: 'EA SPORTS FC',
    image: '/ea sport fc.jpeg',
    isMobile: false,
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    image: '/fortnite.jpeg',
    isMobile: false,
  },
  {
    id: 'call-of-duty-warzone',
    name: 'Call of Duty Warzone',
    image: '/call of duty warzone.jpeg',
    isMobile: false,
  },
  {
    id: 'dream-league-soccer',
    name: 'DLS',
    image: '/dls.jpg',
    isMobile: true,
  },
  {
    id: 'clash-of-clans',
    name: 'Clash of Clans',
    image: '/clash of clans.jpeg',
    isMobile: true,
  },
  {
    id: '8-ball-pool',
    name: '8 Ball Pool',
    image: '/Free 8 Ball Pool.jpeg',
    isMobile: true,
  },
  {
    id: 'shadow-fight',
    name: 'Shadow Fight',
    image: '/shadow fight.jpeg',
    isMobile: true,
  },
  {
    id: 'mortal-kombat',
    name: 'Mortal Kombat',
    image: '/Mortal kombat 1.jpeg',
    isMobile: false,
  },
  {
    id: 'apex-legends',
    name: 'Apex Legends',
    image: '/apex legend.jpeg',
    isMobile: false,
  },
  {
    id: 'modern-strike',
    name: 'Modern Strike',
    image: '/Modern Strike.jpeg',
    isMobile: true,
  },
  {
    id: 'gta',
    name: 'Grand Theft Auto',
    image: '/grand theft auto.jpeg',
    isMobile: false,
  },
  {
    id: 'nba-2k',
    name: 'NBA 2K',
    image: '/NBA 2K26 DESIGN.jpeg',
    isMobile: false,
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
  {
    id: 'snapchat',
    name: 'Snapchat',
    image: '/snapchat.jpeg',
  },
  {
    id: 'discord',
    name: 'Discord',
    image: '/discord.jpeg',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    image: '/twitch.jpeg',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    image: '/pintrest.jpeg',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    image: '/linkedin.jpeg',
  },
  {
    id: 'quora',
    name: 'Quora',
    image: '/QUORA.jpeg',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    image: '/Reddit.jpeg',
  },
  {
    id: 'kick',
    name: 'Kick',
    image: '/Kick.jpeg',
  },
  {
    id: 'likee',
    name: 'Likee',
    image: '/Likee.jpeg',
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
  const [listingCounts, setListingCounts] = useState<CategoryCount>({});

  // Fetch listing counts for each category
  useEffect(() => {
    const fetchListingCounts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/counts`);
        if (response.ok) {
          const data = await response.json();
          setListingCounts(data.counts || {});
        }
      } catch (error) {
        console.error('Failed to fetch listing counts:', error);
      }
    };
    fetchListingCounts();
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* In-Game Accounts Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">In-Game Accounts</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-4">
              {gameCards.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameClick(game.id)}
                  className="group hover:scale-105 transition-transform duration-300 relative"
                >
                  {listingCounts[game.id] > 0 && (
                    <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center">
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-green-500 to-emerald-600 items-center justify-center text-white text-[9px] font-bold shadow-lg">
                          {listingCounts[game.id] > 9 ? '9+' : listingCounts[game.id]}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="aspect-[3/4] rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-2">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-[10px] xs:text-xs sm:text-sm text-center px-1">
                    {game.name}
                  </h3>
                </button>
              ))}
            </div>
            <div className="text-center mt-6">
              {!showAllGames && allGameCards.length > 6 && (
                <button
                  onClick={() => setShowAllGames(true)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-white text-sm rounded-full font-medium transition-all border border-blue-500/30 hover:border-blue-500/50 backdrop-blur-sm"
                >
                  <span>View More</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {showAllGames && (
                <button
                  onClick={() => setShowAllGames(false)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-slate-600/20 to-slate-700/20 hover:from-slate-600/30 hover:to-slate-700/30 text-white text-sm rounded-full font-medium transition-all border border-slate-500/30 hover:border-slate-500/50 backdrop-blur-sm"
                >
                  <span>Show Less</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Social Accounts Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Social Accounts</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-4">
              {socialCards.map((social) => (
                <button
                  key={social.id}
                  onClick={() => handleGameClick(social.id)}
                  className="group hover:scale-105 transition-transform duration-300 relative"
                >
                  {listingCounts[social.id] > 0 && (
                    <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center">
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-green-500 to-emerald-600 items-center justify-center text-white text-[9px] font-bold shadow-lg">
                          {listingCounts[social.id] > 9 ? '9+' : listingCounts[social.id]}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="aspect-square rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-2">
                    <img
                      src={social.image}
                      alt={social.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-[10px] xs:text-xs sm:text-sm text-center px-1">
                    {social.name}
                  </h3>
                </button>
              ))}
            </div>
            <div className="text-center mt-6">
              {!showAllSocials && allSocialCards.length > 6 && (
                <button
                  onClick={() => setShowAllSocials(true)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-white text-sm rounded-full font-medium transition-all border border-blue-500/30 hover:border-blue-500/50 backdrop-blur-sm"
                >
                  <span>View More</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {showAllSocials && (
                <button
                  onClick={() => setShowAllSocials(false)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-slate-600/20 to-slate-700/20 hover:from-slate-600/30 hover:to-slate-700/30 text-white text-sm rounded-full font-medium transition-all border border-slate-500/30 hover:border-slate-500/50 backdrop-blur-sm"
                >
                  <span>Show Less</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
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
