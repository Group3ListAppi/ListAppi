import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';

interface AdBannerProps {
  style?: any;
}

export const AdBanner: React.FC<AdBannerProps> = ({ style }) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={0.8}
    >
      <Image
        source={require('../assets/Ad.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -8,
    marginBottom: 12,
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 0,
  },
  image: {
    width: '100%',
    height: 150,
  },
});