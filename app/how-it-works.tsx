// app/onboarding/how-it-works.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { State } from 'react-native-gesture-handler';
import ToggleSwitch from '../components/ToggleSwitch';

export default function HowItWorksScreen() {
  const router = useRouter();
  const [sliderComplete, setSliderComplete] = useState(false);
  const translateX = useRef(new RNAnimated.Value(0)).current;

  const handleGestureEvent = RNAnimated.event([{ nativeEvent: { translationX: translateX } }], {
    useNativeDriver: true,
  });

  const handleStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 150) {
        // Completed slide
        RNAnimated.spring(translateX, {
          toValue: 200,
          useNativeDriver: true,
        }).start(() => {
          setSliderComplete(true);
          setTimeout(() => {
            router.push('/notifications');
          }, 500);
        });
      } else {
        // Reset
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
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

        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Text className="text-base font-bold text-primary-500">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Dots */}
      <View className="mt-6 flex-row items-center justify-center gap-2">
        <View className="h-2 w-2 rounded-full bg-slate-300" />
        <View className="h-2 w-2 rounded-full bg-slate-300" />
        <View className="h-2 w-2 rounded-full bg-slate-300" />
        <View className="h-2 w-2 rounded-full bg-primary-500" />
        <View className="h-2 w-2 rounded-full bg-slate-300" />
      </View>

      {/* Content */}
      <View className="flex-1 items-center px-8 pt-12">
        <Text className="mb-3 text-center text-3xl font-bold text-slate-900">Slide to Lock In</Text>
        <Text className="mb-16 text-center text-base text-slate-600">
          Start your focus sessions this way
        </Text>

        {/* Interactive Demo Slider */}
        <View className="mb-16">
          <View className="relative h-20 w-72 items-center justify-center rounded-full bg-primary-100">
            {/* Track arrows */}
            <View className="absolute flex-row">
              <Text className="mx-1 text-2xl text-primary-300">›</Text>
              <Text className="mx-1 text-2xl text-primary-300">›</Text>
              <Text className="mx-1 text-2xl text-primary-300">›</Text>
            </View>

            {/* Slider button */}
            <View className="items-center justify-center">
              {/* Slider Logo */}
              <ToggleSwitch title="→  →  →" onToggle={() => router.push('/notifications')} />
            </View>
          </View>
        </View>

        <Text className="mb-12 text-center text-sm italic text-primary-500">
          👆 Try it! Slide to the right →
        </Text>

        {/* Steps */}
        <View className="w-full">
          <View className="mb-6 flex-row items-start">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Text className="text-lg font-bold text-primary-600">1</Text>
            </View>
            <View className="flex-1 pt-2">
              <Text className="text-base text-slate-900">Slide to start focus</Text>
            </View>
          </View>

          <View className="mb-6 flex-row items-start">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Text className="text-lg font-bold text-primary-600">2</Text>
            </View>
            <View className="flex-1 pt-2">
              <Text className="text-base text-slate-900">Earn XP as you focus</Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Text className="text-lg font-bold text-primary-600">3</Text>
            </View>
            <View className="flex-1 pt-2">
              <Text className="text-base text-slate-900">Level up & unlock badges</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
