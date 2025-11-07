import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { UserData } from '../../../types/user';
import { AuthService } from '../../../services/authService';
import { RewardService } from '../../../services/rewardSystem';
import { auth } from '../../../firebase';
import { DailyQuest } from '../../../types/rewards';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLevelFromXP } from '../../../utils/levelingSystem';
import Purchases from 'react-native-purchases';

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);

  // Calculate level data from totalXP
  const totalXP = userData?.totalXP || 0;
  const levelData = getLevelFromXP(totalXP);

  const level = levelData.level;
  const title = levelData.title;
  const titleEmoji = levelData.titleEmoji;
  const currentXP = levelData.currentXP;
  const xpToNextLevel = levelData.xpToNextLevel;

  const currentStreak = userData?.streak || 0;
  const screenTimeGoal = userData?.settings?.screenTimeGoal || 3;

  // Real stats from userData
  const stats = userData?.stats || {
    screenTimeToday: 0,
    xpToday: 0,
    sessionsToday: 0,
    totalSessions: 0,
    totalMinutes: 0,
    longestSession: 0,
    maxSessionsPerDay: 0,
    totalResists: 0,
    questsCompleted: 0,
  };

  const screenTimeToday = stats.screenTimeToday || 0;
  const xpToday = stats.xpToday || 0;
  const sessionsToday = stats.sessionsToday || 0;
  const badgesEarned = userData?.badges?.length || 0;

  const screenTimeProgress = (screenTimeToday / screenTimeGoal) * 100;
  const xpProgress = (currentXP / xpToNextLevel) * 100;

  useEffect(() => {
    const fetchDailyQuests = async () => {
      if (!userData) return;

      // Get daily quests
      const quests = await RewardService.generateDailyQuests(auth.currentUser?.uid as string);

      // Check all daily quests and award XP for completed ones
      const results = await Promise.all(
        quests.map((quest) =>
          RewardService.checkDailyQuestCompletion(auth.currentUser?.uid as string, quest.id)
        )
      );

      const incompleteQuests = quests.filter((q) => !q.completed);
      const completeQuests = quests.filter((q) => q.completed);
      const displayQuests = [...incompleteQuests, ...completeQuests];

      setDailyQuests(displayQuests);
    };

    fetchDailyQuests();
  }, [sessionsToday, screenTimeToday, xpToday, currentStreak, screenTimeGoal]);

  const checkSubscription = async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    if (!customerInfo.entitlements.active['Pro']) {
      router.push('/(tabs)/(home)/paywall');
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const fetchUserData = async () => {
    const userData = await AuthService.getCurrentUserData();
    setUserData(userData);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(() => {
    fetchUserData();
  });

  // Animations
  const pulseScale = useSharedValue(1);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 2, stiffness: 100 }),
        withSpring(1, { damping: 2, stiffness: 100 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleStartSession = () => {
    fabScale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    router.push('/(tabs)/(home)/focus-session');
  };

  // Dynamic motivational message
  const getMotivationalMessage = () => {
    if (currentStreak >= 7) {
      return "Amazing! You're on fire with your streak! 🔥";
    } else if (sessionsToday >= 3) {
      return 'Incredible focus today! Keep it up! 💪';
    } else if (xpToday >= 50) {
      return "You're crushing your goals today! 🎯";
    } else if (sessionsToday >= 1) {
      return 'Great start! One more session to build momentum! 🚀';
    } else {
      return 'Ready to start your focus journey today? 🌟';
    }
  };

  // Calculate next milestone
  const getNextMilestone = () => {
    if (currentStreak < 7) return '7 days';
    if (currentStreak < 14) return '14 days';
    if (currentStreak < 30) return '30 days';
    if (currentStreak < 50) return '50 days';
    if (currentStreak < 100) return '100 days';
    return `${Math.ceil(currentStreak / 100) * 100} days`;
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1" style={{ marginBottom: -40 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pb-4">
            <View>
              <Text className="text-2xl font-bold text-slate-900">Welcome back! 👋</Text>
              <Text className="mt-1 text-sm text-slate-600">{getMotivationalMessage()}</Text>
            </View>
          </View>

          {/* Streak Card */}
          <View className="mx-6 mb-5">
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24 }}>
              <View className="relative py-6">
                {/* Background decoration */}
                <View className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white opacity-10" />
                <View className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white opacity-10" />

                {/* Level Badge */}
                <View className="absolute top-4 left-4 rounded-full bg-white/25 px-4 py-1.5">
                  <Text className="text-xs font-bold text-white">
                    Level {level} {titleEmoji}
                  </Text>
                </View>

                {/* Streak Content */}
                <View className="mt-8 items-center">
                  <Text className="mb-1 text-7xl font-bold text-white">{currentStreak}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg text-white opacity-95">Day Streak</Text>
                    <Animated.Text style={pulseStyle} className="text-2xl">
                      🔥
                    </Animated.Text>
                  </View>
                  <Text className="mt-2 text-sm text-white opacity-85">
                    {currentStreak > 0
                      ? `Keep going! Next milestone: ${getNextMilestone()}`
                      : 'Start your streak today!'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Today's Progress Section */}
          <View className="mx-6 mb-4">
            <Text className="mb-3 text-base font-bold text-slate-900">Today's Progress</Text>

            <View className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
              {/* Screen Time Progress */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-slate-700">Screen Time</Text>
                  <Text
                    className={`text-sm font-bold ${
                      screenTimeToday <= screenTimeGoal ? 'text-success-600' : 'text-error-600'
                    }`}>
                    {screenTimeToday.toFixed(1)}h / {screenTimeGoal}h
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <View
                    className={`h-2 rounded-full ${
                      screenTimeToday <= screenTimeGoal ? 'bg-success-500' : 'bg-error-500'
                    }`}
                    style={{ width: `${Math.min(screenTimeProgress, 100)}%` }}
                  />
                </View>
              </View>

              {/* XP Progress */}
              <View className="border-t border-slate-200 pt-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-slate-700">XP Progress</Text>
                  <Text className="text-primary-600 text-sm font-bold">
                    {currentXP} / {xpToNextLevel} XP
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <View
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${xpProgress}%` }}
                  />
                </View>
                <Text className="mt-2 text-xs text-slate-500">+{xpToday} XP earned today</Text>
              </View>
            </View>
          </View>

          {/* Daily Quests Section */}
          <View className="mx-6 mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-900">Daily Quests</Text>
              <Text className="text-xs text-slate-500">
                {dailyQuests.filter((q) => q.completed).length}/{dailyQuests.length} completed
              </Text>
            </View>

            {dailyQuests.length > 0 ? (
              dailyQuests.map((quest) => (
                <View
                  key={quest.id}
                  className={`flex-row items-center rounded-xl p-4 ${
                    quest.completed
                      ? 'border-primary-200 bg-primary-50 mb-3 border-2'
                      : 'mb-3 border-2 border-slate-200 bg-slate-50'
                  }`}>
                  {/* Checkbox */}
                  <View
                    className={`mr-3 h-6 w-6 items-center justify-center rounded-full ${
                      quest.completed
                        ? 'border-success-600 bg-success-500 border-2'
                        : 'border-2 border-slate-300 bg-white'
                    }`}>
                    {quest.completed && <Text className="text-xs font-bold text-white">✓</Text>}
                  </View>

                  {/* Quest Info */}
                  <View className="flex-1">
                    <Text
                      className={`mb-1 text-sm ${
                        quest.completed ? 'text-primary-900 line-through' : 'text-slate-900'
                      }`}>
                      {quest.title}
                    </Text>

                    {/* Progress bar for incomplete quests */}
                    {!quest.completed && quest.progress !== undefined && (
                      <View className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                        <View
                          className="bg-primary-400 h-1 rounded-full"
                          style={{ width: `${Math.min(quest.progress, 100)}%` }}
                        />
                      </View>
                    )}
                  </View>

                  {/* XP Badge */}
                  <View className={`ml-3 ${quest.completed ? 'opacity-60' : ''}`}>
                    <Text
                      className={`text-xs font-bold ${
                        quest.completed ? 'text-success-600' : 'text-slate-600'
                      }`}>
                      {quest.completed ? '✓ ' : ''}+{quest.xpReward} XP
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6">
                <Text className="text-center text-sm text-slate-600">
                  Complete your first session to unlock daily quests!
                </Text>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View className="mx-6 mb-4">
            <View className="border-warning-200 bg-warning-50 rounded-2xl border p-4">
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-warning-900 mb-1 text-xs">
                    🎯 {sessionsToday} sessions today
                  </Text>
                  <Text className="text-warning-900 text-xs">🏆 {badgesEarned} badges earned</Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-warning-900 mb-1 text-xs">⚡ {totalXP} total XP</Text>
                  <Text className="text-warning-900 text-xs">📈 Level {level}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Dynamic Tip */}
          <View className="mx-6 mb-4">
            <View className="border-primary-200 bg-primary-50 rounded-2xl border p-4">
              <Text className="text-primary-900 mb-1 text-xs font-bold">💡 Tip of the Day</Text>
              <Text className="text-primary-800 text-xs leading-5">
                {sessionsToday === 0
                  ? 'The first 30 minutes after waking up are crucial. Keep your phone away and start your day with intention.'
                  : 'Great job on your sessions! Remember to take short breaks between focus periods to maintain peak performance.'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          fabStyle,
          {
            position: 'absolute',
            bottom: 30,
            right: 24,
            width: 70,
            height: 70,
            borderRadius: 35,
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}>
        <TouchableOpacity
          onPress={handleStartSession}
          activeOpacity={0.9}
          style={{ width: '100%', height: '100%' }}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 35,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text className="text-3xl text-white">▶</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
