import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "eu.cardplace.app",
  appName: "CardPlace",
  webDir: "dist",
  server: {
    // In production the app loads from the device's dist/ bundle.
    // Un-comment the line below only for live-reload during development:
    // url: "http://192.168.x.x:5173",
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#050A12",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050A12",
    },
    Camera: {
      permissions: ["camera"],
    },
  },
  android: {
    buildOptions: {
      keystorePath: "release.keystore",
      keystoreAlias: "cardplace",
    },
  },
};

export default config;
