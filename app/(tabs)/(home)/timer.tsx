import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import ExitButton from '../../../components/ExitButton';
import { getStreakMultiplier } from '../../../utils/xpSystem';
import { UserData } from '../../../types/user';
import { AuthService } from '../../../services/authService';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TIMER_CIRCLE_RADIUS = 110;
const TIMER_CIRCLE_STROKE_WIDTH = 14;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * TIMER_CIRCLE_RADIUS;

export default function ActiveSession() {
  const router = useRouter();
  const { duration } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const totalSeconds = Number(duration) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [xpEarned, setXpEarned] = useState(0);

  // Fix: Use NodeJS.Timeout type for intervalRef
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const progress = useSharedValue(1);

  useEffect(() => {
    const fetchData = async () => {
      const userData = await AuthService.getCurrentUserData();
      setUserData(userData);
    };
    fetchData();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Fix: Check if intervalRef.current is not null before clearing
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
          }
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      // Fix: Check if intervalRef.current is not null before clearing
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const newProgress = timeLeft / totalSeconds;
    progress.value = withTiming(newProgress, {
      duration: 1000,
      easing: Easing.linear,
    });

    const streak = userData?.streak || 0;
    const baseXP = Number(duration) * 2;
    const multiplier = getStreakMultiplier(streak);
    const earnedSoFar = Math.floor((1 - newProgress) * baseXP * multiplier);
    setXpEarned(earnedSoFar);
  }, [timeLeft, userData]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const handleSessionComplete = () => {
    const streak = userData?.streak || 0;
    const baseXP = Number(duration) * 2;
    const multiplier = getStreakMultiplier(streak);
    const totalXP = Math.floor(baseXP * multiplier);

    router.replace({
      pathname: '/(tabs)/(home)/session-complete',
      params: {
        duration,
        xpEarned: totalXP,
      },
    });
  };

  const handleGiveUp = () => {
    Alert.alert('⚠️ Give Up?', "You won't gain XP and you will lose your progress. Are you sure?", [
      {
        text: 'Keep Going',
        style: 'cancel',
      },
      {
        text: 'Give Up',
        style: 'destructive',
        onPress: () => {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
          }
          router.replace('/(tabs)/(home)/home');
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-dark-bg flex-1">
      <StatusBar barStyle="light-content" />

      {/* Header with exit button */}
      <View className="flex-row items-center px-6 pt-12">
        <ExitButton onPress={handleGiveUp} />
      </View>

      {/* Timer Circle */}
      <View className="flex-1 items-center justify-center">
        <View className="items-center justify-center">
          <Svg
            width={TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH}
            height={TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH}>
            {/* Background circle */}
            <Circle
              cx={(TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH) / 2}
              cy={(TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH) / 2}
              r={TIMER_CIRCLE_RADIUS}
              stroke="#334155"
              strokeWidth={TIMER_CIRCLE_STROKE_WIDTH}
              fill="transparent"
            />

            {/* Progress circle */}
            <AnimatedCircle
              cx={(TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH) / 2}
              cy={(TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH) / 2}
              r={TIMER_CIRCLE_RADIUS}
              stroke="#10b981"
              strokeWidth={TIMER_CIRCLE_STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeLinecap="round"
              animatedProps={animatedProps}
              rotation="-90"
              origin={`${(TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH) / 2}, ${(TIMER_CIRCLE_RADIUS * 2 + TIMER_CIRCLE_STROKE_WIDTH) / 2}`}
            />
          </Svg>

          {/* Time display */}
          <View className="absolute items-center justify-center">
            <Text className="text-7xl font-bold text-white">{formatTime(timeLeft)}</Text>
            <Text className="text-dark-text-secondary mt-2 text-sm">remaining</Text>
          </View>
        </View>
      </View>

      {/* Motivational Quote */}
      <View className="bg-dark-surface mx-6 mb-6 rounded-2xl p-5">
        <Text className="text-dark-text-secondary text-center text-xs leading-5 italic">
          "Focus is the gateway to thinking clearly, learning quickly, and producing great results."
        </Text>
      </View>

      {/* Stats Row */}
      <View className="mx-6 mb-6 flex-row gap-4">
        {/* XP Earning */}
        <View className="bg-dark-surface flex-1 items-center rounded-xl p-4">
          <Text className="text-dark-text-secondary mb-2 text-xs">XP Earning</Text>
          <Text className="text-success-500 text-xl font-bold">+{xpEarned}</Text>
        </View>

        {/* Sessions Today */}
        <View className="bg-dark-surface flex-1 items-center rounded-xl p-4">
          <Text className="text-dark-text-secondary mb-2 text-xs">Sessions Today</Text>
          <Text className="text-primary-400 text-xl font-bold">
            {userData?.stats?.sessionsToday || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}
