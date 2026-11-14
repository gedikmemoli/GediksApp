import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type RpgIconName =
  | 'dice-d20'
  | 'shield-sword'
  | 'crown'
  | 'shield-account'
  | 'dice-multiple'
  | 'arm-flex'
  | 'run-fast'
  | 'heart-pulse'
  | 'book-open-variant'
  | 'eye'
  | 'star-four-points'
  | 'heart'
  | 'shield'
  | 'flash'
  | 'shoe-print'
  | 'skip-next'
  | 'script-text'
  | 'compass'
  | 'bag-personal'
  | 'account-group'
  | 'treasure-chest'
  | 'hammer-wrench'
  | 'flask'
  | 'sword'
  | 'key-variant'
  | 'fire'
  | 'bullseye-arrow'
  | 'tent'
  | 'web'
  | 'google-play'
  | 'open-in-new';

interface RpgIconProps {
  name: RpgIconName;
  size?: number;
  color?: string;
}

export function RpgIcon({ name, size = 20, color = '#FFFFFF' }: RpgIconProps) {
  return (
    <View style={[styles.wrapper, { width: size + 4, height: size + 4 }]}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
