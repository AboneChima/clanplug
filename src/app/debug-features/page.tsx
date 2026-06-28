'use client';

import { useEffect, useState } from 'react';
import PushNotificationToggle from '@/components/PushNotificationToggle';

export default function DebugFeaturesPage() {
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    setEnvVars({
      VAPID_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'NOT SET',
      API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Feature Debug Page</h1>
      
      <div className="space-y-8">
        {/* Environment Variables */}
        <div className="bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
          <pre className="text-xs">{JSON.stringify(envVars, null, 2)}</pre>
        </div>

        {/* Push Notification Component Test */}
        <div className="bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Push Notification Toggle Component</h2>
          <PushNotificationToggle />
        </div>

        {/* Action Buttons Test */}
        <div className="bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Action Buttons Test</h2>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-gray-300 hover:text-blue-500">
              💬 <span>10 Comments</span>
            </button>
            <button className="flex items-center gap-2 text-gray-300 hover:text-pink-500">
              ❤️ <span>25 Likes</span>
            </button>
            <button className="flex items-center gap-2 text-gray-300 hover:text-green-500">
              📤 <span>Share</span>
            </button>
            <button className="flex items-center gap-2 text-gray-300 hover:text-blue-500">
              🔖 <span>Bookmark</span>
            </button>
          </div>
        </div>

        {/* Video Test */}
        <div className="bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Video Player Test</h2>
          <video
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            className="w-full max-w-md"
            controls
            playsInline
            preload="metadata"
          />
        </div>
      </div>
    </div>
  );
}
