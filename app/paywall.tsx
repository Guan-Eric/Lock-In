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
import { LinearGradient } from 'expo-linear-gradient';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { completeOnboarding } from '../utils/onboarding';
import { auth } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function PaywallScreen() {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'weekly' | 'annual'>('annual');

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
      // Assuming 'weekly' maps to weekly and 'annual' maps to annual package in RevenueCat dashboard.
      const packageToPurchase =
        selectedPackage === 'weekly'
          ? offering?.availablePackages.find((p) => p.packageType === 'WEEKLY')
          : offering?.availablePackages.find((p) => p.packageType === 'ANNUAL');
      if (packageToPurchase) {
        const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

        if (customerInfo.entitlements.active['Pro']) {
          // User is now premium
          completeOnboarding(auth.currentUser?.uid as string);
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

  const weeklyPackage = offering?.availablePackages.find((p) => p.packageType === 'WEEKLY');
  const annualPackage = offering?.availablePackages.find((p) => p.packageType === 'ANNUAL');

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
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}>
          {/* Close Button */}
          <View className="flex-row justify-end px-6 pt-6">
            <TouchableOpacity
              onPress={() => completeOnboarding(auth.currentUser?.uid as string)}
              className="h-10 w-10 items-center justify-center">
              <Text className="text-2xl text-slate-600">✕</Text>
            </TouchableOpacity>
          </View>
          {/* Header */}
          <View className="items-center px-8 pb-12">
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
                      <Text className="text-xs font-bold text-white">BEST VALUE</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-slate-600">Just $2.08/month • Cancel anytime</Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-2xl font-bold ${
                      selectedPackage === 'annual' ? 'text-primary-600' : 'text-slate-900'
                    }`}>
                    {annualPackage?.product.priceString ?? '$24.99'}
                  </Text>
                  <Text className="text-xs text-slate-500">per year</Text>
                </View>
              </View>
              <View className="rounded-lg bg-white/50 px-3 py-2">
                <Text className="text-center text-xs text-slate-600">Save 52% vs weekly</Text>
              </View>
            </TouchableOpacity>

            {/* Weekly Plan with 3-day free trial */}
            <TouchableOpacity
              onPress={() => setSelectedPackage('weekly')}
              activeOpacity={0.7}
              className={`rounded-2xl border-2 p-5 ${
                selectedPackage === 'weekly'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 bg-slate-50'
              }`}>
              <View className="flex-row items-center justify-between">
                <View>
                  <View className="mb-1 flex-row items-center gap-2">
                    <Text
                      className={`text-lg font-bold ${
                        selectedPackage === 'weekly' ? 'text-primary-900' : 'text-slate-900'
                      }`}>
                      Weekly Plan
                    </Text>
                    <View className="rounded-full bg-indigo-500 px-2 py-1">
                      <Text className="text-xs font-bold text-white">3-day Free Trial</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-slate-600">Flexible • Cancel anytime</Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-2xl font-bold ${
                      selectedPackage === 'weekly' ? 'text-primary-600' : 'text-slate-900'
                    }`}>
                    {weeklyPackage?.product.priceString ?? '$3.99'}
                  </Text>
                  <Text className="text-xs text-slate-500">per week</Text>
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
              3-day free trial on weekly plan. Subscription renews automatically. Cancel anytime
              from your account settings. By subscribing, you agree to our
              <Text className="text-primary-500 underline"> Terms of Service</Text> and
              <Text className="text-primary-500 underline"> Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
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
                Start {selectedPackage === 'annual' ? 'Annual' : 'Weekly'} Plan
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
