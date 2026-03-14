import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coinbound.game',
  appName: 'Coinbound',
  webDir: 'dist',
  android: {
    // Allow the WebView to use localStorage, Web Audio, pointer events, etc.
    allowMixedContent: true,
    // Extend the WebView behind the status bar so env(safe-area-inset-top)
    // reports the real inset height.  Our top bar absorbs that padding in CSS.
    edgeToEdge: true,
  },
  server: {
    // Required so localStorage is shared between builds and survives app restarts
    androidScheme: 'https',
  },
  plugins: {
    // Tell the Android bridge to use immersive fullscreen mode (no status/nav bar)
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
