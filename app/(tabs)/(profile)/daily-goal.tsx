// app/onboarding/set-goal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { UserData } from '../../../types/user';
import { AuthService } from '../../../services/authService';

export default function DailyGoalScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [screenTimeGoal, setScreenTimeGoal] = useState<number>(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const data = (await AuthService.getCurrentUserData()) as UserData;
        setScreenTimeGoal(data.settings.screenTimeGoal);
      }
    };
    fetchUserData();
  }, []);

  const handleContinue = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Save the screen time goal
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.screenTimeGoal': screenTimeGoal,
      });

      router.back();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-16">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center">
          <Text className="text-2xl text-slate-600">←</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 px-8 pt-12">
        <Text className="mb-3 text-center text-3xl font-bold text-slate-900">
          What's your goal?
        </Text>
        <Text className="mb-12 text-center text-base text-slate-600">
          Set your daily screen time target
        </Text>

        {/* Big Number Display */}
        <View className="mb-16 items-center">
          <Text className="text-8xl font-bold text-primary-500">{screenTimeGoal}</Text>
          <Text className="mt-2 text-xl text-slate-600">hours per day</Text>
        </View>

        {/* Slider */}
        <View className="mb-12">
          <Slider
            minimumValue={1}
            maximumValue={6}
            step={0.5}
            value={screenTimeGoal}
            onValueChange={setScreenTimeGoal}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#e2e8f0"
            thumbTintColor="#3b82f6"
          />
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-400">1h</Text>
            <Text className="text-sm text-slate-400">6h</Text>
          </View>
        </View>

        {/* Info Card */}
        <View className="rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <Text className="mb-2 text-center text-sm text-primary-900">💡 Recommended Goal</Text>
          <Text className="text-center text-xs leading-5 text-primary-800">
            Average phone usage is 3.5 hours. Starting with {screenTimeGoal ?? 0} hours is{' '}
            {(screenTimeGoal ?? 0) <= 2.5 ? 'ambitious but achievable!' : 'a good starting point!'}
          </Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-8 pb-12">
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.9}
          className="overflow-hidden rounded-[30px] shadow-lg">
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 20 }}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-lg font-bold text-white">Save</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
