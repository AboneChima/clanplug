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
import SearchBar from '@/components/SearchBar';
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

  // Fetch listing counts for each category - disabled for now
  // This endpoint doesn't exist yet on backend
  useEffect(() => {
    // TODO: Implement /api/listings/counts endpoint on backend
    // For now, listing counts are disabled
    setListingCounts({});
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

  const handleHotDealClick = (dealId: string) => {
    router.push(`/marketplace/listings?hotdeal=${dealId}`);
  };

  const handleCreateListing = (gameId: string) => {
    router.push(`/marketplace/create?game=${gameId}`);
  };

  const gameCards = showAllGames ? allGameCards : allGameCards.slice(0, 12);
  const socialCards = showAllSocials ? allSocialCards : allSocialCards.slice(0, 12);

  return (
    <AppShell>
      <div className="min-h-screen bg-black pb-20 lg:pb-8 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar 
              placeholder="Search listings, users, or categories..."
            />
          </div>

          {/* Hot Deals Section */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Hot Deals</h2>
              <div className="relative">
                <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">
                  Hot
                </span>
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'CODM', image: '/codm.jpeg', id: 'cod-mobile' },
                { name: 'TIKTOK', image: '/tiktok.jpeg', id: 'tiktok' },
                { name: 'IPAD/TABLETS', image: '/Ipad and tablet.jpg', id: 'ipad-tablets' },
                { name: 'EFOOTBALL', image: '/e football.jpeg', id: 'efootball' },
                { name: 'INSTAGRAM', image: '/instagram.jpeg', id: 'instagram' },
                { name: 'PS/XBOX', image: '/xbox vs ps.jpg', id: 'ps-xbox' },
                { name: 'FREE FIRE', image: '/free fire.jpeg', id: 'free-fire' },
                { name: 'FACEBOOK', image: '/facebook.jpeg', id: 'facebook' },
                { name: 'PC/LAPTOPS', image: '/Laptop pc.jpg', id: 'pc-laptops' },
                { name: 'BLOODSTRIKE', image: '/blood strike.jpeg', id: 'blood-strike' },
                { name: 'YOUTUBE', image: '/youtube.jpeg', id: 'youtube' },
                { name: 'GAMING PHONES', image: '/Gaming phones.jpg', id: 'gaming-phones' },
              ].map((deal, i) => (
                <button
                  key={i}
                  onClick={() => handleHotDealClick(deal.id)}
                  className="group hover:scale-105 transition-all duration-300 relative"
                >
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg border border-[#2f3336] bg-[#1a1a1a] relative">
                    <img
                      src={deal.image}
                      alt={deal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded uppercase">
                        Hot
                      </span>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-[10px] xs:text-xs text-center px-1 line-clamp-2 mt-2">
                    {deal.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>

          {/* In-Game Accounts Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">In-Game Accounts</h2>
            <div className="grid grid-cols-4 gap-2">
              {gameCards.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameClick(game.id)}
                  className="group hover:scale-105 transition-transform duration-300 relative"
                >
                  {listingCounts[game.id] > 0 && (
                    <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center">
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 items-center justify-center text-white text-[9px] font-bold shadow-lg">
                          {listingCounts[game.id] > 9 ? '9+' : listingCounts[game.id]}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg mb-2 border border-[#2f3336]">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-[10px] xs:text-xs text-center px-1 line-clamp-2">
                    {game.name}
                  </h3>
                </button>
              ))}
            </div>
            <div className="text-center mt-4">
              {!showAllGames && allGameCards.length > 8 && (
                <button
                  onClick={() => setShowAllGames(true)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-xs rounded-full font-medium transition-all border border-[#2f3336]"
                >
                  <span>View More</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {showAllGames && (
                <button
                  onClick={() => setShowAllGames(false)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-xs rounded-full font-medium transition-all border border-[#2f3336]"
                >
                  <span>Show Less</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Social Accounts Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Social Accounts</h2>
            <div className="grid grid-cols-4 gap-2">
              {socialCards.map((social) => (
                <button
                  key={social.id}
                  onClick={() => handleGameClick(social.id)}
                  className="group hover:scale-105 transition-transform duration-300 relative"
                >
                  {listingCounts[social.id] > 0 && (
                    <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center">
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 items-center justify-center text-white text-[9px] font-bold shadow-lg">
                          {listingCounts[social.id] > 9 ? '9+' : listingCounts[social.id]}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg mb-2 border border-[#2f3336]">
                    <img
                      src={social.image}
                      alt={social.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-[10px] xs:text-xs text-center px-1 line-clamp-2">
                    {social.name}
                  </h3>
                </button>
              ))}
            </div>
            <div className="text-center mt-4">
              {!showAllSocials && allSocialCards.length > 8 && (
                <button
                  onClick={() => setShowAllSocials(true)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-xs rounded-full font-medium transition-all border border-[#2f3336]"
                >
                  <span>View More</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {showAllSocials && (
                <button
                  onClick={() => setShowAllSocials(false)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-xs rounded-full font-medium transition-all border border-[#2f3336]"
                >
                  <span>Show Less</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Games & Gadgets Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Games & Gadgets</h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'IPAD/TABLETS', image: '/Ipad and tablet.jpg', id: 'ipad-tablets' },
                { name: 'PS/XBOX', image: '/xbox vs ps.jpg', id: 'ps-xbox' },
                { name: 'GAMING PHONES', image: '/Gaming phones.jpg', id: 'gaming-phones' },
                { name: 'HEADPHONES', image: '/headphones.jpg', id: 'headphones' },
                { name: 'TV/MONITOR', image: '/TV MONITOR.jpg', id: 'tv-monitor' },
                { name: 'INTERNET/WIFI', image: '/internet wifi.jpg', id: 'internet-wifi' },
                { name: 'GAME ACCESSORIES', image: '/game accessories.jpg', id: 'game-accessories' },
                { name: 'PC/LAPTOPS', image: '/Laptop pc.jpg', id: 'pc-laptops' },
              ].map((gadget, i) => (
                <button
                  key={i}
                  onClick={() => handleGameClick(gadget.id)}
                  className="group hover:scale-105 transition-transform duration-300 relative"
                >
                  {listingCounts[gadget.id] > 0 && (
                    <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center">
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 items-center justify-center text-white text-[9px] font-bold shadow-lg">
                          {listingCounts[gadget.id] > 9 ? '9+' : listingCounts[gadget.id]}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg mb-2 border border-[#2f3336]">
                    <img
                      src={gadget.image}
                      alt={gadget.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-white font-semibold text-[10px] xs:text-xs text-center px-1 line-clamp-2">
                    {gadget.name}
                  </h3>
                </button>
              ))}
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
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
