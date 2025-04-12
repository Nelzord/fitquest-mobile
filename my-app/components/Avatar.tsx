import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface AvatarProps {
  size?: number;
  style?: ViewStyle;
  skinTone?: string;
  shirtColor?: string;
  pantsColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 100,
  style,
  skinTone = '#FFD3B6',
  shirtColor = '#4A90E2',
  pantsColor = '#2C3E50',
}) => {
  const scale = size / 100;

  return (
    <View style={[styles.container, style]}>
      {/* Head */}
      <View style={[
        styles.head,
        {
          backgroundColor: skinTone,
          width: 28 * scale,
          height: 28 * scale,
          borderRadius: 6 * scale,
        }
      ]} />

      {/* Spacer */}
      <View style={{ height: 6 * scale }} />

      {/* Upper body */}
      <View style={styles.upperBody}>
        {/* Arm Left */}
        <View style={[
          styles.arm,
          {
            backgroundColor: skinTone,
            width: 12 * scale,
            height: 34 * scale,
            borderRadius: 4 * scale,
          }
        ]} />
        
        {/* Torso */}
        <View style={[
          styles.torso,
          {
            backgroundColor: shirtColor,
            width: 36 * scale,
            height: 48 * scale,
            borderRadius: 6 * scale,
          }
        ]} />

        {/* Arm Right */}
        <View style={[
          styles.arm,
          {
            backgroundColor: skinTone,
            width: 12 * scale,
            height: 34 * scale,
            borderRadius: 4 * scale,
          }
        ]} />
      </View>

      {/* Legs */}
      <View style={styles.legs}>
        <View style={[
          styles.leg,
          {
            backgroundColor: pantsColor,
            width: 16 * scale,
            height: 40 * scale,
            borderRadius: 4 * scale,
          }
        ]} />
        <View style={{ width: 6 * scale }} />
        <View style={[
          styles.leg,
          {
            backgroundColor: pantsColor,
            width: 16 * scale,
            height: 40 * scale,
            borderRadius: 4 * scale,
          }
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  upperBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  torso: {
    borderWidth: 1.5,
    borderColor: '#000',
    marginHorizontal: 6,
  },
  arm: {
    borderWidth: 1.5,
    borderColor: '#000',
  },
  legs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  leg: {
    borderWidth: 1.5,
    borderColor: '#000',
  },
  head: {
    borderWidth: 1.5,
    borderColor: '#000',
  },
});
