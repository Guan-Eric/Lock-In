// app/(tabs)/stats.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect, router } from 'expo-router';
import { AuthService } from '../../../services/authService';
import { UserData } from '../../../types/user';
import { getSessionDataForPeriod } from '../../../services/stats';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';

type TimePeriod = 'week' | 'month' | 'year' | 'all';

export default function StatsScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPro, setHasPro] = useState(false);
  const checkSubscription = async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    if (customerInfo.entitlements.active['Pro']) {
      setHasPro(true);
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      const data = await AuthService.getCurrentUserData();
      setUserData(data);
    };

    checkSubscription();
    fetchUserData();
  }, []);

  useFocusEffect(() => {
    checkSubscription();
  });

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');

  const onRefresh = async () => {
    setRefreshing(true);
    // The AuthContext listener will automatically update userData
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    if (!userData?.uid) return;
    setLoadingChart(true);
    getSessionDataForPeriod(userData.uid, selectedPeriod)
      .then(setChartData)
      .catch((err) => console.error('Error fetching chart data:', err))
      .finally(() => setLoadingChart(false));
  }, [selectedPeriod, userData]);

  const screenWidth = Dimensions.get('window').width;

  // Mock data for charts - replace with real Firebase queries
  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [1.2, 2.5, 1.8, 3.2, 2.1, 2.8, 2.4],
      },
    ],
  };

  const xpData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [45, 80, 65, 95, 70, 85, 75],
      },
    ],
  };

  // Safe access to stats with proper typing
  const stats = userData?.stats || {
    totalMinutes: 0,
    totalSessions: 0,
    longestSession: 0,
    maxSessionsPerDay: 0,
    totalResists: 0,
    questsCompleted: 0,
  };

  const totalHours = ((stats.totalMinutes || 0) / 60).toFixed(1);
  const avgSessionLength =
    (stats.totalSessions || 0) > 0
      ? Math.floor((stats.totalMinutes || 0) / (stats.totalSessions || 1))
      : 0;
  const totalDays = Math.floor((stats.totalMinutes || 0) / 60 / 24);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" style={{ marginBottom: -40 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {/* Header */}
          <View className="px-6 pb-4">
            <Text className="text-2xl font-bold text-slate-900">Your Progress</Text>
          </View>

          {/* Overview Cards */}
          <View className="mb-6 px-6">
            <Text className="mb-3 text-base font-bold text-slate-900">Overview</Text>

            <View className="mb-3 flex-row gap-3">
              {/* Total Focus Time */}
              <View className="flex-1">
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}>
                  <Text className="mb-2 text-xs text-white opacity-90">Total Focus</Text>
                  <Text className="mb-1 text-3xl font-bold text-white">{totalHours}</Text>
                  <Text className="text-xs text-white opacity-80">hours</Text>
                </LinearGradient>
              </View>

              {/* Total Sessions */}
              <View className="flex-1">
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}>
                  <Text className="mb-2 text-xs text-white opacity-90">Sessions</Text>
                  <Text className="mb-1 text-3xl font-bold text-white">
                    {stats.totalSessions || 0}
                  </Text>
                  <Text className="text-xs text-white opacity-80">completed</Text>
                </LinearGradient>
              </View>
            </View>

            <View className="flex-row gap-3">
              {/* Current Streak */}
              <View className="flex-1">
                <LinearGradient
                  colors={['#fbbf24', '#f59e0b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}>
                  <Text className="mb-2 text-xs text-white opacity-90">Current Streak</Text>
                  <Text className="mb-1 text-3xl font-bold text-white">
                    {userData?.streak || 0}
                  </Text>
                  <Text className="text-xs text-white opacity-80">days</Text>
                </LinearGradient>
              </View>

              {/* Average Session */}
              <View className="flex-1">
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}>
                  <Text className="mb-2 text-xs text-white opacity-90">Avg Session</Text>
                  <Text className="mb-1 text-3xl font-bold text-white">{avgSessionLength}</Text>
                  <Text className="text-xs text-white opacity-80">minutes</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
          {/* Period Selector */}
          <View className="mb-6 px-6">
            <Text className="mb-3 text-base font-bold text-slate-900">
              Focus Hours{' '}
              {selectedPeriod === 'week'
                ? 'This Week'
                : selectedPeriod === 'month'
                  ? 'This Month'
                  : selectedPeriod === 'year'
                    ? 'This Year'
                    : 'All Time'}
            </Text>
            <View className="mb-3 flex-row rounded-2xl bg-slate-100 p-1">
              {(['week', 'month', 'year', 'all'] as TimePeriod[]).map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedPeriod(period)}
                  className={`flex-1 rounded-xl py-2 ${selectedPeriod === period ? 'bg-white' : ''}`}
                  activeOpacity={0.7}>
                  <Text
                    className={`text-center text-sm font-bold ${
                      selectedPeriod === period ? 'text-primary-600' : 'text-slate-500'
                    }`}>
                    {period === 'week'
                      ? 'Week'
                      : period === 'month'
                        ? 'Month'
                        : period === 'year'
                          ? 'Year'
                          : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="rounded-2xl bg-slate-50 p-4">
              {loadingChart ? (
                <View className="h-[200px] items-center justify-center">
                  <ActivityIndicator size="large" color="#3b82f6" className="self-center" />
                </View>
              ) : chartData && chartData.labels.length > 0 ? (
                <LineChart
                  data={chartData}
                  width={screenWidth - 80}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: 16 }}
                />
              ) : (
                <Text className="text-center text-slate-400">No session data for this period.</Text>
              )}
            </View>
          </View>

          {/* Detailed Stats */}
          <View className="mb-6 px-6">
            <Text className="mb-3 text-base font-bold text-slate-900">Detailed Stats</Text>

            <View className="rounded-2xl bg-slate-50 p-5">
              {/* Stat Row */}
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="mb-1 text-sm text-slate-600">Longest Session</Text>
                  <Text className="text-xl font-bold text-slate-900">
                    {stats.longestSession || 0} min
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                  <Text className="text-2xl">⏱️</Text>
                </View>
              </View>

              <View className="my-4 border-t border-slate-200" />

              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="mb-1 text-sm text-slate-600">Most Sessions in a Day</Text>
                  <Text className="text-xl font-bold text-slate-900">
                    {stats.maxSessionsPerDay || 0} sessions
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-success-100">
                  <Text className="text-2xl">📅</Text>
                </View>
              </View>

              <View className="my-4 border-t border-slate-200" />

              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="mb-1 text-sm text-slate-600">Total Resists</Text>
                  <Text className="text-xl font-bold text-slate-900">
                    {stats.totalResists || 0} times
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-warning-100">
                  <Text className="text-2xl">🛑</Text>
                </View>
              </View>

              <View className="my-4 border-t border-slate-200" />

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="mb-1 text-sm text-slate-600">Quests Completed</Text>
                  <Text className="text-xl font-bold text-slate-900">
                    {stats.questsCompleted || 0} quests
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-100">
                  <Text className="text-2xl">🎯</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-900">Recent Achievements</Text>
              {/* <TouchableOpacity>
                <Text className="text-sm font-bold text-primary-500">View All</Text>
              </TouchableOpacity> */}
            </View>

            {userData?.badges && userData.badges.length > 0 ? (
              userData.badges.slice(0, 3).map((badge: any, index: number) => (
                <View
                  key={index}
                  className="mb-3 flex-row items-center rounded-2xl bg-slate-50 p-4">
                  <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-warning-100">
                    <Text className="text-3xl">{badge.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 text-base font-bold text-slate-900">{badge.name}</Text>
                    <Text className="text-xs text-slate-600">{badge.description}</Text>
                  </View>
                  {badge.unlockedAt && (
                    <Text className="text-xs text-slate-400">
                      {new Date(badge.unlockedAt.toDate()).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View className="rounded-2xl bg-slate-50 p-6">
                <Text className="text-center text-sm text-slate-500">
                  Complete your first focus session to unlock achievements!
                </Text>
              </View>
            )}
          </View>

          {/* Insights */}
          <View className="mb-24 px-6">
            <Text className="mb-3 text-base font-bold text-slate-900">Insights</Text>

            <View className="rounded-2xl border border-primary-200 bg-primary-50 p-5">
              <Text className="mb-2 text-sm font-bold text-primary-900">📈 You're on fire!</Text>
              <Text className="text-xs leading-5 text-primary-800">
                You're focusing {Number(totalHours) > 10 ? '23%' : '15%'} more than last week. Keep
                this momentum going to reach your goals faster!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      {/* Locked Overlay for Non-Pro Users */}
      {!hasPro && (
        <View className="absolute inset-0 items-center justify-center bg-black/60">
          <View className="mx-8 rounded-3xl bg-white p-8">
            <View className="mb-6 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-warning-100">
                <Text className="text-5xl">🔒</Text>
              </View>
              <Text className="mb-2 text-center text-2xl font-bold text-slate-900">
                Unlock Detailed Stats
              </Text>
              <Text className="text-center text-base text-slate-600">
                Upgrade to Pro to see your complete focus journey, detailed analytics, and advanced
                insights.
              </Text>
            </View>
            <View className="gap-3">
              <View className="flex-row items-center">
                <Text className="mr-3 text-2xl">✓</Text>
                <Text className="text-base text-slate-700">Advanced analytics & trends</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-3 text-2xl">✓</Text>
                <Text className="text-base text-slate-700">Historical data insights</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-3 text-2xl">✓</Text>
                <Text className="text-base text-slate-700">Export progress reports</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(stats)/paywall')}
              activeOpacity={0.9}
              className="mt-6 overflow-hidden rounded-3xl">
              <LinearGradient
                colors={['#fbbf24', '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="">
                <Text className="py-4 text-center text-lg font-bold text-white">
                  Upgrade to Pro
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
