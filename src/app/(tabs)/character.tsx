import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RpgIcon, type RpgIconName } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';
import frpDatabase from '@/data/frp-classes.json';

const STORAGE_KEY = '@gediksapp:character_v1';
const LEVELS = ['1', '2', '3', '4', '5'] as const;
type LevelKey = (typeof LEVELS)[number];

interface ClassFeature {
  name: string;
  description: string;
}

interface LevelData {
  hp: number;
  proficiencyBonus: string;
  actions: string[];
  spellSlots: Record<string, number | undefined>;
  features: ClassFeature[];
}

interface FrpClassItem {
  id: string;
  name: string;
  turkishName: string;
  icon: string;
  hitDie: string;
  baseAc: number;
  primaryStat: string;
  description: string;
  levels: Record<LevelKey, LevelData>;
}

interface SavedCharacterData {
  characterName: string;
  classId: string;
  level: LevelKey;
  currentHp: number;
  usedSlots: Record<string, number>;
  savedAt: string;
}

const CLASSES = frpDatabase.classes as FrpClassItem[];

export default function CharacterScreen() {
  const [characterName, setCharacterName] = useState<string>('THORIN');
  const [selectedClassId, setSelectedClassId] = useState<string>('fighter');
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>('1');
  const [currentHp, setCurrentHp] = useState<number>(13);
  const [usedSlots, setUsedSlots] = useState<Record<string, number>>({});
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const activeClass =
    CLASSES.find((c) => c.id === selectedClassId) ?? CLASSES[0];
  const activeLevelData = activeClass.levels[selectedLevel];
  const maxHp = activeLevelData.hp;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw) as SavedCharacterData;
          if (parsed.characterName) setCharacterName(parsed.characterName);
          if (parsed.classId && CLASSES.some((c) => c.id === parsed.classId)) {
            setSelectedClassId(parsed.classId);
          }
          if (parsed.level && LEVELS.includes(parsed.level)) {
            setSelectedLevel(parsed.level);
          }
          if (typeof parsed.currentHp === 'number') {
            setCurrentHp(parsed.currentHp);
          }
          if (parsed.usedSlots) {
            setUsedSlots(parsed.usedSlots);
          }
        }
      } catch {
        // fallback
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const persistCharacter = async (
    nextName: string,
    nextClassId: string,
    nextLevel: LevelKey,
    nextHp: number,
    nextUsedSlots: Record<string, number>,
    manualTrigger = false
  ) => {
    try {
      const payload: SavedCharacterData = {
        characterName: nextName,
        classId: nextClassId,
        level: nextLevel,
        currentHp: nextHp,
        usedSlots: nextUsedSlots,
        savedAt: '1',
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setIsSaved(true);
      if (manualTrigger && Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      // error
    }
  };

  const handleSelectClass = (newClassId: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const targetClass = CLASSES.find((c) => c.id === newClassId) ?? CLASSES[0];
    const newMaxHp = targetClass.levels[selectedLevel].hp;
    setSelectedClassId(newClassId);
    setCurrentHp(newMaxHp);
    setUsedSlots({});
    if (isLoaded) {
      persistCharacter(characterName, newClassId, selectedLevel, newMaxHp, {});
    }
  };

  const handleSelectLevel = (newLevel: LevelKey) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const newMaxHp = activeClass.levels[newLevel].hp;
    setSelectedLevel(newLevel);
    setCurrentHp(newMaxHp);
    setUsedSlots({});
    if (isLoaded) {
      persistCharacter(characterName, selectedClassId, newLevel, newMaxHp, {});
    }
  };

  const adjustHp = (delta: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const nextHp = Math.max(0, Math.min(maxHp, currentHp + delta));
    setCurrentHp(nextHp);
    if (isLoaded) {
      persistCharacter(characterName, selectedClassId, selectedLevel, nextHp, usedSlots);
    }
  };

  const toggleSpellSlot = (slotName: string, totalSlots: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const currentUsed = usedSlots[slotName] ?? 0;
    const nextUsed = currentUsed >= totalSlots ? 0 : currentUsed + 1;
    const updated = { ...usedSlots, [slotName]: nextUsed };
    setUsedSlots(updated);
    if (isLoaded) {
      persistCharacter(characterName, selectedClassId, selectedLevel, currentHp, updated);
    }
  };

  const spellEntries = Object.entries(activeLevelData.spellSlots).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0
  );

  const hpPercentage = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* İsim ve Başlık */}
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <RpgIcon
            name={activeClass.icon as RpgIconName}
            size={30}
            color="#FFD54F"
          />
        </View>
        <View style={styles.heroInfo}>
          <TextInput
            value={characterName}
            onChangeText={(txt) => setCharacterName(txt)}
            onBlur={() =>
              persistCharacter(
                characterName,
                selectedClassId,
                selectedLevel,
                currentHp,
                usedSlots
              )
            }
            placeholder="NAME"
            placeholderTextColor="#64748B"
            style={styles.nameInput}
          />
          <Text style={styles.heroTag}>
            {activeClass.name.toUpperCase()} • LVL {selectedLevel}
          </Text>
        </View>
      </View>

      {/* Sınıf Seçimi */}
      <View style={styles.classGrid}>
        {CLASSES.map((cls) => {
          const isSelected = cls.id === selectedClassId;
          return (
            <Pressable
              key={cls.id}
              onPress={() => handleSelectClass(cls.id)}
              style={[styles.classChip, isSelected && styles.classChipActive]}>
              <RpgIcon
                name={cls.icon as RpgIconName}
                size={18}
                color={isSelected ? '#FFD54F' : '#94A3B8'}
              />
              <Text style={[styles.classChipTitle, isSelected && styles.classChipTitleActive]}>
                {cls.name.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Seviye Seçimi */}
      <View style={styles.levelRow}>
        {LEVELS.map((lvl) => {
          const isSelected = lvl === selectedLevel;
          return (
            <Pressable
              key={lvl}
              onPress={() => handleSelectLevel(lvl)}
              style={[styles.levelBtn, isSelected && styles.levelBtnActive]}>
              <Text style={[styles.levelBtnLabel, isSelected && styles.levelBtnLabelActive]}>
                L{lvl}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* HP Bar */}
      <View style={styles.vitalsCard}>
        <View style={styles.hpHeaderRow}>
          <Text style={styles.hpLabel}>HP</Text>
          <Text style={styles.hpValueText}>
            {currentHp} / {maxHp}
          </Text>
        </View>

        <View style={styles.hpBarTrack}>
          <View style={[styles.hpBarFill, { width: `${hpPercentage}%` }]} />
        </View>

        <View style={styles.hpButtonsRow}>
          <Pressable style={[styles.hpBtn, styles.hpBtnDmg]} onPress={() => adjustHp(-5)}>
            <Text style={styles.hpBtnText}>-5</Text>
          </Pressable>
          <Pressable style={[styles.hpBtn, styles.hpBtnDmg]} onPress={() => adjustHp(-1)}>
            <Text style={styles.hpBtnText}>-1</Text>
          </Pressable>
          <Pressable style={[styles.hpBtn, styles.hpBtnHeal]} onPress={() => adjustHp(1)}>
            <Text style={styles.hpBtnText}>+1</Text>
          </Pressable>
          <Pressable style={[styles.hpBtn, styles.hpBtnHeal]} onPress={() => adjustHp(5)}>
            <Text style={styles.hpBtnText}>+5</Text>
          </Pressable>
        </View>

        {/* 4 Ana Metrik */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{activeClass.baseAc}</Text>
            <Text style={styles.metricLbl}>AC</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{activeLevelData.proficiencyBonus}</Text>
            <Text style={styles.metricLbl}>PROF</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{activeClass.hitDie.toUpperCase()}</Text>
            <Text style={styles.metricLbl}>DIE</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{activeClass.primaryStat.split('/')[0].trim()}</Text>
            <Text style={styles.metricLbl}>STAT</Text>
          </View>
        </View>
      </View>

      {/* Aksiyonlar */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>ACTIONS</Text>
        <View style={styles.listWrap}>
          {activeLevelData.actions.map((action, index) => (
            <View key={index} style={styles.actionRow}>
              <View style={styles.dot} />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Büyü Slotları (varsa) */}
      {spellEntries.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>SPELLS</Text>
          <View style={styles.slotsGrid}>
            {spellEntries.map(([slotTier, maxCount]) => {
              const spent = usedSlots[slotTier] ?? 0;
              const remaining = Math.max(0, maxCount - spent);
              return (
                <Pressable
                  key={slotTier}
                  onPress={() => toggleSpellSlot(slotTier, maxCount)}
                  style={styles.slotCard}>
                  <Text style={styles.slotTierText}>{slotTier.toUpperCase()}</Text>
                  <Text style={styles.slotCountText}>
                    {remaining}/{maxCount}
                  </Text>
                  <View style={styles.orbsRow}>
                    {Array.from({ length: maxCount }).map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.orb,
                          idx < remaining ? styles.orbFull : styles.orbEmpty,
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Özellikler */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>TRAITS</Text>
        <View style={styles.listWrap}>
          {activeLevelData.features.map((feat, idx) => (
            <View key={idx} style={styles.traitBox}>
              <Text style={styles.traitTitle}>{feat.name}</Text>
              <Text style={styles.traitDesc}>{feat.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Save Butonu */}
      <Pressable
        style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
        onPress={() =>
          persistCharacter(
            characterName,
            selectedClassId,
            selectedLevel,
            currentHp,
            usedSlots,
            true
          )
        }>
        <Text style={styles.saveBtnText}>{isSaved ? 'SAVED!' : 'SAVE'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    padding: 14,
    gap: 12,
    paddingBottom: 36,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderBottomWidth: 5,
    borderBottomColor: '#0D47A1',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  nameInput: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 18,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroTag: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 11,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  classChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#FFD54F',
    borderBottomColor: '#9A7D0A',
  },
  classChipTitle: {
    fontFamily: BUNGEE_FONT,
    color: '#CBD5E1',
    fontSize: 12,
  },
  classChipTitleActive: {
    color: '#FFFFFF',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 6,
  },
  levelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#020617',
    alignItems: 'center',
  },
  levelBtnActive: {
    backgroundColor: '#332A10',
    borderColor: '#FFD54F',
    borderBottomColor: '#9A7D0A',
  },
  levelBtnLabel: {
    fontFamily: BUNGEE_FONT,
    color: '#94A3B8',
    fontSize: 12,
  },
  levelBtnLabelActive: {
    color: '#FFD54F',
  },
  vitalsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
  },
  hpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hpLabel: {
    fontFamily: BUNGEE_FONT,
    color: '#EF5350',
    fontSize: 14,
  },
  hpValueText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 16,
  },
  hpBarTrack: {
    height: 10,
    backgroundColor: '#0F172A',
    borderRadius: 5,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#EF5350',
  },
  hpButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  hpBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  hpBtnDmg: {
    backgroundColor: '#3B181E',
    borderColor: '#EF5350',
    borderBottomColor: '#7F1D1D',
  },
  hpBtnHeal: {
    backgroundColor: '#143326',
    borderColor: '#66BB6A',
    borderBottomColor: '#14532D',
  },
  hpBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 11,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricVal: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 13,
  },
  metricLbl: {
    fontFamily: BUNGEE_FONT,
    color: '#64748B',
    fontSize: 9,
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
  },
  sectionHeading: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  listWrap: {
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD54F',
  },
  actionText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    gap: 3,
  },
  slotTierText: {
    fontFamily: BUNGEE_FONT,
    color: '#93C5FD',
    fontSize: 10,
  },
  slotCountText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 16,
  },
  orbsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  orb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  orbFull: {
    backgroundColor: '#3B82F6',
    borderColor: '#93C5FD',
  },
  orbEmpty: {
    backgroundColor: 'transparent',
    borderColor: '#475569',
  },
  traitBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  traitTitle: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 11,
  },
  traitDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#86EFAC',
    borderBottomWidth: 5,
    borderBottomColor: '#14532D',
    alignItems: 'center',
  },
  saveBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 1,
  },
});
