import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.payrollplustime',
  appName: 'RRHH PcPeli',
  webDir: 'dist',
  // Logo configuration
  // Using RRHH_FINAL.png as source for app icon and splash
  // To regenerate native assets after changing the icon, run:
  // npx @capacitor/assets generate --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000' --splashBackgroundColor '#000000' --splashBackgroundColorDark '#000000' --android --ios
  // IMPORTANT: server.url is ONLY for development hot-reload
  // For production APK, this MUST be removed or commented out
  // server: {
  //   url: 'https://2b5297ed-d17f-40ce-8c1c-7fc0a8f396e9.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#b062f8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
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