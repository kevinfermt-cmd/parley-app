import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.socialbet.app',
  appName: 'SocialBet',
  webDir: 'public', // Cambiamos 'out' por 'public'
  server: {
    url: 'https://parley-app-ten.vercel.app/', // <--- ¡OJO! Pon tu link real aquí
    cleartext: true
  }
};

export default config;