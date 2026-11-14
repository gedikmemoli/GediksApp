import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { BUNGEE_FONT } from '@/constants/theme';
import type { DiceSides, SingleDieRoll } from '@/utils/crypto-dice';

export type DiceThemeId = 'dragon' | 'arcane' | 'gold' | 'frost' | 'venom';

export interface DiceThemeConfig {
  id: DiceThemeId;
  label: string;
  bodyBg: string;
  facetBg: string;
  borderColor: string;
  bevelColor: string;
  textColor: string;
  accentColor: string;
  glowColor: string;
}

export const DICE_THEMES: Record<DiceThemeId, DiceThemeConfig> = {
  dragon: {
    id: 'dragon',
    label: 'DRAGON',
    bodyBg: '#991B1B',
    facetBg: '#DC2626',
    borderColor: '#FCA5A5',
    bevelColor: '#450A0A',
    textColor: '#FFFFFF',
    accentColor: '#FFD54F',
    glowColor: '#EF4444',
  },
  arcane: {
    id: 'arcane',
    label: 'ARCANE',
    bodyBg: '#3B0764',
    facetBg: '#6D28D9',
    borderColor: '#C4B5FD',
    bevelColor: '#1E1B4B',
    textColor: '#F5F3FF',
    accentColor: '#38BDF8',
    glowColor: '#8B5CF6',
  },
  gold: {
    id: 'gold',
    label: 'ROYAL',
    bodyBg: '#78350F',
    facetBg: '#D97706',
    borderColor: '#FDE68A',
    bevelColor: '#451A03',
    textColor: '#FFFBEB',
    accentColor: '#FEF08A',
    glowColor: '#F59E0B',
  },
  frost: {
    id: 'frost',
    label: 'FROST',
    bodyBg: '#0C4A6E',
    facetBg: '#0284C7',
    borderColor: '#BAE6FD',
    bevelColor: '#082F49',
    textColor: '#F0F9FF',
    accentColor: '#7DD3FC',
    glowColor: '#38BDF8',
  },
  venom: {
    id: 'venom',
    label: 'VENOM',
    bodyBg: '#064E3B',
    facetBg: '#059669',
    borderColor: '#A7F3D0',
    bevelColor: '#022C22',
    textColor: '#ECFDF5',
    accentColor: '#6EE7B7',
    glowColor: '#10B981',
  },
};

export function getDiceIconName(
  sides: DiceSides
): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  switch (sides) {
    case 4:
      return 'dice-d4';
    case 6:
      return 'dice-d6';
    case 8:
      return 'dice-d8';
    case 10:
      return 'dice-d10';
    case 12:
      return 'dice-d12';
    case 20:
      return 'dice-d20';
    case 100:
      return 'dice-multiple';
  }
}

interface PolyhedralTrayDieProps {
  roll: SingleDieRoll;
  theme: DiceThemeConfig;
  animX: Animated.Value;
  animY: Animated.Value;
  animRot: Animated.Value;
  animScale: Animated.Value;
  isRolling: boolean;
  onPressReroll: (rollId: string) => void;
  size?: number;
}

/**
 * Zar tepsisi içinde 2.5B derinlik, çokgen yüzey (facet), gölge ve
 * kritik/fumble parlaması ile çizilen interaktif zar bileşeni.
 */
