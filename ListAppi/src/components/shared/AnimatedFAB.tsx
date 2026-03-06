// src/components/shared/AnimatedFAB.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton } from '../common/AppButton';

interface AnimatedFABProps {
  onPress: () => void;
  label: string;
  animate?: boolean;
}

export const AnimatedFAB: React.FC<AnimatedFABProps> = ({ onPress, label, animate = true }) => {
  const theme = useTheme();
  const positionAnim = useRef(new Animated.Value(0)).current;
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (!animate) return;
    
    // Pidetään label näkyvissä hetki ja kutistetaan sitten
    const timer = setTimeout(() => {
      Animated.timing(positionAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false, // Width ja Margin vaativat false
      }).start(() => setAnimationComplete(true));
    }, 5000); // 5 sekuntia on yleensä hyvä aika lukea teksti

    return () => clearTimeout(timer);
  }, [animate]);

  // Animaatioarvot (pidetään ennallaan, mutta siivotaan)
  const buttonWidth = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [180, 60],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ width: buttonWidth, opacity: positionAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
        {!animationComplete && (
          <AppButton 
            onPress={onPress} 
            label={label} 
            icon="plus" 
            style={{ backgroundColor: theme.colors.primary }} 
          />
        )}
      </Animated.View>

      <Animated.View style={[styles.compactPosition, { opacity: positionAnim }]}>
        <TouchableOpacity
          onPress={onPress}
          style={[styles.circle, { backgroundColor: theme.colors.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
  },
  compactPosition: {
    position: 'absolute',
    right: 0,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // Android varjo
    shadowColor: '#000', // iOS varjo
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
});