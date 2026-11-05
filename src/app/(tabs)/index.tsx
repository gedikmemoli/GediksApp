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

import { RpgIcon } from '@/components/rpg-icon';
import { useRoleStore } from '@/store/useRoleStore';
import {
  DICE_SIDES,
  rollCryptoDie,
  rollCryptoPool,
  type DiceSides,
  type SingleDieRoll,
} from '@/utils/crypto-dice';

export default function DiceScreen() {
  const isDMMode = useRoleStore((state) => state.isDMMode);

  // Kullanıcının atmak üzere seçtiği zarlar havuzu (varsayılan olarak 1 adet d20 seçili başlar)
  const [selectedPool, setSelectedPool] = useState<DiceSides[]>([20]);
  const [rolledDice, setRolledDice] = useState<SingleDieRoll[]>([]);
  const [totalResult, setTotalResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Animasyon referansları (Web ve Native uyumlu)
  const [spinAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const triggerHapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  // Zar butonuna basıldığında havuza zar ekler (hemen atmaz)
  const addDieToPool = (sides: DiceSides) => {
    if (isRolling) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedPool((prev) => [...prev, sides]);
  };

  // Havuzdaki belirli bir zarı index'ine göre çıkarır
  const removeDieFromPool = (indexToRemove: number) => {
    if (isRolling) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedPool((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Seçilen zar havuzunu tamamen temizler
  const clearPool = () => {
    if (isRolling) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedPool([]);
    setRolledDice([]);
    setTotalResult(null);
  };

  // Seçilen tüm zarları Crypto.getRandomBytesAsync() ile aynı anda atar
  const rollSelectedDice = async () => {
    if (isRolling || selectedPool.length === 0) return;
    setIsRolling(true);

    triggerHapticImpact(Haptics.ImpactFeedbackStyle.Medium);

    spinAnim.setValue(0);
    scaleAnim.setValue(1);

    const loopAnim = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      })
    );
    loopAnim.start();

    // Kriptografik ara animasyon adımları
    for (let step = 0; step < 5; step++) {
      const preview = await rollCryptoDie(20);
      setTotalResult(preview.value);
      triggerHapticImpact(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }

    // Seçilen havuzdaki tüm zarları gerçek kriptografik rastgelelikle at
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
      Animated.timing(scaleAnim, { toValue: 1.28, duration: 130, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 45, useNativeDriver: true }),
    ]).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Seçilen zarların özet formülü (ör. "2d6 + 1d8 + 1d20")
  const poolFormula = DICE_SIDES.map((sides) => {
    const count = selectedPool.filter((s) => s === sides).length;
    return count > 0 ? `${count}d${sides}` : null;
  })
    .filter(Boolean)
    .join(' + ');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Üst Başlık */}
      <View style={styles.topHeader}>
        <View style={styles.badgeRow}>
          <RpgIcon name="dice-multiple" size={18} color="#FFD54F" />
          <Text style={styles.subtitleBadge}>
            {isDMMode ? 'DM KRİPTOGRAFİK ZAR MASASI' : 'CSPRNG • GERÇEK KRİPTOGRAFİK ZAR'}
          </Text>
        </View>
        <Text style={styles.header}>DICE (ZAR MOTORU)</Text>
      </View>

      {/* 1. Adım: Zar Seçim Butonları (d4, d6, d8, d10, d12, d20) */}
      <View style={styles.selectionSection}>
        <Text style={styles.sectionSmallTitle}>
          1. ATILACAK ZARLARI SEÇİN (HAVUZA EKLEMEK İÇİN DOKUNUN):
        </Text>
        <View style={styles.selectorContainer}>
          {DICE_SIDES.map((sides) => {
            const countInPool = selectedPool.filter((s) => s === sides).length;
            const isSelected = countInPool > 0;
            return (
              <TouchableOpacity
                key={sides}
                disabled={isRolling}
                style={[styles.typeButton, isSelected && styles.typeButtonActive]}
                onPress={() => addDieToPool(sides)}
                activeOpacity={0.75}>
                {countInPool > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{countInPool}x</Text>
                  </View>
                )}
                <Text style={[styles.typeButtonTitle, isSelected && styles.typeButtonTextActive]}>
                  d{sides}
                </Text>
                <Text style={styles.typeButtonSub}>+ Havuza Ekle</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seçilen Zarlar Havuzu */}
      <View style={styles.poolCard}>
        <View style={styles.poolHeaderRow}>
          <View>
            <Text style={styles.poolTitle}>
              SEÇİLEN ZARLAR ({selectedPool.length} Adet)
            </Text>
            <Text style={styles.poolFormulaText}>
              {poolFormula || 'Henüz zar seçilmedi'}
            </Text>
          </View>
          {selectedPool.length > 0 && (
            <Pressable style={styles.clearPoolBtn} onPress={clearPool}>
              <Text style={styles.clearPoolBtnText}>Seçimi Temizle</Text>
            </Pressable>
          )}
        </View>

        {selectedPool.length === 0 ? (
          <Text style={styles.emptyPoolHint}>
            Yukarıdaki d4, d6, d8, d10, d12 veya d20 butonlarına basarak atılacak zarları seçin.
          </Text>
        ) : (
          <View style={styles.poolChipsWrap}>
            {selectedPool.map((sides, idx) => (
              <Pressable
                key={`${sides}-${idx}`}
                onPress={() => removeDieFromPool(idx)}
                style={styles.poolChip}>
                <Text style={styles.poolChipText}>d{sides}</Text>
                <Text style={styles.poolChipRemove}>✕</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 2. Adım: Seçilen Zarları At Butonu */}
        <TouchableOpacity
          style={[
            styles.rollButton,
            (isRolling || selectedPool.length === 0) && styles.rollButtonDisabled,
          ]}
          onPress={rollSelectedDice}
          disabled={isRolling || selectedPool.length === 0}
          activeOpacity={0.8}>
          <Text style={styles.rollButtonText}>
            {isRolling
              ? 'KRİPTOGRAFİK OLARAK ATILIYOR...'
              : selectedPool.length === 0
                ? 'ÖNCE ATILACAK ZARLARI SEÇİN'
                : `SEÇİLEN ZARLARI AT (${poolFormula})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toplam Sonuç Göstergesi */}
      <View style={styles.centerSection}>
        <Animated.View
          style={[
            styles.diceShape,
            {
              transform: [{ rotate: spin }, { scale: scaleAnim }],
            },
          ]}>
          <Text style={styles.dieTypeTag}>ATILAN TOPLAM</Text>
          <Text style={styles.resultText}>{totalResult !== null ? totalResult : '-'}</Text>
          <Text style={styles.cryptoTag}>Crypto.getRandomBytesAsync()</Text>
        </Animated.View>

        {rolledDice.length > 0 && (
          <View style={styles.totalSummaryBanner}>
            <Text style={styles.totalSummaryLabel}>
              TOPLAM: {rolledDice.map((r) => `${r.value} (d${r.sides})`).join(' + ')} ={' '}
              <Text style={styles.totalSummaryHighlight}>{totalResult}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Tekil Zar Sonuçları Listesi */}
      <View style={styles.individualSection}>
        <Text style={styles.sectionTitle}>TEKİL ZAR SONUÇLARI</Text>

        {rolledDice.length === 0 ? (
          <View style={styles.emptyRollsBox}>
            <Text style={styles.emptyRollsText}>
              Zarları seçip &quot;SEÇİLEN ZARLARI AT&quot; butonuna bastığınızda her bir zarın tekil sonucu burada görünecek.
            </Text>
          </View>
        ) : (
          <View style={styles.rollsGrid}>
            {rolledDice.map((roll, index) => {
              const isMax = roll.value === roll.sides;
              const isMin = roll.value === 1;
              return (
                <View
                  key={roll.id}
                  style={[
                    styles.rollResultCard,
                    isMax && styles.rollCardCrit,
                    isMin && styles.rollCardMin,
                  ]}>
                  <View style={styles.rollCardTop}>
                    <Text style={styles.rollIndexText}>#{index + 1}</Text>
                    <View style={styles.rollDieBadge}>
                      <Text style={styles.rollDieBadgeText}>d{roll.sides}</Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.rollCardValue,
                      isMax && styles.rollCardValueCrit,
                      isMin && styles.rollCardValueMin,
                    ]}>
                    {roll.value}
                  </Text>

                  <Text style={styles.rollByteText}>
                    Byte: 0x{roll.rawByte.toString(16).toUpperCase().padStart(2, '0')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 36,
  },
  topHeader: {
    alignItems: 'center',
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subtitleBadge: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  header: {
    color: '#FFD54F',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  selectionSection: {
    width: '100%',
    gap: 8,
  },
  sectionSmallTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  typeButton: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#334155',
    borderBottomColor: '#0F172A',
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#FFD54F',
    borderBottomColor: '#9A7D0A',
    backgroundColor: '#332A10',
  },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  typeButtonTitle: {
    color: '#E2E8F0',
    fontSize: 19,
    fontWeight: '900',
  },
  typeButtonTextActive: {
    color: '#FFD54F',
  },
  typeButtonSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  poolCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 5,
    borderBottomColor: '#0F172A',
  },
  poolHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolTitle: {
    color: '#FFD54F',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  poolFormulaText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  clearPoolBtn: {
    backgroundColor: '#3B181E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  clearPoolBtnText: {
    color: '#FFCDD2',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyPoolHint: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  poolChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  poolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
  },
  poolChipText: {
    color: '#FFD54F',
    fontSize: 13,
    fontWeight: '900',
  },
  poolChipRemove: {
    color: '#EF5350',
    fontSize: 11,
    fontWeight: '900',
  },
  rollButton: {
    width: '100%',
    backgroundColor: '#E53935',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FF8A80',
    borderBottomWidth: 5,
    borderBottomColor: '#8E0000',
    alignItems: 'center',
  },
  rollButtonDisabled: {
    backgroundColor: '#475569',
    borderColor: '#64748B',
    borderBottomColor: '#1E293B',
  },
  rollButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  centerSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  diceShape: {
    width: 148,
    height: 148,
    backgroundColor: '#1E293B',
    borderRadius: 26,
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
  dieTypeTag: {
    position: 'absolute',
    top: 10,
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 50,
    fontWeight: '900',
  },
  cryptoTag: {
    position: 'absolute',
    bottom: 10,
    color: '#FFD54F',
    fontSize: 9,
    fontWeight: '800',
  },
  totalSummaryBanner: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    alignItems: 'center',
  },
  totalSummaryLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  totalSummaryHighlight: {
    color: '#FFD54F',
    fontSize: 16,
    fontWeight: '900',
  },
  individualSection: {
    width: '100%',
    gap: 10,
  },
  sectionTitle: {
    color: '#FFD54F',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyRollsBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  emptyRollsText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  rollsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rollResultCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
    alignItems: 'center',
    gap: 4,
  },
  rollCardCrit: {
    borderColor: '#FFD54F',
    borderBottomColor: '#9A7D0A',
    backgroundColor: '#2E2612',
  },
  rollCardMin: {
    borderColor: '#EF5350',
    borderBottomColor: '#7F1D1D',
    backgroundColor: '#2C1519',
  },
  rollCardTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rollIndexText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  rollDieBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  rollDieBadgeText: {
    color: '#FFD54F',
    fontSize: 11,
    fontWeight: '900',
  },
  rollCardValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  rollCardValueCrit: {
    color: '#FFD54F',
  },
  rollCardValueMin: {
    color: '#EF5350',
  },
  rollByteText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
});
