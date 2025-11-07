import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import { UserData } from '../../../types/user';
import { auth, db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getLevelFromXP } from '../../../utils/levelingSystem';
import { RewardService } from '../../../services/rewardSystem';
import { Badge } from '../../../types/rewards';

type MoodRating = 'hard' | 'okay' | 'good' | 'amazing';

export default function SessionComplete() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const { duration } = useLocalSearchParams<{
    duration: string;
  }>();

  const [selectedMood, setSelectedMood] = useState<MoodRating | 'none'>('none');
  const [sessionSaved, setSessionSaved] = useState(false);
  const [moodUpdating, setMoodUpdating] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [badgesEarned, setBadgesEarned] = useState<Badge[]>([]);
  // Animation values
  const celebrationScale = useSharedValue(0);
  const xpScale = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // Load user data and save session immediately
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to user data updates
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const levelData = getLevelFromXP(data.totalXP || 0);

          setUserData({
            uid: user.uid,
            isAnonymous: user.isAnonymous,
            email: user.email || undefined,
            ...data,
            ...levelData,
          } as UserData);
        }
        setLoading(false);
      },
      (error) => {
        console.log('Firestore listener error:', error.code);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Auto-save session on mount (without mood)
  useEffect(() => {
    const saveInitialSession = async () => {
      if (!user || sessionSaved) return;

      try {
        // Save session without mood initially
        const { xpAwarded, badgesEarned, sessionId } = await RewardService.recordSession(
          user.uid,
          Number(duration)
        );
        setXpEarned(xpAwarded);
        setSessionId(sessionId);
        setBadgesEarned(badgesEarned);
        setSessionSaved(true);

        // Trigger haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Start animations
        celebrationScale.value = withSequence(withSpring(1.5), withSpring(1));
        xpScale.value = withDelay(300, withSequence(withSpring(1.1), withSpring(1)));
      } catch (error) {
        console.error('Error saving session:', error);
        Alert.alert('Error', 'Failed to save session');
      }
    };

    saveInitialSession();
  }, [user, duration]);

  // Animate progress bar when userData loads
  useEffect(() => {
    if (userData && progressPercent > 0) {
      progressWidth.value = withDelay(
        600,
        withTiming(progressPercent, { duration: 1000, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [userData]);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const xpCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleMoodSelect = async (mood: MoodRating) => {
    if (!user || moodUpdating) return;

    setSelectedMood(mood);
    setMoodUpdating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      RewardService.updateSession(user.uid, sessionId, mood);
    } catch (error) {
      console.error('Error updating mood:', error);
    } finally {
      setMoodUpdating(false);
    }
  };

  const handleDone = () => {
    router.push('/(tabs)/(home)/home');
    router.push('/(tabs)/(home)/paywall');
  };

  const handleStartAnother = () => {
    router.push('/(tabs)/(home)/focus-session');
  };

  const totalXP = Number(xpEarned || 0);
  const bonusXP = totalXP * RewardService.getStreakMultiplier(userData?.streak || 0);
  const currentLevel = userData?.level ?? 1;
  const currentXP = userData?.currentXP ?? 0;
  const nextLevelXP = userData?.xpToNextLevel ?? 1;
  const progressPercent = Math.floor((currentXP / nextLevelXP) * 100);

  const moods: Array<{
    id: MoodRating;
    emoji: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }> = [
    {
      id: 'hard',
      emoji: '😫',
      color: '#92400e',
      bgColor: '#fef3c7',
      borderColor: '#fbbf24',
    },
    {
      id: 'okay',
      emoji: '😐',
      color: '#92400e',
      bgColor: '#fef3c7',
      borderColor: '#fbbf24',
    },
    {
      id: 'good',
      emoji: '😊',
      color: '#92400e',
      bgColor: '#fef3c7',
      borderColor: '#fbbf24',
    },
    {
      id: 'amazing',
      emoji: '🔥',
      color: '#92400e',
      bgColor: '#fef3c7',
      borderColor: '#fbbf24',
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-600">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} autoStart={true} fadeOut={true} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* Celebration Section */}
        <View className="items-center pb-8 pt-16">
          <Animated.View style={celebrationStyle}>
            <Text className="mb-4 text-6xl">🎉</Text>
          </Animated.View>

          <Text className="mb-2 text-3xl font-bold text-slate-900">Great Focus!</Text>
          <Text className="text-sm text-slate-600">
            You completed {duration} minutes of deep work
          </Text>
          {sessionSaved && (
            <View className="mt-2 rounded-full bg-success-100 px-3 py-1">
              <Text className="text-xs text-success-700">✓ Session saved</Text>
            </View>
          )}
        </View>

        {/* Rewards Card */}
        <Animated.View style={xpCardStyle} className="mx-6 mb-5">
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24 }}>
            <View className="rounded-3xl py-6">
              {/* Background decoration */}
              <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white opacity-10" />
              <View className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white opacity-10" />

              <Text className="mb-2 text-center text-base text-white opacity-90">
                Rewards Earned
              </Text>
              <Text className="mb-2 text-center text-6xl font-bold text-white">+{totalXP} XP</Text>

              {userData && userData.streak > 7 ? (
                <Text className="mt-2 text-center text-sm text-white opacity-85">
                  +{Math.floor(bonusXP - totalXP)} bonus ({userData.streak}-day streak active!) 🔥
                </Text>
              ) : null}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Progress to Next Level */}
        <View className="mx-6 mb-6 rounded-2xl border-2 border-primary-200 bg-primary-50 p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm text-primary-900">Level {currentLevel} Progress</Text>
            <Text className="text-sm font-bold text-primary-600">
              {currentXP}/{nextLevelXP}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-3 overflow-hidden rounded-full bg-primary-200">
            <Animated.View style={progressStyle} className="h-3 rounded-full bg-primary-500" />
          </View>

          <Text className="mt-3 text-center text-xs text-primary-900">
            {nextLevelXP - currentXP} XP to Level {currentLevel + 1}! 🎯
          </Text>
        </View>

        {/* Mood Check */}
        <View className="mx-6 mb-6">
          <Text className="mb-4 text-center text-base font-bold text-slate-900">
            How did you feel?
          </Text>

          <View className="flex-row justify-between">
            {moods.map((mood) => {
              const isSelected = selectedMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => handleMoodSelect(mood.id)}
                  activeOpacity={0.7}
                  disabled={moodUpdating}
                  className="items-center">
                  <View
                    className={`h-16 w-16 items-center justify-center rounded-full ${
                      isSelected ? 'border-4' : 'border-2'
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#dcfce7' : mood.bgColor,
                      borderColor: isSelected ? '#22c55e' : mood.borderColor,
                    }}>
                    <Text className="text-4xl">{mood.emoji}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedMood !== 'none' && (
            <View className="mt-2 items-center">
              <Text className="text-xs text-slate-500">✓ Mood recorded</Text>
            </View>
          )}
        </View>

        {/* Insights Card (if mood selected) */}
        {selectedMood !== 'none' && (
          <View className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Text className="mb-2 text-sm font-bold text-slate-900">💡 Keep it up!</Text>
            <Text className="text-xs leading-5 text-slate-600">
              {selectedMood === 'hard' &&
                "Don't worry! Focus gets easier with practice. Try shorter sessions next time."}
              {selectedMood === 'okay' &&
                "Good effort! You're building the habit. Consistency is key."}
              {selectedMood === 'good' &&
                "Excellent! You're in the zone. Keep this momentum going."}
              {selectedMood === 'amazing' &&
                "You're on fire! 🔥 This is flow state. Try extending your sessions."}
            </Text>
          </View>
        )}

        {/* Quick Stats */}
        <View className="mx-6 mb-6 flex-row gap-3">
          <View className="flex-1 items-center rounded-xl border border-primary-100 bg-primary-50 p-4">
            <Text className="mb-1 text-xs text-primary-600">Sessions Today</Text>
            <Text className="text-2xl font-bold text-primary-900">
              {userData?.stats?.sessionsToday || 0}
            </Text>
          </View>

          <View className="flex-1 items-center rounded-xl border border-success-100 bg-success-50 p-4">
            <Text className="mb-1 text-xs text-success-600">Total Time</Text>
            <Text className="text-2xl font-bold text-success-900">
              {((userData?.stats?.totalMinutes || 0) / 60).toFixed(1)} h
            </Text>
          </View>

          <View className="flex-1 items-center rounded-xl border border-warning-100 bg-warning-50 p-4">
            <Text className="mb-1 text-xs text-warning-600">Streak</Text>
            <Text className="text-2xl font-bold text-warning-900">{userData?.streak || 0} d</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-6 pb-8 pt-4">
        <TouchableOpacity
          onPress={handleDone}
          className="mb-3 h-14 items-center justify-center rounded-[28px] bg-primary-500"
          activeOpacity={0.8}>
          <Text className="text-lg font-bold text-white">Done</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleStartAnother} activeOpacity={0.7}>
          <Text className="text-center text-sm font-bold text-primary-500">
            Start Another Session →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
