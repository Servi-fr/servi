import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  AccessibilityInfo,
  Pressable as RNPressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// ----------------------------------------------------------------------------
// Primitives de motion — courbe physique commune (masse + ressort) et respect
// du réglage système « Réduire les animations ».
// ----------------------------------------------------------------------------

const BEZIER = Easing.bezier(0.32, 0.72, 0, 1);

// Réglage système : réduire les animations.
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => active && setReduce(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

// Remplaçant direct de Pressable : retour tactile physique (échelle 0,97 au
// press, ressort au relâchement). API identique — s'importe à la place de
// celui de react-native.
export function Pressable({ style, onPressIn, onPressOut, ...props }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        Animated.timing(scale, { toValue: 0.97, duration: 90, easing: BEZIER, useNativeDriver: true }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, { toValue: 1, stiffness: 320, damping: 22, mass: 0.7, useNativeDriver: true }).start();
        onPressOut?.(e);
      }}
      style={[style as StyleProp<ViewStyle>, { transform: [{ scale }] }]}
    />
  );
}

// Entrée chorégraphiée : fondu + translation vers le haut, décalable (stagger).
// Statique si « Réduire les animations » est actif.
export function FadeInUp({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(14)).current;
  const played = useRef(false);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    if (reduce) {
      opacity.setValue(1);
      ty.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, delay, easing: BEZIER, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 520, delay, easing: BEZIER, useNativeDriver: true }),
    ]).start();
  }, [reduce]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY: ty }] }]}>{children}</Animated.View>;
}
