import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clanplug.app',
  appName: 'ClanPlug',
  webDir: 'out', 
  server: {
    url: 'https://www.clanplug.site', // Production URL
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
