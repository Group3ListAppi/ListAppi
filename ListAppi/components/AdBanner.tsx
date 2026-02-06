import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';

interface AdBannerProps {
  style?: any;
  onPress?: () => void;
  isPremium?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ style, onPress, isPremium }) => {
  if (isPremium) {
    return <View style={styles.premiumSpacer} />;
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={0.8}
      onPress={onPress}
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
  premiumSpacer: {
    height: 12,
  },
  image: {
    width: '100%',
    height: 150,
  },
});