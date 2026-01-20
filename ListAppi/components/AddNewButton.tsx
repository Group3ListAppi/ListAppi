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
  const [isExpanded, setIsExpanded] = useState(true);
  const positionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    
    const timer = setTimeout(() => {
      setIsExpanded(false);
      Animated.timing(positionAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, 10000);

    return () => clearTimeout(timer);
  }, [positionAnim, animate]);

  const buttonWidth = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [340, 60],
  });

  const marginLeft = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  return isExpanded ? (
    <View style={styles.expandedContainer}>
      <Button
        mode="contained"
        onPress={onPress}
        style={[styles.expandedButton, { backgroundColor: theme.colors.primaryContainer }]}
        labelStyle={{ color: 'black' }}
        icon={() => (
          <MaterialCommunityIcons name="plus" size={20} color="black" />
        )}
      >
        {label}
      </Button>
    </View>
  ) : (
    <Animated.View style={[styles.animatedContainer, { marginLeft }]}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.compactButton,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <MaterialCommunityIcons name="plus" size={24} color="black" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  expandedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  expandedButton: {
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
  },
  animatedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  compactButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
