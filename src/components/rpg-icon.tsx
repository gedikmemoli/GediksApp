import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  | 'treasure-chest';

const ICON_GLYPHS: Record<RpgIconName, string> = {
  'dice-d20': '🎲',
  'shield-sword': '⚔️',
  crown: '👑',
  'shield-account': '🛡️',
  'dice-multiple': '🎲',
  'arm-flex': '💪',
  'run-fast': '⚡',
  'heart-pulse': '❤️',
  'book-open-variant': '📖',
  eye: '👁️',
  'star-four-points': '✨',
  heart: '❤️',
  shield: '🛡️',
  flash: '⚡',
  'shoe-print': '🥾',
  'skip-next': '⏭',
  'script-text': '📜',
  compass: '🧭',
  'bag-personal': '🎒',
  'account-group': '🎨',
  'treasure-chest': '🧰',
};

interface RpgIconProps {
  name: RpgIconName;
  size?: number;
  color?: string;
}

export function RpgIcon({ name, size = 20, color = '#FFFFFF' }: RpgIconProps) {
  const glyph = ICON_GLYPHS[name] ?? '✦';

  return (
    <View style={[styles.wrapper, { width: size + 4, height: size + 4 }]}>
      <Text
        style={[
          styles.glyph,
          {
            fontSize: Math.round(size * 0.85),
            lineHeight: size + 2,
            color,
          },
        ]}>
        {glyph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
