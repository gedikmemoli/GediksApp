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
  const [characterName, setCharacterName] = useState<string>('Thorin Demirbilek');
  const [selectedClassId, setSelectedClassId] = useState<string>('fighter');
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>('1');
  const [currentHp, setCurrentHp] = useState<number>(13);
  const [usedSlots, setUsedSlots] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<string>('Cihaz hafızasından yüklendi');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const activeClass =
    CLASSES.find((c) => c.id === selectedClassId) ?? CLASSES[0];
  const activeLevelData = activeClass.levels[selectedLevel];
  const maxHp = activeLevelData.hp;

  // AsyncStorage'dan kayıtlı karakteri yükle
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
          if (parsed.savedAt) {
            setSaveStatus(`Son kayıt: ${parsed.savedAt}`);
          }
        }
      } catch {
        // İlk açılış veya okuma hatası durumunda varsayılan değerler korunur
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
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const payload: SavedCharacterData = {
        characterName: nextName,
        classId: nextClassId,
        level: nextLevel,
        currentHp: nextHp,
        usedSlots: nextUsedSlots,
        savedAt: timeStr,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSaveStatus(
        manualTrigger
          ? `✓ AsyncStorage'a kaydedildi (${timeStr})`
          : `Otomatik kaydedildi (${timeStr})`
      );
      if (manualTrigger && Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setSaveStatus('Kayıt sırasında hata oluştu');
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
      {/* Karakter Başlığı ve İsim Düzenleme */}
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <RpgIcon
            name={activeClass.icon as RpgIconName}
            size={34}
            color="#FFD54F"
          />
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.screenTag}>CHARACTER BUILDER • ASYNCSTORAGE</Text>
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
            placeholder="Karakter Adı Girin..."
            placeholderTextColor="#64748B"
            style={styles.nameInput}
          />
          <Text style={styles.heroClass}>
            Seviye {selectedLevel} • {activeClass.name} ({activeClass.turkishName})
          </Text>
        </View>
      </View>

      {/* Sınıf (Class) Seçici */}
      <View style={styles.selectorCard}>
        <Text style={styles.sectionTitle}>1. FRP SINIFINI SEÇ (CLASS)</Text>
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
                  size={20}
                  color={isSelected ? '#FFD54F' : '#94A3B8'}
                />
                <Text style={[styles.classChipTitle, isSelected && styles.classChipTitleActive]}>
                  {cls.name}
                </Text>
                <Text style={styles.classChipSubtitle}>{cls.turkishName}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.classDescription}>{activeClass.description}</Text>

        {/* Seviye (Level) Seçici */}
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>
          2. SEVİYE SEÇ (LEVEL 1 - 5)
        </Text>
        <View style={styles.levelRow}>
          {LEVELS.map((lvl) => {
            const isSelected = lvl === selectedLevel;
            return (
              <Pressable
                key={lvl}
                onPress={() => handleSelectLevel(lvl)}
                style={[styles.levelBtn, isSelected && styles.levelBtnActive]}>
                <Text style={[styles.levelBtnLabel, isSelected && styles.levelBtnLabelActive]}>
                  LVL {lvl}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Dinamik Savaş İstatistikleri ve HP */}
      <View style={styles.vitalsCard}>
        <View style={styles.hpHeaderRow}>
          <View style={styles.hpTitleGroup}>
            <RpgIcon name="heart" size={18} color="#EF5350" />
            <Text style={styles.vitalsLabel}>CAN PUANI (HP)</Text>
          </View>
          <Text style={styles.hpValueText}>
            {currentHp} / {maxHp}
          </Text>
        </View>

        <View style={styles.hpBarTrack}>
          <View style={[styles.hpBarFill, { width: `${hpPercentage}%` }]} />
        </View>

        <View style={styles.hpButtonsRow}>
          <Pressable style={[styles.hpBtn, styles.hpBtnDamage]} onPress={() => adjustHp(-5)}>
            <Text style={styles.hpBtnText}>-5</Text>
          </Pressable>
          <Pressable style={[styles.hpBtn, styles.hpBtnDamage]} onPress={() => adjustHp(-1)}>
            <Text style={styles.hpBtnText}>-1</Text>
          </Pressable>
          <Pressable style={[styles.hpBtn, styles.hpBtnHeal]} onPress={() => adjustHp(1)}>
            <Text style={styles.hpBtnText}>+1</Text>
          </Pressable>
          <Pressable style={[styles.hpBtn, styles.hpBtnHeal]} onPress={() => adjustHp(5)}>
            <Text style={styles.hpBtnText}>+5</Text>
          </Pressable>
        </View>

        <View style={styles.combatMetricsRow}>
          <View style={styles.metricBox}>
            <RpgIcon name="shield" size={20} color="#42A5F5" />
            <Text style={styles.metricValue}>{activeClass.baseAc}</Text>
            <Text style={styles.metricLabel}>Zırh (AC)</Text>
          </View>
          <View style={styles.metricBox}>
            <RpgIcon name="flash" size={20} color="#FFD54F" />
            <Text style={styles.metricValue}>{activeLevelData.proficiencyBonus}</Text>
            <Text style={styles.metricLabel}>Uzmanlık</Text>
          </View>
          <View style={styles.metricBox}>
            <RpgIcon name="dice-d20" size={20} color="#AB47BC" />
            <Text style={styles.metricValue}>{activeClass.hitDie}</Text>
            <Text style={styles.metricLabel}>Can Zarı</Text>
          </View>
          <View style={styles.metricBox}>
            <RpgIcon name="star-four-points" size={20} color="#66BB6A" />
            <Text style={styles.metricValue}>{activeClass.primaryStat}</Text>
            <Text style={styles.metricLabel}>Ana Stat</Text>
          </View>
        </View>
      </View>

      {/* Dinamik Aksiyonlar (Sadece seçilen sınıf ve seviyeye ait) */}
      <View style={styles.dynamicSectionCard}>
        <View style={styles.cardHeaderRow}>
          <RpgIcon name="shield-sword" size={20} color="#FFD54F" />
          <Text style={styles.sectionTitle}>
            MEVCUT AKSİYONLAR ({activeClass.name.toUpperCase()} • LVL {selectedLevel})
          </Text>
        </View>
        <View style={styles.listContainer}>
          {activeLevelData.actions.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <View style={styles.actionDot} />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Dinamik Büyü Slotları (Spell Slots) */}
      <View style={styles.dynamicSectionCard}>
        <View style={styles.cardHeaderRow}>
          <RpgIcon name="book-open-variant" size={20} color="#64B5F6" />
          <Text style={styles.sectionTitle}>
            BÜYÜ SLOTLARI (SPELL SLOTS • LVL {selectedLevel})
          </Text>
        </View>
        {spellEntries.length === 0 ? (
          <View style={styles.noSpellsBox}>
            <Text style={styles.noSpellsText}>
              {activeClass.name} sınıfı Seviye {selectedLevel}&apos;de büyü slotu kullanmaz; fiziksel/dövüş yeteneklerine odaklanır.
            </Text>
          </View>
        ) : (
          <View style={styles.spellSlotsGrid}>
            {spellEntries.map(([slotTier, maxCount]) => {
              const spent = usedSlots[slotTier] ?? 0;
              const remaining = Math.max(0, maxCount - spent);
              return (
                <Pressable
                  key={slotTier}
                  onPress={() => toggleSpellSlot(slotTier, maxCount)}
                  style={styles.spellSlotCard}>
                  <Text style={styles.spellSlotTier}>{slotTier}</Text>
                  <Text style={styles.spellSlotCount}>
                    {remaining} / {maxCount}
                  </Text>
                  <View style={styles.slotOrbsRow}>
                    {Array.from({ length: maxCount }).map((_, idx) => {
                      const isAvailable = idx < remaining;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.slotOrb,
                            isAvailable ? styles.slotOrbFull : styles.slotOrbSpent,
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Text style={styles.slotHint}>Harcamak için dokun</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Dinamik Sınıf Özellikleri (Features) */}
      <View style={styles.dynamicSectionCard}>
        <View style={styles.cardHeaderRow}>
          <RpgIcon name="crown" size={20} color="#CE93D8" />
          <Text style={styles.sectionTitle}>
            SINIF ÖZELLİKLERİ VE YETENEKLER (LVL {selectedLevel})
          </Text>
        </View>
        <View style={styles.listContainer}>
          {activeLevelData.features.map((feat, idx) => (
            <View key={idx} style={styles.featureBox}>
              <Text style={styles.featureTitle}>{feat.name}</Text>
              <Text style={styles.featureDesc}>{feat.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AsyncStorage Kayıt Butonu ve Durumu */}
      <View style={styles.saveFooter}>
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
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
          <RpgIcon name="script-text" size={20} color="#FFF8E1" />
          <Text style={styles.saveButtonText}>KARAKTERİ CİHAZA KAYDET</Text>
        </Pressable>
        <Text style={styles.saveStatusText}>{saveStatus}</Text>
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
    padding: 16,
    gap: 14,
    paddingBottom: 36,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderBottomWidth: 5,
    borderBottomColor: '#0D47A1',
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
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
  screenTag: {
    color: '#64B5F6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  nameInput: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroClass: {
    color: '#FFD54F',
    fontSize: 13,
    fontWeight: '800',
  },
  selectorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
  },
  sectionTitle: {
    color: '#FFD54F',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#020617',
    alignItems: 'center',
    gap: 2,
  },
  classChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#FFD54F',
    borderBottomColor: '#9A7D0A',
  },
  classChipTitle: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '900',
  },
  classChipTitleActive: {
    color: '#FFFFFF',
  },
  classChipSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  classDescription: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0F172A',
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
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '900',
  },
  levelBtnLabelActive: {
    color: '#FFD54F',
  },
  vitalsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
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
  hpTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vitalsLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  hpValueText: {
    color: '#FFD54F',
    fontSize: 18,
    fontWeight: '900',
  },
  hpBarTrack: {
    height: 12,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#EF5350',
    borderRadius: 6,
  },
  hpButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hpBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  hpBtnDamage: {
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  combatMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 2,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  dynamicSectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listContainer: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD54F',
  },
  actionText: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  noSpellsBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  noSpellsText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  spellSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  spellSlotCard: {
    width: '46%',
    flexGrow: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    gap: 4,
  },
  spellSlotTier: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
  },
  spellSlotCount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  slotOrbsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 2,
  },
  slotOrb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  slotOrbFull: {
    backgroundColor: '#3B82F6',
    borderColor: '#93C5FD',
  },
  slotOrbSpent: {
    backgroundColor: 'transparent',
    borderColor: '#475569',
  },
  slotHint: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  featureBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  featureTitle: {
    color: '#FFD54F',
    fontSize: 14,
    fontWeight: '900',
  },
  featureDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  saveFooter: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#86EFAC',
    borderBottomWidth: 5,
    borderBottomColor: '#14532D',
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  saveStatusText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});
