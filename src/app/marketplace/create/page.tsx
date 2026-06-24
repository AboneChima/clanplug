'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  IoArrowBack,
  IoCloseOutline,
  IoVideocamOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

const gameNames: { [key: string]: string } = {
  'cod-mobile': 'Call of Duty Mobile',
  'free-fire': 'Free Fire',
  'pubg-mobile': 'PUBG Mobile',
  'warzone': 'Warzone Mobile',
  'efootball': 'eFootball',
  'fifa-mobile': 'FIFA Mobile',
  'delta-force': 'Delta Force',
  'farlight': 'Farlight 84',
  'blood-strike': 'Blood Strike',
};

const socialMediaNames: { [key: string]: string } = {
  'tiktok': 'TikTok',
  'instagram': 'Instagram',
  'youtube': 'YouTube',
  'facebook': 'Facebook',
  'twitter': 'Twitter/X',
  'google': 'Google',
  'vpn': 'VPN Services',
};

function CreateListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    price: '',
    gameTitle: '',
    type: 'GAME_ACCOUNT',
    location: '',
  });
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [userListingCount, setUserListingCount] = useState(0);
  const [loadingListingCount, setLoadingListingCount] = useState(true);
  
  // Check if current selection is Games & Gadgets
  const isGamesAndGadgets = formData.gameTitle === 'games-gadgets';

  // Fetch user's marketplace listing count on mount
  useEffect(() => {
    const fetchListingCount = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const listings = Array.isArray(data.data) ? data.data : [];
          // Count only marketplace listings (not social posts)
          const marketplaceListings = listings.filter((l: any) => l.type !== 'SOCIAL_POST');
          setUserListingCount(marketplaceListings.length);
        }
      } catch (error) {
        console.error('Error fetching listing count:', error);
      } finally {
        setLoadingListingCount(false);
      }
    };
    fetchListingCount();
  }, [user?.id]);

  // Pre-fill game from URL parameter and determine if it's social media
  useEffect(() => {
    const gameFromUrl = searchParams.get('game');
    if (gameFromUrl) {
      // Check if it's a social media account
      const socialMediaTypes = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'google', 'vpn'];
      const isSocialMedia = socialMediaTypes.includes(gameFromUrl);
      
      setFormData(prev => ({ 
        ...prev, 
        gameTitle: gameFromUrl,
        // All marketplace listings use MARKETPLACE_LISTING type (not SOCIAL_ACCOUNT)
        type: isSocialMedia ? 'MARKETPLACE_LISTING' : 'GAME_ACCOUNT'
      }));
    }
  }, [searchParams]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast(`File must be less than ${file.type.startsWith('video/') ? '50MB' : '10MB'}`, 'error');
      return;
    }

    // Check if it's a valid media file
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showToast('Please select an image or video file', 'error');
      return;
    }

    setSelectedMedia(file);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // RULE 1: Must be KYC verified to post on marketplace
    if (!user?.isKYCVerified) {
      showToast('Complete KYC verification to post on marketplace', 'error');
      router.push('/kyc');
      return;
    }

    // RULE 2: KYC verified users without badge have 5 listing limit
    const hasVerificationBadge = (user as any)?.verificationBadge?.status === 'verified' || 
                                  (user as any)?.verificationBadge?.status === 'active';
    
    if (!hasVerificationBadge && userListingCount >= 5) {
      showToast('You\'ve reached your listing limit (5). Purchase verification badge for unlimited listings!', 'error');
      router.push('/verification-badge');
      return;
    }
    
    if (!formData.description || !formData.gameTitle) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate location for Games & Gadgets
    if (isGamesAndGadgets && !formData.location.trim()) {
      showToast('Please provide a location for Games & Gadgets', 'error');
      return;
    }

    if (!selectedMedia) {
      showToast('Please upload a video or image', 'error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Step 1: Upload media first
      const mediaFormData = new FormData();
      mediaFormData.append('media', selectedMedia);
      mediaFormData.append('postType', 'MARKETPLACE_LISTING');

      console.log('Step 1: Uploading media...');
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: mediaFormData,
      });

      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadResponse.status, uploadData);

      if (!uploadResponse.ok) {
        let errorMsg = uploadData.message || 'Failed to upload media';
        if (uploadData.errors && uploadData.errors.length > 0) {
          const errorDetails = uploadData.errors.map((e: any) => e.message || e.error).join(', ');
          errorMsg = `${errorMsg}: ${errorDetails}`;
        }
        showToast(errorMsg, 'error');
        console.error('Upload failed:', uploadData);
        return;
      }

      const mediaUrl = uploadData.data?.urls?.[0];
      if (!mediaUrl) {
        showToast('No media URL returned from upload', 'error');
        console.error('No media URL in response:', uploadData);
        return;
      }

      console.log('Media uploaded successfully:', mediaUrl);

      // Step 2: Create post with media URL
      // Use first 50 chars of description as title
      const title = formData.description.slice(0, 50).trim() + (formData.description.length > 50 ? '...' : '');
      
      // For Games & Gadgets, append location to description
      const finalDescription = isGamesAndGadgets && formData.location
        ? `${formData.description}\n\nLocation: ${formData.location}`
        : formData.description;
      
      const postData = {
        title,
        description: finalDescription,
        gameTitle: formData.gameTitle,
        type: formData.type,
        ...(mediaType === 'video' ? { videos: [mediaUrl] } : { images: [mediaUrl] }),
        ...(formData.price && {
          price: parseFloat(formData.price),
          currency: 'NGN'
        })
      };

      console.log('Step 2: Creating post with data:', postData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const responseData = await response.json();
      console.log('Create post response:', response.status, responseData);

      if (response.ok) {
        showToast('Listing created successfully!', 'success');
        router.push(`/marketplace/listings?game=${formData.gameTitle}`);
      } else {
        showToast(responseData.message || 'Failed to create listing', 'error');
        console.error('Create post failed:', responseData);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      showToast('Error creating listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-black pb-24 lg:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#262626] mb-4">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Create Listing</h1>
              {formData.gameTitle && (
                <p className="text-xs text-gray-400">
                  {gameNames[formData.gameTitle] || socialMediaNames[formData.gameTitle] || formData.gameTitle.replace(/-/g, ' ')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* KYC Required Banner for Non-KYC Users */}
            {!user?.isKYCVerified && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <IoShieldCheckmarkOutline className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm font-medium mb-1">
                      KYC Verification Required
                    </p>
                    <p className="text-gray-400 text-xs mb-2">
                      You must complete KYC verification to post on the marketplace.
                    </p>
                    <Link href="/kyc">
                      <button type="button" className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all">
                        Complete KYC Verification
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Listing Limit Warning for KYC Users Without Badge */}
            {user?.isKYCVerified && !((user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active') && !loadingListingCount && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <IoShieldCheckmarkOutline className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-400 text-sm font-medium mb-1">
                      {userListingCount}/5 marketplace listings used
                    </p>
                    <p className="text-gray-400 text-xs mb-2">
                      {userListingCount >= 5 
                        ? 'You\'ve reached your limit. Purchase verification badge for unlimited marketplace listings!'
                        : `${5 - userListingCount} listings remaining. Purchase verification badge for unlimited listings!`
                      }
                    </p>
                    <Link href="/verification-badge">
                      <button type="button" className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition-all">
                        Get Verification Badge - ₦2,000/month
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Game/Social Media Selection */}
            <div>
              <label className="block text-white text-[11px] xs:text-xs sm:text-sm font-medium mb-1 xs:mb-1.5">
                {formData.type === 'MARKETPLACE_LISTING' ? 'Social Media Platform' : 'Game'} <span className="text-red-500">*</span>
              </label>
              <div className="w-full px-2 py-1.5 xs:px-3 xs:py-2 sm:px-4 sm:py-2.5 bg-slate-800/80 border border-slate-700 rounded-md xs:rounded-lg text-white text-xs xs:text-sm">
                {formData.gameTitle ? (
                  formData.type === 'MARKETPLACE_LISTING' 
                    ? socialMediaNames[formData.gameTitle] || formData.gameTitle 
                    : gameNames[formData.gameTitle] || formData.gameTitle
                ) : (
                  formData.type === 'MARKETPLACE_LISTING' ? 'No platform selected' : 'No game selected'
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                To change {formData.type === 'MARKETPLACE_LISTING' ? 'platform' : 'game'}, go back and select a different card
              </p>
            </div>

            {/* Description - Custom for Games & Gadgets */}
            <div>
              <label className="block text-white text-sm font-medium mb-1.5">
                {isGamesAndGadgets ? 'Condition' : 'Description'} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={
                  isGamesAndGadgets 
                    ? "Describe the device/gadget condition and details\n\nExample:\nBrand: Samsung Galaxy S23\nCondition: Used - Like New\nStorage: 256GB\nColor: Phantom Black\nAccessories: Original charger, box, warranty card\n\nProvide details about any wear, scratches, functionality issues, etc."
                    : "Include: Country/Region and Login Method\n\nExample:\nRegion: Nigeria\nLogin: Google\n\nThen describe your account in detail..."
                }
                rows={6}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
              {!isGamesAndGadgets && (
                <p className="text-xs text-gray-400 mt-1">
                  Please include region/country and login method in your description
                </p>
              )}
            </div>

            {/* Location - Only for Games & Gadgets */}
            {isGamesAndGadgets && (
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Lagos, Nigeria or Abuja, FCT"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={isGamesAndGadgets}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Specify where the item can be picked up or shipped from
                </p>
              </div>
            )}

            {/* Price (Optional) */}
            <div>
              <label className="block text-white text-sm font-medium mb-1.5">
                Price (NGN) <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 50000"
                min="0"
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Media Upload - NO VERIFICATION REQUIRED FOR MARKETPLACE */}
            <div>
              <label className="block text-white text-sm font-medium mb-1.5">
                Video/Image <span className="text-red-500">*</span>
                <span className="text-gray-400 text-xs ml-2">(Max 2 min, 50MB)</span>
              </label>
              <div className="space-y-3">
                {!mediaPreview ? (
                  <label className="flex flex-col items-center justify-center w-full px-3 py-8 sm:py-10 bg-slate-800/80 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <IoVideocamOutline className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-2" />
                    <span className="text-gray-300 text-sm font-medium mb-0.5">
                      Click to upload video or image
                    </span>
                    <span className="text-gray-500 text-xs">
                      MP4, MOV, AVI or JPG, PNG
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    {mediaType === 'video' ? (
                      <video
                        src={mediaPreview}
                        className="w-full h-48 sm:h-56 object-contain rounded-lg bg-black"
                        controls
                      />
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-48 sm:h-56 object-contain rounded-lg bg-black"
                      />
                    )}
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <IoCloseOutline className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs sm:text-sm">Creating...</span>
                  </span>
                ) : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default function CreateListingPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    }>
      <CreateListingForm />
    </Suspense>
  );
}
