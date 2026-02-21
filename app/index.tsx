// app/index.tsx
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

function Index() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkFirstLaunch = async () => {
    try {
      // Wait for auth to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      onAuthStateChanged(auth, async (user) => {
        try {
          if (!user) {
            router.replace('/welcome');
            setLoading(false);
            return;
          }

          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            router.replace('/set-goal');
            setLoading(false);
            return;
          }

          const userData = userDoc.data();

          if (!userData.onboardingCompleted) {
            router.replace('/set-goal');
            setLoading(false);
            return;
          }

          // Check subscription with error handling
          try {
            const customerInfo = await Purchases.getCustomerInfo();
            if (customerInfo.entitlements.active['Pro']) {
              router.replace('/(tabs)/(home)/home');
            } else {
              router.replace('/paywall');
            }
          } catch (revenueCatError) {
            console.error('RevenueCat error, proceeding to home:', revenueCatError);
            // If RevenueCat fails, just go to home
            router.replace('/(tabs)/(home)/home');
          }

          setLoading(false);
        } catch (error) {
          console.error('Error in auth state change:', error);
          setError('Failed to load app');
          router.replace('/welcome');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Critical error in checkFirstLaunch:', error);
      setError('Failed to initialize app');
      router.replace('/welcome');
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize RevenueCat with error handling
        const apiKey = Constants.expoConfig?.extra?.revenueCatIos;
        if (apiKey) {
          try {
            Purchases.configure({ apiKey });
            console.log('RevenueCat configured successfully');
          } catch (rcError) {
            console.error('RevenueCat configuration error:', rcError);
            // Continue without RevenueCat
          }
        }

        // Small delay to ensure native modules are ready
        await new Promise((resolve) => setTimeout(resolve, 200));

        await checkFirstLaunch();
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to start app');
        // Fallback to welcome screen
        router.replace('/welcome');
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return null;
}

export default Index;