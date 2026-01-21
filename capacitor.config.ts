import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pcpeli.rrhh',
  appName: 'RRHH PcPeli',
  webDir: 'dist',
  // Logo configuration
  // Icon: RRHH_FINAL.png (assets/icon-only.png)
  // Splash: logo_carga_lav.png (assets/splash.png)
  // To regenerate: npx capacitor-assets generate --android --ios
  // IMPORTANT: server.url is ONLY for development hot-reload
  // For production APK, this MUST be removed or commented out
  // server: {
  //   url: 'https://2b5297ed-d17f-40ce-8c1c-7fc0a8f396e9.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#000000",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark'
    },
    App: {
      launchUrl: null
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true // Enable debugging for production
  }
};

export default config;