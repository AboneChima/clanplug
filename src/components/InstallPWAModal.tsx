'use client';

import { useEffect, useState } from 'react';
import { IoCloseOutline, IoShareOutline, IoEllipsisHorizontalOutline, IoAddOutline } from 'react-icons/io5';

export default function InstallPWAModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Detect Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    // DISABLED: Don't capture beforeinstallprompt - only show instructions manually
    // const handleBeforeInstallPrompt = (e: Event) => {
    //   e.preventDefault();
    //   setDeferredPrompt(e);
    //   console.log('📱 Install prompt available');
    // };
    // window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for custom open event from sidebar
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('openInstallModal', handleOpenModal);

    return () => {
      // window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('openInstallModal', handleOpenModal);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('❌ No install prompt available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`📱 Install outcome: ${outcome}`);

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0a0a0a] w-full sm:max-w-md sm:rounded-2xl overflow-hidden rounded-t-3xl sm:rounded-b-3xl border border-[#2f3336]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2f3336]">
          <h2 className="text-xl font-bold text-white">Install ClanPlug</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
          >
            <IoCloseOutline className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* App Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="12" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="8" r="1"/>
                <circle cx="15" cy="8" r="1"/>
                <circle cx="9" cy="12" r="1"/>
                <circle cx="15" cy="12" r="1"/>
                <path d="M8 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="space-y-4">
              <p className="text-white font-medium text-center mb-4">
                Install ClanPlug on your iPhone for the best experience
              </p>
              
              <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-4 border border-[#2f3336]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      Tap the <IoShareOutline className="inline w-4 h-4 text-blue-400 mx-1" /> <strong>Share</strong> button at the bottom of Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      Scroll down and tap <IoAddOutline className="inline w-4 h-4 text-blue-400 mx-1" /> <strong>Add to Home Screen</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      Tap <strong>Add</strong> in the top right corner
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 text-xs text-center mt-4">
                Note: This feature only works in Safari browser
              </p>
            </div>
          )}

          {/* Android Instructions with Install Button */}
          {isAndroid && deferredPrompt && (
            <div className="space-y-4">
              <p className="text-white font-medium text-center mb-4">
                Install ClanPlug for quick access and offline features
              </p>

              <button
                onClick={handleInstall}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Install App Now
              </button>

              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="flex-1 h-px bg-[#2f3336]"></div>
                <span>Benefits</span>
                <div className="flex-1 h-px bg-[#2f3336]"></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>Quick access from your home screen</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>Faster loading and performance</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>Push notifications</span>
                </div>
              </div>
            </div>
          )}

          {/* Android without prompt */}
          {isAndroid && !deferredPrompt && (
            <div className="space-y-4">
              <p className="text-white font-medium text-center">
                Install ClanPlug on your Android device
              </p>
              
              <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-4 border border-[#2f3336]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      Tap the <IoEllipsisHorizontalOutline className="inline w-4 h-4 text-blue-400 mx-1" /> <strong>menu</strong> (three dots) in your browser
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      Tap <strong>Install</strong> to confirm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop/Other */}
          {!isIOS && !isAndroid && (
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Install functionality is currently available on mobile devices (iOS and Android)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
