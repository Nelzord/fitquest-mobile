import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { ThemedView } from './ThemedView';

interface AvatarProps {
  size?: number;
  style?: ViewStyle;
  source?: ImageSourcePropType;
}

export const Avatar: React.FC<AvatarProps> = ({ size = 200, style, source }) => {
  return (
    <ThemedView style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={source || require('@/assets/images/avatar.png')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  checkeredBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  checkeredRow: {
    flex: 1,
    flexDirection: 'row',
  },
  checkeredCell: {
    flex: 1,
  },
  lightCell: {
    backgroundColor: '#f0f0f0',
  },
  darkCell: {
    backgroundColor: '#e0e0e0',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
