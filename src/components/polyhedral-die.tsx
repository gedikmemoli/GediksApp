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
      return 'dice-d10';
  }
}

/**
 * Geniş Yamuk (D10 ve D100 için) katmanı
 */
function TrapezoidLayer({
  topWidth,
  bottomWidth,
  height,
  color,
}: {
  topWidth: number;
  bottomWidth: number;
  height: number;
  color: string;
}) {
  const slant = Math.max(2, Math.round((bottomWidth - topWidth) / 2));
  const centerW = bottomWidth - slant * 2;
  return (
    <View style={styles.rowCenter}>
      <View
        style={{
          width: 0,
          height: 0,
          borderBottomWidth: height,
          borderBottomColor: color,
          borderLeftWidth: slant,
          borderLeftColor: 'transparent',
        }}
      />
      <View style={{ width: centerW, height, backgroundColor: color }} />
      <View
        style={{
          width: 0,
          height: 0,
          borderBottomWidth: height,
          borderBottomColor: color,
          borderRightWidth: slant,
          borderRightColor: 'transparent',
        }}
      />
    </View>
  );
}

/**
 * Beşgen (D12 için) katmanı: Üst üçgen çatı + alt daralan yamuk gövde
 */
function PentagonLayer({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) {
  const halfW = Math.round(width / 2);
  const evenW = halfW * 2;
  const roofH = Math.round(height * 0.4);
  const baseH = height - roofH;
  const slant = Math.round(evenW * 0.19);
  const bottomW = evenW - slant * 2;

  return (
    <View style={styles.colCenter}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: halfW,
          borderRightWidth: halfW,
          borderBottomWidth: roofH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View style={styles.rowCenter}>
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: baseH,
            borderTopColor: color,
            borderLeftWidth: slant,
            borderLeftColor: 'transparent',
          }}
        />
        <View style={{ width: bottomW, height: baseH, backgroundColor: color }} />
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: baseH,
            borderTopColor: color,
            borderRightWidth: slant,
            borderRightColor: 'transparent',
          }}
        />
      </View>
    </View>
  );
}

/**
 * Altıgen (D20 dış gövdesi için) katmanı
 */
