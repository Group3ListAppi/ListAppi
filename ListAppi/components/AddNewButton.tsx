import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AddNewButtonProps {
  onPress: () => void;
  label: string;
  animate?: boolean;
}

export const AddNewButton: React.FC<AddNewButtonProps> = ({ onPress, label, animate = true }) => {
  const theme = useTheme();
  const positionAnim = useRef(new Animated.Value(0)).current;
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (!animate) return;
    
    const timer = setTimeout(() => {
      Animated.timing(positionAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => setAnimationComplete(true));
    }, 10000);

    return () => clearTimeout(timer);
  }, [positionAnim, animate]);

  const buttonWidth = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 60],
  });

  const marginLeft = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  const opacity = positionAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.3, 0],
  });

  const expandedButtonOpacity = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[{ width: buttonWidth, marginLeft, overflow: 'hidden', pointerEvents: animationComplete ? 'none' : 'auto', opacity: expandedButtonOpacity }]}>
        <Button
          mode="contained"
          onPress={onPress}
          style={[styles.expandedButton, { backgroundColor: theme.colors.primary }]}
          labelStyle={{ color: 'white' }}
          icon={() => (
            <MaterialCommunityIcons name="plus" size={20} color="white" />
          )}
        >
          {label}
        </Button>
      </Animated.View>
      <Animated.View style={[styles.compactButtonWrapper, { opacity: positionAnim }]}>
        <TouchableOpacity
          onPress={onPress}
          style={[
            styles.compactButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 100,
  },
  expandedButton: {
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
  },
  compactButtonWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  compactButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
