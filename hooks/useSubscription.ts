// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import Purchases from 'react-native-purchases';

export const useSubscription = () => {
  const [hasPro, setHasPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = !!customerInfo.entitlements.active['Pro'];
      setHasPro(isPro);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasPro(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasPro, loading, refetch: checkSubscriptionStatus };
};
