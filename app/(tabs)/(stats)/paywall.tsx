// app/paywall.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases, { PurchasesOffering } from 'react-native-purchases';

export default function PaywallScreen() {
  const router = useRouter();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOffering(offerings.current);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!offering) return;

    setPurchasing(true);
    try {
      const packageToPurchase = selectedPackage === 'monthly' ? offering.monthly : offering.annual;

      if (packageToPurchase) {
        const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

        if (customerInfo.entitlements.active['Pro']) {
          // User is now premium
          router.back();
        }
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const premiumFeatures = [
    { icon: '⚡', title: 'Custom Timers', description: 'Set any duration from 5-180 minutes' },
    { icon: '📊', title: 'Advanced Analytics', description: 'Detailed insights and trends' },
    { icon: '🎨', title: 'Premium Themes', description: 'Exclusive avatars and worlds' },
    { icon: '🛡️', title: 'Extra Shields', description: 'Craft unlimited streak shields' },
    { icon: '🎯', title: 'Custom Challenges', description: 'Create your own daily quests' },
    { icon: '🔔', title: 'Smart Reminders', description: 'AI-powered notification timing' },
  ];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}>
        {/* Close Button */}
        <View className="flex-row justify-end px-6 pt-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center">
            <Text className="text-2xl text-slate-600">✕</Text>
          </TouchableOpacity>
        </View>
        {/* Header */}
        <View className="items-center px-8 pb-12 pt-8">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-warning-100">
            <Text className="text-6xl">⭐</Text>
          </View>

          <Text className="mb-3 text-center text-4xl font-bold text-slate-900">Go Premium</Text>
          <Text className="text-center text-base text-slate-600">Unlock your full potential</Text>
        </View>

        {/* Features Grid */}
        <View className="mb-8 px-6">
          {premiumFeatures.map((feature, index) => (
            <View key={index} className="mb-5 flex-row items-start">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <Text className="text-2xl">{feature.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-base font-bold text-slate-900">{feature.title}</Text>
                <Text className="text-sm text-slate-600">{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <View className="mb-8 px-6">
          <Text className="mb-4 text-center text-lg font-bold text-slate-900">
            Choose Your Plan
          </Text>

          {/* Annual Plan - Best Value */}
          <TouchableOpacity
            onPress={() => setSelectedPackage('annual')}
            activeOpacity={0.7}
            className={`mb-4 rounded-2xl border-2 p-5 ${
              selectedPackage === 'annual'
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 bg-slate-50'
            }`}>
            <View className="mb-2 flex-row items-center justify-between">
              <View>
                <View className="mb-1 flex-row items-center gap-2">
                  <Text
                    className={`text-lg font-bold ${
                      selectedPackage === 'annual' ? 'text-primary-900' : 'text-slate-900'
                    }`}>
                    Annual Plan
                  </Text>
                  <View className="rounded-full bg-success-500 px-2 py-1">
                    <Text className="text-xs font-bold text-white">SAVE 33%</Text>
                  </View>
                </View>
                <Text className="text-sm text-slate-600">Best value • Cancel anytime</Text>
              </View>
              <View className="items-end">
                <Text
                  className={`text-2xl font-bold ${
                    selectedPackage === 'annual' ? 'text-primary-600' : 'text-slate-900'
                  }`}>
                  $39.99
                </Text>
                <Text className="text-xs text-slate-500">per year</Text>
              </View>
            </View>
            <View className="rounded-lg bg-white/50 px-3 py-2">
              <Text className="text-center text-xs text-slate-600">
                Just $3.33/month • Save $20 vs monthly
              </Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPackage('monthly')}
            activeOpacity={0.7}
            className={`rounded-2xl border-2 p-5 ${
              selectedPackage === 'monthly'
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 bg-slate-50'
            }`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className={`mb-1 text-lg font-bold ${
                    selectedPackage === 'monthly' ? 'text-primary-900' : 'text-slate-900'
                  }`}>
                  Monthly Plan
                </Text>
                <Text className="text-sm text-slate-600">Flexible • Cancel anytime</Text>
              </View>
              <View className="items-end">
                <Text
                  className={`text-2xl font-bold ${
                    selectedPackage === 'monthly' ? 'text-primary-600' : 'text-slate-900'
                  }`}>
                  $4.99
                </Text>
                <Text className="text-xs text-slate-500">per month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Social Proof */}
        <View className="mb-8 px-6">
          <View className="rounded-2xl border border-success-200 bg-success-50 p-5">
            <View className="mb-3 flex-row items-center justify-center">
              <Text className="mr-2 text-2xl">⭐</Text>
              <Text className="mr-2 text-2xl">⭐</Text>
              <Text className="mr-2 text-2xl">⭐</Text>
              <Text className="mr-2 text-2xl">⭐</Text>
              <Text className="text-2xl">⭐</Text>
            </View>
            <Text className="mb-2 text-center text-sm font-bold text-success-900">
              "Game-changer for my productivity!"
            </Text>
            <Text className="text-center text-xs text-success-800">
              Over 10,000 people are already locking in with premium
            </Text>
          </View>
        </View>
        {/* Terms */}
        <View className="px-6">
          <Text className="text-center text-xs leading-5 text-slate-400">
            Subscription renews automatically. Cancel anytime from your account settings. By
            subscribing, you agree to our{' '}
            <Text className="text-primary-500 underline">Terms of Service</Text> and{' '}
            <Text className="text-primary-500 underline">Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-6 pb-8 pt-4">
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.9}
          className="overflow-hidden rounded-[30px] shadow-lg">
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 20 }}>
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-lg font-bold text-white">
                Start {selectedPackage === 'annual' ? 'Annual' : 'Monthly'} Plan
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
