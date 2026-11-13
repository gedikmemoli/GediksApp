import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BUNGEE_FONT } from '@/constants/theme';
import {
  DICE_SIDES,
  rollCryptoDie,
  rollCryptoPool,
  type DiceSides,
  type SingleDieRoll,
} from '@/utils/crypto-dice';

export default function DiceScreen() {
  // Seçilen zar havuzu
  const [selectedPool, setSelectedPool] = useState<DiceSides[]>([20]);
  const [rolledDice, setRolledDice] = useState<SingleDieRoll[]>([]);
  const [totalResult, setTotalResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Animasyon
  const [spinAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const addDieToPool = (sides: DiceSides) => {
    if (isRolling) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPool((prev) => [...prev, sides]);
  };

  const removeDieFromPool = (indexToRemove: number) => {
    if (isRolling) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPool((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearPool = () => {
    if (isRolling) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPool([]);
    setRolledDice([]);
    setTotalResult(null);
  };

  const rollSelectedDice = async () => {
    if (isRolling || selectedPool.length === 0) return;
    setIsRolling(true);

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    spinAnim.setValue(0);
    scaleAnim.setValue(1);

    const loopAnim = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      })
    );
    loopAnim.start();

    // Kısa kriptografik animasyon adımları
    for (let step = 0; step < 5; step++) {
      const preview = await rollCryptoDie(20);
      setTotalResult(preview.value);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    const { rolls, total } = await rollCryptoPool(selectedPool);

    loopAnim.stop();
    spinAnim.setValue(0);
    setRolledDice(rolls);
    setTotalResult(total);
    setIsRolling(false);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 45, useNativeDriver: true }),
    ]).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Zar Şekli ve Skor */}
      <View style={styles.centerSection}>
        <Animated.View
          style={[
            styles.diceShape,
            {
              transform: [{ rotate: spin }, { scale: scaleAnim }],
            },
          ]}>
          <Text style={styles.resultText}>
            {totalResult !== null ? totalResult : 'D20'}
          </Text>
        </Animated.View>
      </View>

      {/* Zar Seçim Butonları: D4, D6, D8, D10, D12, D20 */}
      <View style={styles.selectorContainer}>
        {DICE_SIDES.map((sides) => {
          const count = selectedPool.filter((s) => s === sides).length;
          return (
            <TouchableOpacity
              key={sides}
              disabled={isRolling}
              style={[styles.dieBtn, count > 0 && styles.dieBtnActive]}
              onPress={() => addDieToPool(sides)}
              activeOpacity={0.75}>
              {count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{count}</Text>
                </View>
              )}
              <Text style={[styles.dieBtnText, count > 0 && styles.dieBtnTextActive]}>
                D{sides}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seçilen Zar Havuzu */}
      <View style={styles.poolWrap}>
        <View style={styles.poolHeader}>
          <Text style={styles.poolCountText}>
            {selectedPool.length > 0 ? `${selectedPool.length} DICE` : 'EMPTY'}
          </Text>
          {selectedPool.length > 0 && (
            <Pressable style={styles.clrBtn} onPress={clearPool}>
              <Text style={styles.clrBtnText}>CLR</Text>
            </Pressable>
          )}
        </View>

        {selectedPool.length > 0 && (
          <View style={styles.chipsRow}>
            {selectedPool.map((sides, idx) => (
              <Pressable
                key={`${sides}-${idx}`}
                onPress={() => removeDieFromPool(idx)}
                style={styles.chip}>
                <Text style={styles.chipText}>D{sides}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ROLL Butonu */}
      <TouchableOpacity
        style={[
          styles.rollBtn,
          (isRolling || selectedPool.length === 0) && styles.rollBtnDisabled,
        ]}
        onPress={rollSelectedDice}
        disabled={isRolling || selectedPool.length === 0}
        activeOpacity={0.8}>
        <Text style={styles.rollBtnText}>
          {isRolling ? 'ROLLING...' : 'ROLL'}
        </Text>
      </TouchableOpacity>

      {/* Tekil Zar Sonuçları */}
      {rolledDice.length > 0 && (
        <View style={styles.resultsGrid}>
          {rolledDice.map((roll, idx) => {
            const isCrit = roll.value === roll.sides;
            const isOne = roll.value === 1;
            return (
              <View
                key={roll.id}
                style={[
                  styles.resultCard,
                  isCrit && styles.resultCardCrit,
                  isOne && styles.resultCardOne,
                ]}>
                <Text style={styles.resultCardDie}>D{roll.sides}</Text>
                <Text
                  style={[
                    styles.resultCardVal,
                    isCrit && styles.resultValCrit,
                    isOne && styles.resultValOne,
                  ]}>
                  {roll.value}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 36,
  },
  centerSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  diceShape: {
    width: 140,
    height: 140,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#E53935',
    borderBottomWidth: 8,
    borderBottomColor: '#8E0000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 16,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
  },
  resultText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 48,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  dieBtn: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#334155',
    borderBottomColor: '#0F172A',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieBtnActive: {
    borderColor: '#FFD54F',
    borderBottomColor: '#9A7D0A',
    backgroundColor: '#332A10',
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  countBadgeText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 9,
  },
  dieBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#94A3B8',
    fontSize: 18,
  },
  dieBtnTextActive: {
    color: '#FFD54F',
  },
  poolWrap: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolCountText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  clrBtn: {
    backgroundColor: '#3B181E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  clrBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFCDD2',
    fontSize: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
  },
  chipText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 11,
  },
  rollBtn: {
    width: '100%',
    backgroundColor: '#E53935',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FF8A80',
    borderBottomWidth: 5,
    borderBottomColor: '#8E0000',
    alignItems: 'center',
  },
  rollBtnDisabled: {
    backgroundColor: '#475569',
    borderColor: '#64748B',
    borderBottomColor: '#1E293B',
  },
  rollBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 1,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  resultCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
  },
  resultCardCrit: {
    borderColor: '#FFD54F',
    backgroundColor: '#2E2612',
  },
  resultCardOne: {
    borderColor: '#EF5350',
    backgroundColor: '#2C1519',
  },
  resultCardDie: {
    fontFamily: BUNGEE_FONT,
    color: '#64748B',
    fontSize: 10,
  },
  resultCardVal: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 22,
  },
  resultValCrit: {
    color: '#FFD54F',
  },
  resultValOne: {
    color: '#EF5350',
  },
});