function HexagonLayer({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) {
  const halfW = Math.round(width / 2);
  const evenW = halfW * 2;
  const tipH = Math.round(height * 0.25);
  const midH = height - tipH * 2;

  return (
    <View style={styles.colCenter}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: halfW,
          borderRightWidth: halfW,
          borderBottomWidth: tipH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View style={{ width: evenW, height: midH, backgroundColor: color }} />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: halfW,
          borderRightWidth: halfW,
          borderTopWidth: tipH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  );
}

interface PolyhedralShapeCanvasProps {
  sides: DiceSides;
  size: number;
  bodyBg: string;
  facetBg: string;
  borderColor: string;
  bevelColor: string;
}

/**
 * Her zar tipi için istenen özel geometrik şekli çizer:
 * - D4: Üçgen
 * - D6: Kare
 * - D8: Alt tabanları birleşmiş iki üçgen
 * - D10: Geniş bir yamuk
 * - D12: Beşgen
 * - D20: Bildiğimiz 20'lik zar (Altıgen dış + merkez üçgen yüzey + ikozahedron ayrıtları)
 * - D100: 10'luk zar ile aynı geniş yamuk
 */
function PolyhedralShapeCanvas({
  sides,
  size,
  bodyBg,
  facetBg,
  borderColor,
  bevelColor,
}: PolyhedralShapeCanvasProps) {
  // 1. D4 -> ÜÇGEN
  if (sides === 4) {
    const w = size;
    const h = Math.round(size * 0.92);
    return (
      <View style={[styles.shapeCanvas, { width: size, height: size }]}>
        {/* Alt Gölge / Bevel Üçgeni */}
        <View
          style={{
            position: 'absolute',
            bottom: 1,
            width: 0,
            height: 0,
            borderLeftWidth: Math.round(w / 2),
            borderRightWidth: Math.round(w / 2),
            borderBottomWidth: h,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: bevelColor,
          }}
        />
        {/* Dış Çerçeve Üçgeni */}
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            width: 0,
            height: 0,
            borderLeftWidth: Math.round(w / 2),
            borderRightWidth: Math.round(w / 2),
            borderBottomWidth: h,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: borderColor,
          }}
        />
        {/* Ana Gövde Üçgeni */}
        <View
          style={{
            position: 'absolute',
            bottom: 6,
            width: 0,
            height: 0,
            borderLeftWidth: Math.round((w - 8) / 2),
            borderRightWidth: Math.round((w - 8) / 2),
            borderBottomWidth: h - 7,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: bodyBg,
          }}
        />
        {/* İç Yüzey (Facet) Üçgeni */}
        <View
          style={{
            position: 'absolute',
            bottom: 9,
            width: 0,
            height: 0,
            borderLeftWidth: Math.round((w - 18) / 2),
            borderRightWidth: Math.round((w - 18) / 2),
            borderBottomWidth: h - 16,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: facetBg,
          }}
        />
      </View>
    );
  }

  // 2. D6 -> KARE
  if (sides === 6) {
    const boxSize = Math.round(size * 0.86);
    return (
      <View style={[styles.shapeCanvas, { width: size, height: size }]}>
        <View
          style={{
            width: boxSize,
            height: boxSize,
            backgroundColor: bodyBg,
            borderColor: borderColor,
            borderBottomColor: bevelColor,
            borderWidth: 2.5,
            borderBottomWidth: 5,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: '74%',
              height: '74%',
              backgroundColor: facetBg,
              borderColor: borderColor,
              borderWidth: 1,
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    );
  }

  // 3. D8 -> ALT TABANLARI BİRLEŞMİŞ İKİ ÜÇGEN
  if (sides === 8) {
    const halfW = Math.round(size * 0.45);
    const halfH = Math.round(size * 0.46);
    const inW = halfW - 3;
    const inH = halfH - 3;
    const facetW = halfW - 8;
    const facetH = halfH - 7;

    return (
      <View style={[styles.shapeCanvas, { width: size, height: size }]}>
        {/* Dış Kenarlık: İki Üçgen */}
        <View style={styles.colCenter}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: halfW,
              borderRightWidth: halfW,
              borderBottomWidth: halfH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: borderColor,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: halfW,
              borderRightWidth: halfW,
              borderTopWidth: halfH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: borderColor,
            }}
          />
        </View>

        {/* Ana Gövde: İki Üçgen */}
        <View style={[styles.colCenter, styles.absCenter]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: inW,
              borderRightWidth: inW,
              borderBottomWidth: inH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: facetBg,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: inW,
              borderRightWidth: inW,
              borderTopWidth: inH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: bodyBg,
            }}
          />
        </View>

        {/* İç Parlak Yüzey */}
        <View style={[styles.colCenter, styles.absCenter]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: facetW,
              borderRightWidth: facetW,
              borderBottomWidth: facetH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: facetBg,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: facetW,
              borderRightWidth: facetW,
              borderTopWidth: facetH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: facetBg,
              opacity: 0.75,
            }}
          />
        </View>

        {/* İki Üçgenin Taban Birleşim Çizgisi */}
        <View
          style={{
            position: 'absolute',
            width: halfW * 1.82,
            height: 1.5,
            backgroundColor: borderColor,
            opacity: 0.85,
          }}
        />
      </View>
    );
  }

  // 4. D10 ve D100 -> GENİŞ BİR YAMUK
  if (sides === 10 || sides === 100) {
    const bW = size;
    const tW = Math.round(size * 0.52);
    const h = Math.round(size * 0.68);
    return (
      <View style={[styles.shapeCanvas, { width: size, height: size }]}>
        {/* Alt Bevel Gölgesi */}
        <View style={{ position: 'absolute', top: Math.round((size - h) / 2) + 3 }}>
          <TrapezoidLayer topWidth={tW} bottomWidth={bW} height={h} color={bevelColor} />
        </View>
        {/* Dış Çerçeve Yamuk */}
        <View style={styles.absCenter}>
          <TrapezoidLayer topWidth={tW} bottomWidth={bW} height={h} color={borderColor} />
        </View>
        {/* Gövde Yamuk */}
        <View style={styles.absCenter}>
          <TrapezoidLayer
            topWidth={tW - 4}
            bottomWidth={bW - 6}
            height={h - 5}
            color={bodyBg}
          />
        </View>
        {/* İç Yüzey Yamuk */}
        <View style={styles.absCenter}>
          <TrapezoidLayer
            topWidth={tW - 10}
            bottomWidth={bW - 16}
            height={h - 12}
            color={facetBg}
          />
        </View>
      </View>
    );
  }

  // 5. D12 -> BEŞGEN
  if (sides === 12) {
    const pW = Math.round(size * 0.92);
    const pH = Math.round(size * 0.9);
    return (
      <View style={[styles.shapeCanvas, { width: size, height: size }]}>
        {/* Alt Bevel */}
        <View style={{ position: 'absolute', top: Math.round((size - pH) / 2) + 3 }}>
          <PentagonLayer width={pW} height={pH} color={bevelColor} />
        </View>
        {/* Dış Kenarlık Beşgen */}
        <View style={styles.absCenter}>
          <PentagonLayer width={pW} height={pH} color={borderColor} />
        </View>
        {/* Gövde Beşgen */}
        <View style={styles.absCenter}>
          <PentagonLayer width={pW - 5} height={pH - 5} color={bodyBg} />
        </View>
        {/* İç Beşgen Yüzey */}
        <View style={styles.absCenter}>
          <PentagonLayer width={pW - 14} height={pH - 14} color={facetBg} />
        </View>
      </View>
    );
  }

  // 6. D20 -> BİLDİĞİMİZ 20'LİK ZAR GÖRÜNÜMÜ (İkozahedron Altıgen + Merkez Üçgen Yüzey + Ayrıtlar)
  const hexW = Math.round(size * 0.9);
  const hexH = Math.round(size * 0.96);
  const triHalfW = Math.round(size * 0.29);
  const triH = Math.round(size * 0.46);

  return (
    <View style={[styles.shapeCanvas, { width: size, height: size }]}>
      {/* Alt Bevel */}
      <View style={{ position: 'absolute', top: Math.round((size - hexH) / 2) + 3 }}>
        <HexagonLayer width={hexW} height={hexH} color={bevelColor} />
      </View>
      {/* Dış Kenarlık Altıgen */}
      <View style={styles.absCenter}>
        <HexagonLayer width={hexW} height={hexH} color={borderColor} />
      </View>
      {/* Ana Gövde Altıgen */}
      <View style={styles.absCenter}>
        <HexagonLayer width={hexW - 5} height={hexH - 5} color={bodyBg} />
      </View>

      {/* İkozahedron Köşe Ayrıt Çizgileri */}
      <View
        style={{
          position: 'absolute',
          width: 1.5,
          height: hexH - 10,
          backgroundColor: borderColor,
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: hexW - 8,
          height: 1.5,
          backgroundColor: borderColor,
          opacity: 0.45,
          transform: [{ rotate: '30deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: hexW - 8,
          height: 1.5,
          backgroundColor: borderColor,
          opacity: 0.45,
          transform: [{ rotate: '-30deg' }],
        }}
      />

      {/* Merkez İkozahedron Üçgen Yüzeyi (Dış Çerçeve) */}
      <View
        style={{
          position: 'absolute',
          top: Math.round(size * 0.24),
          width: 0,
          height: 0,
          borderLeftWidth: triHalfW + 2,
          borderRightWidth: triHalfW + 2,
          borderBottomWidth: triH + 3,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: borderColor,
        }}
      />
      {/* Merkez İkozahedron Üçgen Yüzeyi (İç Dolgu) */}
      <View
        style={{
          position: 'absolute',
          top: Math.round(size * 0.24) + 2,
          width: 0,
          height: 0,
          borderLeftWidth: triHalfW,
          borderRightWidth: triHalfW,
          borderBottomWidth: triH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: facetBg,
        }}
      />
    </View>
  );
}

interface PolyhedralTrayDieProps {
  roll: SingleDieRoll;
  theme: DiceThemeConfig;
  animX: Animated.Value;
  animY: Animated.Value;
  animRot: Animated.Value;
  animScale: Animated.Value;
  isRolling: boolean;
  onPressDie: (rollId: string) => void;
  size?: number;
}

/**
 * Zar tepsisi içinde özel geometrik şekliyle çizilen interaktif zar bileşeni.
 * Atılmamış (isRolled === false) zarlar da tablada aktif olarak görünür.
 */
export function PolyhedralTrayDie({
  roll,
  theme,
  animX,
  animY,
  animRot,
  animScale,
  isRolling,
  onPressDie,
  size = 62,
}: PolyhedralTrayDieProps) {
  const isCrit =
    roll.isRolled &&
    !roll.dropped &&
    ((roll.dieKind === 'standard' && roll.value === roll.sides) ||
      (roll.dieKind === 'd100_tens' && roll.value === 90) ||
      (roll.dieKind === 'd100_ones' && roll.value === 10));

  const isFumble =
    roll.isRolled &&
    !roll.dropped &&
    roll.dieKind === 'standard' &&
    roll.value === 1;

  const rotateInterpolate = animRot.interpolate({
    inputRange: [-1440, 1440],
    outputRange: ['-1440deg', '1440deg'],
  });

  const activeBorderColor = !roll.isRolled
    ? theme.accentColor
    : isCrit
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

  // Üçgen (D4) ve D20 için metin dikey hizalaması
  const textVerticalOffset =
    roll.sides === 4 ? 10 : roll.sides === 20 ? 5 : 0;

  const dieTypeLabel =
    roll.dieKind === 'd100_tens'
      ? 'D100'
      : roll.dieKind === 'd100_ones'
        ? 'D10'
        : `D${roll.sides}`;

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
          opacity: roll.dropped ? 0.42 : !roll.isRolled ? 0.92 : 1,
        },
      ]}>
      <Pressable
        disabled={isRolling}
        onPress={() => onPressDie(roll.id)}
        style={({ pressed }) => [
          styles.pressContainer,
          pressed && !isRolling && styles.pressedDie,
        ]}>
        {/* Özel Geometrik Zar Çizimi */}
        <PolyhedralShapeCanvas
          sides={roll.sides}
          size={size}
          bodyBg={activeBodyBg}
          facetBg={activeFacetBg}
          borderColor={activeBorderColor}
          bevelColor={theme.bevelColor}
        />

        {/* Zar Tipi Etiketi */}
        <View
          style={[
            styles.dieTypeTag,
            roll.sides === 4 && { top: -2, left: 0, right: 0, alignItems: 'center' },
          ]}>
          <Text style={[styles.dieTypeText, { color: theme.accentColor }]}>
            {dieTypeLabel}
          </Text>
        </View>

        {/* Merkez Zar Sonucu (veya Atılmamış Hazır Değer) */}
        <Text
          style={[
            styles.valueText,
            {
              marginTop: textVerticalOffset,
              color: !roll.isRolled
                ? '#E2E8F0'
                : isCrit
                  ? '#FEF08A'
                  : isFumble
                    ? '#FFCDD2'
                    : theme.textColor,
              fontSize: roll.displayValue.length >= 3 ? 14 : 18,
            },
            roll.dropped && styles.droppedText,
          ]}>
          {roll.displayValue}
        </Text>

        {/* Atılmamış (READY) / Crit / Nat 1 / Dropped Rozetleri */}
        {!roll.isRolled && !isRolling && (
          <View style={[styles.statusBadge, styles.readyBadge]}>
            <Text style={styles.readyBadgeText}>READY</Text>
          </View>
        )}
        {roll.isRolled && !isRolling && isCrit && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>CRIT</Text>
          </View>
        )}
        {roll.isRolled && !isRolling && isFumble && (
          <View style={[styles.statusBadge, styles.fumbleBadge]}>
            <Text style={styles.statusBadgeText}>NAT1</Text>
          </View>
        )}
        {roll.isRolled && !isRolling && roll.dropped && (
          <View style={[styles.statusBadge, styles.dropBadge]}>
            <Text style={styles.statusBadgeText}>DROP</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  pressContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colCenter: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieTypeTag: {
    position: 'absolute',
    top: 2,
    left: 4,
    zIndex: 15,
  },
  dieTypeText: {
    fontFamily: BUNGEE_FONT,
    fontSize: 7.5,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  valueText: {
    fontFamily: BUNGEE_FONT,
    zIndex: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.88)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  droppedText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  pressedDie: {
    transform: [{ scale: 0.92 }],
  },
  statusBadge: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 0.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FEF08A',
    zIndex: 20,
  },
  readyBadge: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  readyBadgeText: {
    fontFamily: BUNGEE_FONT,
    color: '#38BDF8',
    fontSize: 6.5,
  },
  fumbleBadge: {
    backgroundColor: '#DC2626',
    borderColor: '#FECACA',
  },
  dropBadge: {
    backgroundColor: '#334155',
    borderColor: '#94A3B8',
  },
  statusBadgeText: {
    fontFamily: BUNGEE_FONT,
    color: '#0F172A',
    fontSize: 7,
  },
});
