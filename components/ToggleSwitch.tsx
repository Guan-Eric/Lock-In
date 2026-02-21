import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

const BUTTON_WIDTH = 300;
const BUTTON_HEIGHT = 80;
const BUTTON_PADDING = 10;
const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * BUTTON_PADDING;

const H_WAVE_RANGE = SWIPEABLE_DIMENSIONS + 2 * BUTTON_PADDING;
const H_SWIPE_RANGE = BUTTON_WIDTH - 2 * BUTTON_PADDING - SWIPEABLE_DIMENSIONS;

// Use Animated wrapper for gradient
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SwipeButtonProps {
  onToggle?: (isToggled: boolean) => void;
  title: string;
}

const ToggleSwitch: React.FC<SwipeButtonProps> = ({ onToggle, title }) => {
  const X = useSharedValue(0);
  const start = useSharedValue(0);
  const [toggled, setToggled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setToggled(false);
      X.value = 0;
    }, [])
  );

  const handleComplete = async (isToggled: boolean) => {
    if (isToggled !== toggled) {
      setToggled(isToggled);
      await new Promise((resolve) => setTimeout(resolve, 500));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onToggle?.(isToggled);
    }
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = X.value;













    })
    .onUpdate((event) => {
      const newValue = start.value + event.translationX;
      X.value = Math.min(Math.max(newValue, 0), H_SWIPE_RANGE);
    })
    .onEnd(() => {
      const shouldToggleOff = X.value < H_SWIPE_RANGE / 2;
      X.value = withSpring(shouldToggleOff ? 0 : H_SWIPE_RANGE);
      runOnJS(handleComplete)(!shouldToggleOff);
    });

  const InterpolateXInput = [0, H_SWIPE_RANGE];

  const AnimatedStyles = {
    colorWave: useAnimatedStyle(() => ({
      width: H_WAVE_RANGE + X.value,
      opacity: interpolate(X.value, InterpolateXInput, [0, 1]),
    })),
    swipeable: useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(X.value, [0, H_SWIPE_RANGE], ['#3b82f6', '#e0f2fe']),
      transform: [{ translateX: X.value }],
    })),
    swipeText: useAnimatedStyle(() => ({
      opacity: interpolate(X.value, InterpolateXInput, [1, 0], Extrapolate.CLAMP),
      transform: [
        {
          translateX: interpolate(
            X.value,
            InterpolateXInput,
            [0, BUTTON_WIDTH / 2 - SWIPEABLE_DIMENSIONS],
            Extrapolate.CLAMP
          ),
        },
      ],
    })),
  };

  return (
    <Animated.View style={styles.swipeCont}>
      {/* Gradient background wave */}
      <AnimatedLinearGradient
        style={[AnimatedStyles.colorWave, styles.colorWave]}
        colors={['#3b82f6', '#2563eb']}
        start={{ x: 0.0, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Swipeable circle */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.swipeable,
            AnimatedStyles.swipeable,
            { justifyContent: 'center', alignItems: 'center' },
          ]}>
          <Animated.Image
            source={
              toggled
                ? require('../assets/locked-icon.png')
                : require('../assets/unlocked-icon.png')
            }
            style={{
              tintColor: toggled ? '#3b82f6' : '#ffffff',
              width: 40,
              height: 40,
              zIndex: 4,
            }}
          />
        </Animated.View>
      </GestureDetector>

      {/* Swipe text */}
      <Animated.Text style={[styles.swipeText, AnimatedStyles.swipeText]}>{title}</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  swipeCont: {
    height: BUTTON_HEIGHT,
    width: BUTTON_WIDTH,
    backgroundColor: '#e0f2fe',
    borderRadius: BUTTON_HEIGHT,
    padding: BUTTON_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    borderColor: '#3b82f6',
    borderWidth: 4,
  },
  colorWave: {
    position: 'absolute',
    left: 0,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT,
  },
  swipeable: {
    position: 'absolute',
    left: BUTTON_PADDING,
    height: SWIPEABLE_DIMENSIONS,
    width: SWIPEABLE_DIMENSIONS,
    borderRadius: SWIPEABLE_DIMENSIONS,
    zIndex: 3,
    backgroundColor: '#3b82f6',
  },
  swipeText: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 2,
    marginLeft: 20,
    color: '#3b82f6',
  },
});

export default ToggleSwitch;