export function PolyhedralTrayDie({
  roll,
  theme,
  animX,
  animY,
  animRot,
  animScale,
  isRolling,
  onPressReroll,
  size = 58,
}: PolyhedralTrayDieProps) {
  const isCrit = !roll.dropped && roll.value === roll.sides;
  const isFumble = !roll.dropped && roll.value === 1;

  const rotateInterpolate = animRot.interpolate({
    inputRange: [-1440, 1440],
    outputRange: ['-1440deg', '1440deg'],
  });

  // Zar tipine göre dış çerçeve geometrisi
  const shapeStyle = getShapeGeometryStyle(roll.sides, size);

  const activeBorderColor = isCrit
    ? '#FFD54F'
    : isFumble
      ? '#FF5252'
      : theme.borderColor;

  const activeBodyBg = isCrit
    ? '#854D0E'
    : isFumble
      ? '#450A0A'
      : theme.bodyBg;

  const activeFacetBg = isCrit
    ? '#CA8A04'
    : isFumble
      ? '#991B1B'
      : theme.facetBg;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          transform: [
            { translateX: animX },
            { translateY: animY },
            { rotate: rotateInterpolate },
            { scale: animScale },
          ],
          opacity: roll.dropped ? 0.42 : 1,
        },
      ]}>
      <Pressable
        disabled={isRolling}
        onPress={() => onPressReroll(roll.id)}
        style={({ pressed }) => [
          styles.dieBody,
          shapeStyle,
          {
            backgroundColor: activeBodyBg,
            borderColor: activeBorderColor,
            borderBottomColor: theme.bevelColor,
            shadowColor: isCrit ? '#FFD54F' : theme.glowColor,
          },
          isCrit && styles.critGlow,
          isFumble && styles.fumbleGlow,
          pressed && !isRolling && styles.pressedDie,
        ]}>
        {/* İç 2.5B Çokgen Yüzey (Facet Katmanı) */}
        <View
          style={[
            styles.innerFacet,
            {
              backgroundColor: activeFacetBg,
              borderColor: activeBorderColor,
            },
            roll.sides === 8 || roll.sides === 10 ? styles.diamondInner : null,
            roll.sides === 4 ? styles.triangleInner : null,
          ]}
        />

        {/* Sol-Üst Zar Tipi Etiketi */}
        <View style={styles.dieTypeTag}>
          <Text style={[styles.dieTypeText, { color: theme.accentColor }]}>
            D{roll.sides}
          </Text>
        </View>

        {/* Merkez Zar Sonucu */}
        <Text
          style={[
            styles.valueText,
            {
              color: isCrit ? '#FEF08A' : isFumble ? '#FFCDD2' : theme.textColor,
              fontSize: roll.value === 100 ? 15 : roll.sides === 100 ? 17 : 20,
            },
            roll.dropped && styles.droppedText,
          ]}>
          {roll.sides === 100 && roll.value < 10 ? `0${roll.value}` : roll.value}
        </Text>

        {/* Crit / Nat 1 / Dropped Rozetleri */}
        {!isRolling && isCrit && (
          <View style={styles.critBadge}>
            <Text style={styles.critBadgeText}>CRIT</Text>
          </View>
        )}
        {!isRolling && isFumble && (
          <View style={[styles.critBadge, styles.fumbleBadge]}>
            <Text style={styles.critBadgeText}>NAT1</Text>
          </View>
        )}
        {!isRolling && roll.dropped && (
          <View style={[styles.critBadge, styles.dropBadge]}>
            <Text style={styles.critBadgeText}>DROP</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function getShapeGeometryStyle(sides: DiceSides, size: number) {
  switch (sides) {
    case 4:
      return {
        borderRadius: 10,
        borderTopLeftRadius: size * 0.42,
        borderTopRightRadius: size * 0.42,
      };
    case 6:
      return {
        borderRadius: 11,
      };
    case 8:
      return {
        borderRadius: 15,
        borderTopLeftRadius: 22,
        borderBottomRightRadius: 22,
      };
    case 10:
      return {
        borderRadius: 16,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 24,
      };
    case 12:
      return {
        borderRadius: size * 0.34,
      };
    case 20:
      return {
        borderRadius: size * 0.38,
      };
    case 100:
      return {
        borderRadius: size * 0.5,
      };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  dieBody: {
    width: '100%',
    height: '100%',
    borderWidth: 2.5,
    borderBottomWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 9,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    overflow: 'visible',
  },
  innerFacet: {
    position: 'absolute',
    width: '74%',
    height: '74%',
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.72,
  },
  diamondInner: {
    transform: [{ rotate: '45deg' }],
    width: '62%',
    height: '62%',
    borderRadius: 6,
  },
  triangleInner: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  dieTypeTag: {
    position: 'absolute',
    top: 2,
    left: 5,
  },
  dieTypeText: {
    fontFamily: BUNGEE_FONT,
    fontSize: 7.5,
    letterSpacing: 0.3,
    opacity: 0.92,
  },
  valueText: {
    fontFamily: BUNGEE_FONT,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  droppedText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  critGlow: {
    borderWidth: 3,
    shadowOpacity: 0.95,
    shadowRadius: 12,
  },
  fumbleGlow: {
    borderWidth: 3,
    shadowColor: '#EF4444',
    shadowOpacity: 0.85,
    shadowRadius: 10,
  },
  pressedDie: {
    transform: [{ scale: 0.92 }],
  },
  critBadge: {
    position: 'absolute',
    bottom: -7,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 0.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  fumbleBadge: {
    backgroundColor: '#DC2626',
    borderColor: '#FECACA',
  },
  dropBadge: {
    backgroundColor: '#334155',
    borderColor: '#94A3B8',
  },
  critBadgeText: {
    fontFamily: BUNGEE_FONT,
    color: '#0F172A',
    fontSize: 7,
  },
});
