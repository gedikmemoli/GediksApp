import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  DICE_THEMES,
  getDiceIconName,
  PolyhedralTrayDie,
  type DiceThemeId,
} from '@/components/polyhedral-die';
import { BUNGEE_FONT } from '@/constants/theme';
import {
  DICE_SIDES,
  evaluateRollPool,
  rollCryptoDie,
  rollCryptoPool,
  simulateCryptoTrayPhysics,
  type DiceSides,
  type RollMode,
  type SingleDieRoll,
} from '@/utils/crypto-dice';

interface DieAnimValues {
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  scale: Animated.Value;
}

const DIE_SIZE = 56;
const MAX_POOL_SIZE = 12;

export default function DiceScreen() {
  // Seçilen zar havuzu ve Owlbear Rodeo mekanikleri
  const [selectedPool, setSelectedPool] = useState<DiceSides[]>([20]);
  const [rollMode, setRollMode] = useState<RollMode>('normal');
  const [modifier, setModifier] = useState<number>(0);
  const [themeId, setThemeId] = useState<DiceThemeId>('dragon');

  // Atılan zarlar ve sonuçlar
  const [rolledDice, setRolledDice] = useState<SingleDieRoll[]>([]);
  const [diceSum, setDiceSum] = useState<number | null>(null);
  const [totalResult, setTotalResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Tepsi boyutları (dinamik ölçüm)
  const [traySize, setTraySize] = useState<{ width: number; height: number }>({
    width: 320,
    height: 215,
  });

  // Her zarın 2.5B fizik animasyon değerleri
  const [animMap, setAnimMap] = useState<Record<string, DieAnimValues>>({});
  const [totalBannerScale] = useState(() => new Animated.Value(1));

  const activeTheme = DICE_THEMES[themeId];

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleTrayLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 100 && height > 100) {
      setTraySize({ width, height });
    }
  };

  const addDieToPool = (sides: DiceSides) => {
    if (isRolling) return;
    if (selectedPool.length >= MAX_POOL_SIZE) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
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
    setDiceSum(null);
    setTotalResult(null);
    setAnimMap({});
  };

  const changeRollMode = (nextMode: RollMode) => {
    if (isRolling) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setRollMode(nextMode);
    if (rolledDice.length > 0) {
      const { evaluatedRolls, diceSum: newSum, total } = evaluateRollPool(
        rolledDice,
        nextMode,
        modifier
      );
      setRolledDice(evaluatedRolls);
      setDiceSum(newSum);
      setTotalResult(total);
    }
  };

  const adjustModifier = (delta: number) => {
    if (isRolling) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const nextMod = Math.max(-20, Math.min(30, modifier + delta));
    setModifier(nextMod);
    if (rolledDice.length > 0) {
      const { evaluatedRolls, diceSum: newSum, total } = evaluateRollPool(
        rolledDice,
        rollMode,
        nextMod
      );
      setRolledDice(evaluatedRolls);
      setDiceSum(newSum);
      setTotalResult(total);
    }
  };

  /**
   * Kriptografik zar havuzunu atar ve Owlbear Rodeo tarzı
   * deterministik 2.5B tepsi fiziği simülasyonunu oynatır.
   */
  const rollSelectedDice = async () => {
    if (isRolling || selectedPool.length === 0) return;
    setIsRolling(true);

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    // 1. Kriptografik zar sonuçlarını ve fizik yörüngelerini hesapla
    const { rolls, diceSum: finalSum, total: finalTotal } = await rollCryptoPool(
      selectedPool,
      rollMode,
      modifier
    );

    const trajectories = await simulateCryptoTrayPhysics(
      rolls.map((r) => r.id),
      traySize.width,
      traySize.height,
      DIE_SIZE
    );

    // 2. Yeni zarların başlangıç animasyon değerlerini hazırla
    const nextAnimMap: Record<string, DieAnimValues> = {};
    for (const traj of trajectories) {
      const firstWp = traj.waypoints[0];
      nextAnimMap[traj.id] = {
        x: new Animated.Value(firstWp.x),
        y: new Animated.Value(firstWp.y),
        rot: new Animated.Value(firstWp.rotation),
        scale: new Animated.Value(firstWp.scale),
      };
    }
    setAnimMap(nextAnimMap);
    setRolledDice(rolls);

    // 3. Çok adımlı sekme ve çarpışma animasyonlarını oluştur
    const stepDuration = 95;
    const allDieAnimations = trajectories.map((traj) => {
      const anim = nextAnimMap[traj.id];
      const stepAnimations = traj.waypoints.slice(1).map((wp, idx, arr) => {
        const isLast = idx === arr.length - 1;
        return Animated.parallel([
          Animated.timing(anim.x, {
            toValue: wp.x,
            duration: stepDuration,
            easing: isLast ? Easing.out(Easing.cubic) : Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: wp.y,
            duration: stepDuration,
            easing: isLast ? Easing.out(Easing.cubic) : Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rot, {
            toValue: wp.rotation,
            duration: stepDuration,
            easing: isLast ? Easing.out(Easing.back(1.2)) : Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: wp.scale,
            duration: stepDuration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
      });
      return Animated.sequence(stepAnimations);
    });

    // Sekme anlarında dokunsal (haptic) çarpışma hissi
    const bounceTimers = [90, 210, 340, 470].map((delay, idx) =>
      setTimeout(() => {
        triggerHaptic(
          idx < 2
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        );
      }, delay)
    );

    await new Promise<void>((resolve) => {
      Animated.parallel(allDieAnimations).start(() => resolve());
    });

    bounceTimers.forEach(clearTimeout);

    setDiceSum(finalSum);
    setTotalResult(finalTotal);
    setIsRolling(false);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    totalBannerScale.setValue(0.88);
    Animated.spring(totalBannerScale, {
      toValue: 1,
      friction: 4,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Tepsideki veya sonuç listesindeki tek bir zara dokunulduğunda
   * sadece o zarı kriptografik olarak yeniden fırlatır (Single Die Reroll).
   */
  const rerollSingleDie = async (rollId: string) => {
    if (isRolling) return;
    const targetDie = rolledDice.find((d) => d.id === rollId);
    if (!targetDie) return;

    setIsRolling(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const { value: newValue, rawByte: newByte } = await rollCryptoDie(targetDie.sides);
    const [singleTraj] = await simulateCryptoTrayPhysics(
      [rollId],
      traySize.width,
      traySize.height,
      DIE_SIZE
    );

    const anim = animMap[rollId];
    if (singleTraj && anim) {
      const stepAnimations = singleTraj.waypoints.slice(1).map((wp, idx, arr) => {
        const isLast = idx === arr.length - 1;
        return Animated.parallel([
          Animated.timing(anim.x, {
            toValue: wp.x,
            duration: 75,
            easing: isLast ? Easing.out(Easing.cubic) : Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: wp.y,
            duration: 75,
            easing: isLast ? Easing.out(Easing.cubic) : Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rot, {
            toValue: wp.rotation + 360,
            duration: 75,
            easing: isLast ? Easing.out(Easing.back(1.2)) : Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: isLast ? 1 : 1.25,
            duration: 75,
            useNativeDriver: true,
          }),
        ]);
      });

      await new Promise<void>((resolve) => {
        Animated.sequence(stepAnimations).start(() => resolve());
      });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const updatedRaw = rolledDice.map((d) =>
      d.id === rollId
        ? {
            ...d,
            value: newValue,
            rawByte: newByte,
            timestamp: timeStr,
            rerollCount: (d.rerollCount ?? 0) + 1,
          }
        : d
    );

    const { evaluatedRolls, diceSum: newSum, total: newTotal } = evaluateRollPool(
      updatedRaw,
      rollMode,
      modifier
    );

    setRolledDice(evaluatedRolls);
    setDiceSum(newSum);
    setTotalResult(newTotal);
    setIsRolling(false);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Üst Kontrol Çubuğu: Zar Materyal Teması & Avantaj/Dezavantaj */}
      <View style={styles.topControlsRow}>
        <View style={styles.themePillsRow}>
          {(Object.keys(DICE_THEMES) as DiceThemeId[]).map((id) => {
            const t = DICE_THEMES[id];
            const isSelected = id === themeId;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setThemeId(id);
                }}
                style={[
                  styles.themeDotBtn,
                  {
                    backgroundColor: t.facetBg,
                    borderColor: isSelected ? '#FFFFFF' : t.borderColor,
                  },
                  isSelected && styles.themeDotSelected,
                ]}>
                {isSelected && <View style={styles.themeInnerDot} />}
              </Pressable>
            );
          })}
          <Text style={[styles.themeNameLabel, { color: activeTheme.accentColor }]}>
            {activeTheme.label}
          </Text>
        </View>

        {/* Roll Mode: NORM / ADV / DIS */}
        <View style={styles.modeSwitchWrap}>
          {(
            [
              { id: 'normal', label: 'NORM' },
              { id: 'advantage', label: 'ADV' },
              { id: 'disadvantage', label: 'DIS' },
            ] as const
          ).map((m) => {
            const active = rollMode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => changeRollMode(m.id)}
                style={[
                  styles.modeBtn,
                  active && m.id === 'normal' && styles.modeBtnNormActive,
                  active && m.id === 'advantage' && styles.modeBtnAdvActive,
                  active && m.id === 'disadvantage' && styles.modeBtnDisActive,
                ]}>
                <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* OWLBEAR RODEO TARZI 2.5B FİZİKSEL ZAR TEPSİSİ (DICE TRAY) */}
      <View style={styles.trayOuterFrame}>
        {/* Köşe Perçinleri */}
        <View style={[styles.cornerRivet, styles.rivetTL]} />
        <View style={[styles.cornerRivet, styles.rivetTR]} />
        <View style={[styles.cornerRivet, styles.rivetBL]} />
        <View style={[styles.cornerRivet, styles.rivetBR]} />

        <View style={styles.trayInnerFelt} onLayout={handleTrayLayout}>
          {/* Arka Plan Rün / Arena Filigranı */}
          <View style={styles.trayWatermark} pointerEvents="none">
            <MaterialCommunityIcons
              name="octagram-outline"
              size={140}
              color="rgba(148, 163, 184, 0.07)"
            />
          </View>

          {/* Tepsi Boşken Gösterilecek Başlangıç Durumu */}
          {rolledDice.length === 0 && (
            <Pressable
              style={styles.emptyTrayPrompt}
              onPress={rollSelectedDice}
              disabled={selectedPool.length === 0 || isRolling}>
              <MaterialCommunityIcons
                name="dice-d20-outline"
                size={46}
                color={activeTheme.accentColor}
              />
              <Text style={styles.emptyTraySub}>
                {selectedPool.length > 0
                  ? 'Tepsiye dokun veya ROLL butonuna bas'
                  : 'Aşağıdan zar seçerek havuza ekle'}
              </Text>
            </Pressable>
          )}

          {/* Fiziksel Zarlar */}
          {rolledDice.map((roll) => {
            const anim = animMap[roll.id];
            if (!anim) return null;
            return (
              <PolyhedralTrayDie
                key={roll.id}
                roll={roll}
                theme={activeTheme}
                animX={anim.x}
                animY={anim.y}
                animRot={anim.rot}
                animScale={anim.scale}
                isRolling={isRolling}
                onPressReroll={rerollSingleDie}
                size={DIE_SIZE}
              />
            );
          })}

          {/* Tepsi Alt Bilgi Çubuğu */}
          {rolledDice.length > 0 && !isRolling && (
            <View style={styles.trayFooterHint} pointerEvents="none">
              <Text style={styles.trayFooterHintText}>
                ZARA DOKUN: TEKİL YENİDEN AT (REROLL)
              </Text>
            </View>
          )}
        </View>

        {/* Tepsi Üstü Toplam Sonuç Rozeti */}
        {totalResult !== null && (
          <Animated.View
            style={[
              styles.totalBanner,
              {
                borderColor: activeTheme.borderColor,
                transform: [{ scale: totalBannerScale }],
              },
            ]}>
            <View style={styles.totalBannerLeft}>
              <Text style={styles.totalLabel}>
                {rollMode === 'advantage'
                  ? 'TOTAL (ADV)'
                  : rollMode === 'disadvantage'
                    ? 'TOTAL (DIS)'
                    : 'TOTAL'}
              </Text>
              <Text style={styles.formulaText}>
                DICE {diceSum ?? 0}{' '}
                {modifier !== 0
                  ? `${modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`} MOD`
                  : ''}
              </Text>
            </View>
            <Text style={[styles.totalValueText, { color: activeTheme.accentColor }]}>
              {isRolling ? '...' : totalResult}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Zar Seçim Butonları: D4, D6, D8, D10, D12, D20, D100 */}
      <View style={styles.selectorContainer}>
        {DICE_SIDES.map((sides) => {
          const count = selectedPool.filter((s) => s === sides).length;
          return (
            <TouchableOpacity
              key={sides}
              disabled={isRolling}
              style={[
                styles.dieBtn,
                count > 0 && {
                  borderColor: activeTheme.borderColor,
                  borderBottomColor: activeTheme.bevelColor,
                  backgroundColor: activeTheme.bodyBg,
                },
              ]}
              onPress={() => addDieToPool(sides)}
              activeOpacity={0.75}>
              {count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{count}</Text>
                </View>
              )}
              <MaterialCommunityIcons
                name={getDiceIconName(sides)}
                size={20}
                color={count > 0 ? activeTheme.accentColor : '#94A3B8'}
              />
              <Text
                style={[
                  styles.dieBtnText,
                  count > 0 && { color: activeTheme.textColor },
                ]}>
                D{sides}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seçilen Zar Havuzu & Bonus (Modifier) Ayarı */}
      <View style={styles.poolWrap}>
        <View style={styles.poolHeader}>
          <View style={styles.poolTitleRow}>
            <Text style={styles.poolCountText}>
              {selectedPool.length > 0
                ? `${selectedPool.length}/${MAX_POOL_SIZE} DICE`
                : 'EMPTY POOL'}
            </Text>
            {rollMode !== 'normal' && selectedPool.length === 1 && (
              <View style={styles.autoPairBadge}>
                <Text style={styles.autoPairText}>AUTO 2x D{selectedPool[0]}</Text>
              </View>
            )}
          </View>

          <View style={styles.poolRightControls}>
            {/* Bonus / Modifier Stepper */}
            <View style={styles.modStepper}>
              <Pressable
                style={styles.modStepBtn}
                onPress={() => adjustModifier(-1)}
                disabled={isRolling}>
                <Text style={styles.modStepBtnText}>-</Text>
              </Pressable>
              <Text style={styles.modValueText}>
                {modifier >= 0 ? `+${modifier}` : modifier}
              </Text>
              <Pressable
                style={styles.modStepBtn}
                onPress={() => adjustModifier(1)}
                disabled={isRolling}>
                <Text style={styles.modStepBtnText}>+</Text>
              </Pressable>
            </View>

            {(selectedPool.length > 0 || modifier !== 0) && (
              <Pressable
                style={styles.clrBtn}
                onPress={() => {
                  clearPool();
                  setModifier(0);
                }}>
                <Text style={styles.clrBtnText}>CLR</Text>
              </Pressable>
            )}
          </View>
        </View>

        {selectedPool.length > 0 && (
          <View style={styles.chipsRow}>
            {selectedPool.map((sides, idx) => (
              <Pressable
                key={`${sides}-${idx}`}
                onPress={() => removeDieFromPool(idx)}
                style={styles.chip}>
                <Text style={styles.chipText}>D{sides} ×</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ROLL Butonu */}
      <TouchableOpacity
        style={[
          styles.rollBtn,
          {
            backgroundColor: activeTheme.facetBg,
            borderColor: activeTheme.borderColor,
            borderBottomColor: activeTheme.bevelColor,
          },
          (isRolling || selectedPool.length === 0) && styles.rollBtnDisabled,
        ]}
        onPress={rollSelectedDice}
        disabled={isRolling || selectedPool.length === 0}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="dice-multiple" size={22} color="#FFFFFF" />
        <Text style={styles.rollBtnText}>
          {isRolling ? 'TUMBLING IN TRAY...' : 'THROW DICE'}
        </Text>
      </TouchableOpacity>

      {/* Tekil Zar Sonuç Kartları (Dokununca Tekil Reroll Yapar) */}
      {rolledDice.length > 0 && (
        <View style={styles.resultsGrid}>
          {rolledDice.map((roll) => {
            const isCrit = !roll.dropped && roll.value === roll.sides;
            const isOne = !roll.dropped && roll.value === 1;
            return (
              <Pressable
                key={roll.id}
                disabled={isRolling}
                onPress={() => rerollSingleDie(roll.id)}
                style={({ pressed }) => [
                  styles.resultCard,
                  isCrit && styles.resultCardCrit,
                  isOne && styles.resultCardOne,
                  roll.dropped && styles.resultCardDropped,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}>
                <View style={styles.resultCardHeader}>
                  <Text style={styles.resultCardDie}>D{roll.sides}</Text>
                  {(roll.rerollCount ?? 0) > 0 && (
                    <Text style={styles.rerollTag}>↻{roll.rerollCount}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.resultCardVal,
                    isCrit && styles.resultValCrit,
                    isOne && styles.resultValOne,
                    roll.dropped && styles.resultValDropped,
                  ]}>
                  {roll.value}
                </Text>
                <Text style={styles.byteMetaText}>
                  {roll.dropped ? 'DROPPED' : `0x${roll.rawByte.toString(16).toUpperCase().padStart(2, '0')}`}
                </Text>
              </Pressable>
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    paddingBottom: 36,
  },
  topControlsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  themePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  themeDotBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDotSelected: {
    transform: [{ scale: 1.15 }],
  },
  themeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  themeNameLabel: {
    fontFamily: BUNGEE_FONT,
    fontSize: 10,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#334155',
    gap: 3,
  },
  modeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modeBtnNormActive: {
    backgroundColor: '#334155',
  },
  modeBtnAdvActive: {
    backgroundColor: '#15803D',
  },
  modeBtnDisActive: {
    backgroundColor: '#B91C1C',
  },
  modeBtnText: {
    fontFamily: BUNGEE_FONT,
    fontSize: 10,
    color: '#94A3B8',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  trayOuterFrame: {
    width: '100%',
    backgroundColor: '#271C19',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#5D4037',
    borderBottomWidth: 7,
    borderBottomColor: '#1B120F',
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  cornerRivet: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
    borderWidth: 1,
    borderColor: '#FEF08A',
    zIndex: 20,
  },
  rivetTL: { top: 6, left: 6 },
  rivetTR: { top: 6, right: 6 },
  rivetBL: { bottom: 6, left: 6 },
  rivetBR: { bottom: 6, right: 6 },
  trayInnerFelt: {
    width: '100%',
    height: 215,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E293B',
    overflow: 'hidden',
    position: 'relative',
  },
  trayWatermark: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTrayPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  emptyTraySub: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  trayFooterHint: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  trayFooterHintText: {
    fontFamily: BUNGEE_FONT,
    fontSize: 8.5,
    color: 'rgba(148, 163, 184, 0.55)',
    letterSpacing: 0.6,
  },
  totalBanner: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBannerLeft: {
    gap: 1,
  },
  totalLabel: {
    fontFamily: BUNGEE_FONT,
    color: '#CBD5E1',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  formulaText: {
    fontFamily: BUNGEE_FONT,
    color: '#64748B',
    fontSize: 9.5,
  },
  totalValueText: {
    fontFamily: BUNGEE_FONT,
    fontSize: 28,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  dieBtn: {
    width: '23%',
    flexGrow: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#334155',
    borderBottomColor: '#0F172A',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  countBadge: {
    position: 'absolute',
    top: 3,
    right: 4,
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    zIndex: 5,
  },
  countBadgeText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 8.5,
  },
  dieBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#94A3B8',
    fontSize: 13,
  },
  poolWrap: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
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
    flexWrap: 'wrap',
    gap: 6,
  },
  poolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  poolCountText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  autoPairBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  autoPairText: {
    fontFamily: BUNGEE_FONT,
    color: '#A7F3D0',
    fontSize: 8.5,
  },
  poolRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  modStepBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: '#1E293B',
  },
  modStepBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#E2E8F0',
    fontSize: 12,
  },
  modValueText: {
    fontFamily: BUNGEE_FONT,
    color: '#38BDF8',
    fontSize: 11,
    paddingHorizontal: 8,
  },
  clrBtn: {
    backgroundColor: '#3B181E',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  clrBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFCDD2',
    fontSize: 9.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
  },
  chipText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 10.5,
  },
  rollBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderBottomWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rollBtnDisabled: {
    backgroundColor: '#475569',
    borderColor: '#64748B',
    borderBottomColor: '#1E293B',
  },
  rollBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 1,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  resultCard: {
    width: '22%',
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 1,
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
  resultCardDropped: {
    opacity: 0.45,
    borderColor: '#1E293B',
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultCardDie: {
    fontFamily: BUNGEE_FONT,
    color: '#94A3B8',
    fontSize: 9.5,
  },
  rerollTag: {
    fontFamily: BUNGEE_FONT,
    color: '#38BDF8',
    fontSize: 8.5,
  },
  resultCardVal: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 20,
  },
  resultValCrit: {
    color: '#FFD54F',
  },
  resultValOne: {
    color: '#EF5350',
  },
  resultValDropped: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  byteMetaText: {
    fontFamily: BUNGEE_FONT,
    color: '#475569',
    fontSize: 7.5,
  },
});
