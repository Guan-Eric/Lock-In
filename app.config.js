import 'dotenv/config';
export default {
  expo: {
    name: 'Lock In',
    slug: 'lock-in',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/lock-in-icon.jpg',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/lock-in-icon.jpg',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: 'com.guaneric.lockin',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/lock-in-icon.jpg',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/lock-in-icon.jpg',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/lock-in-icon.jpg',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      ['expo-notifications', {}],
    ],
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID,
      measurementId: process.env.MEASUREMENT_ID,
      revenueCatIos: process.env.REVENUE_CAT_IOS,
      eas: {
        projectId: 'c8fcdaab-670e-426e-bd69-a1cb2fa30204',
      },
    },
    owner: 'guan-eric',
    experiments: {
      typedRoutes: true,
    },
  },
};
