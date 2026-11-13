import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RpgIcon } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';
import { pickCryptoRandomItem } from '@/utils/crypto-dice';

// 1. NPC VERİLERİ
const NPC_NAMES = [
  'Aldren (Bard)',
  'Baelgor (Smith)',
  'Seraphina (Mage)',
  'Kaelen (Rogue)',
  'Morwenna (Ranger)',
  'Garrick (Innkeeper)',
  'Liora (Runesmith)',
  'Varian (Knight)',
];

const NPC_PERSONALITIES = [
  'Paranoid, watches every door.',
  'Cheery, always speaks in riddles.',
  'Greedy, demands gold for everything.',
  'Cold, speaks with military tone.',
  'Pretends clumsy, notices every detail.',
  'Kind, hates all arcane magic.',
];

const NPC_SECRETS = [
  'Wanted guild assassin in hiding.',
  'Keeps a forbidden demon seal.',
  'Sold caravan routes to bandits.',
  'Last true heir to fallen throne.',
  'Carries a dormant werewolf curse.',
  'Secret spy for the dark council.',
];

// 2. DÜŞMAN VERİLERİ
const ENEMY_TYPES = [
  'Red Manticore',
  'Crypt Wight',
  'Shadow Demon',
  'Cave Troll',
  'Blood Cultist',
  'Crystal Spider',
  'Hell Hound',
  'Bone Golem',
];

const ENEMY_HPS = [
  '45 HP • AC 14',
  '68 HP • AC 16',
  '84 HP • AC 17',
  '56 HP • AC 15',
  '115 HP • AC 18',
  '38 HP • AC 13',
  '92 HP • AC 16',
];

const ENEMY_SPECIAL_ATTACKS = [
  'Soul Shriek: 3d6 necrotic damage & Frightened.',
  'Acid Spike: +6 to hit, 2d8+3 acid spray.',
  'Shadow Step: Teleport & 4d6 sneak strike.',
  'Fire Breath: 15ft cone, 6d6 fire blast.',
  'Bone Slam: 2d12+5 bludgeoning & Knock Prone.',
  'Mind Lock: DC 14 INT, Paralyzed & 2d8 psychic.',
];

// 3. LOOT VERİLERİ
const LOOT_ITEMS = [
  'Mithril Greatsword',
  'Elven Longbow',
  'Obsidian Dagger',
  'Dragon Scale Mail',
  'Arcane Runestaff',
  'Silver War Hammer',
  'Shadow Cloak',
  'Ruby Signet Ring',
];

const LOOT_MAGIC_AFFIXES = [
  'Flame (+1 hit, +1d6 fire damage)',
  'Vampiric (Heals half damage dealt)',
  'Storm (Triggers 3d8 Lightning once/day)',
  'Frost (+2 AC, cold resistance)',
  'Ghost (+10ft speed & initiative advantage)',
  'Void (Crits on 19-20, +1d8 force)',
];

const LOOT_GOLD_VALUES = [
  '180 GP',
  '350 GP',
  '600 GP',
  '950 GP',
  '1,400 GP',
  '2,500 GP',
];

interface GeneratedNPC {
  name: string;
  personality: string;
  secret: string;
}

interface GeneratedEnemy {
  monsterType: string;
  hp: string;
  specialAttack: string;
}

interface GeneratedLoot {
  itemType: string;
  magicAffix: string;
  goldValue: string;
}

export default function DMToolsScreen() {
  const [npc, setNpc] = useState<GeneratedNPC>({
    name: NPC_NAMES[0],
    personality: NPC_PERSONALITIES[0],
    secret: NPC_SECRETS[0],
  });

  const [enemy, setEnemy] = useState<GeneratedEnemy>({
    monsterType: ENEMY_TYPES[0],
    hp: ENEMY_HPS[0],
    specialAttack: ENEMY_SPECIAL_ATTACKS[0],
  });

  const [loot, setLoot] = useState<GeneratedLoot>({
    itemType: LOOT_ITEMS[0],
    magicAffix: LOOT_MAGIC_AFFIXES[0],
    goldValue: LOOT_GOLD_VALUES[0],
  });

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const generateRandomNPC = async () => {
    triggerHaptic();
    const [name, personality, secret] = await Promise.all([
      pickCryptoRandomItem(NPC_NAMES),
      pickCryptoRandomItem(NPC_PERSONALITIES),
      pickCryptoRandomItem(NPC_SECRETS),
    ]);
    setNpc({ name, personality, secret });
  };

  const generateRandomEnemy = async () => {
    triggerHaptic();
    const [monsterType, hp, specialAttack] = await Promise.all([
      pickCryptoRandomItem(ENEMY_TYPES),
      pickCryptoRandomItem(ENEMY_HPS),
      pickCryptoRandomItem(ENEMY_SPECIAL_ATTACKS),
    ]);
    setEnemy({ monsterType, hp, specialAttack });
  };

  const generateRandomLoot = async () => {
    triggerHaptic();
    const [itemType, magicAffix, goldValue] = await Promise.all([
      pickCryptoRandomItem(LOOT_ITEMS),
      pickCryptoRandomItem(LOOT_MAGIC_AFFIXES),
      pickCryptoRandomItem(LOOT_GOLD_VALUES),
    ]);
    setLoot({ itemType, magicAffix, goldValue });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* 1. NPC Kartı */}
      <View style={[styles.card, styles.npcBorder]}>
        <View style={styles.cardTop}>
          <RpgIcon name="shield-account" size={18} color="#64B5F6" />
          <Text style={[styles.cardTitle, { color: '#64B5F6' }]}>NPC</Text>
        </View>

        <View style={styles.contentBox}>
          <Text style={styles.mainTitle}>{npc.name}</Text>
          <Text style={styles.subText}>{npc.personality}</Text>
          <Text style={styles.secretText}>SECRET: {npc.secret}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, styles.npcBtn, pressed && styles.btnPressed]}
          onPress={generateRandomNPC}>
          <Text style={styles.btnText}>GENERATE</Text>
        </Pressable>
      </View>

      {/* 2. ENEMY Kartı */}
      <View style={[styles.card, styles.enemyBorder]}>
        <View style={styles.cardTop}>
          <RpgIcon name="shield-sword" size={18} color="#EF5350" />
          <Text style={[styles.cardTitle, { color: '#EF5350' }]}>ENEMY</Text>
        </View>

        <View style={styles.contentBox}>
          <View style={styles.enemyHeader}>
            <Text style={styles.mainTitle}>{enemy.monsterType}</Text>
            <Text style={styles.hpBadge}>{enemy.hp}</Text>
          </View>
          <Text style={styles.subText}>{enemy.specialAttack}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, styles.enemyBtn, pressed && styles.btnPressed]}
          onPress={generateRandomEnemy}>
          <Text style={styles.btnText}>GENERATE</Text>
        </Pressable>
      </View>

      {/* 3. LOOT Kartı */}
      <View style={[styles.card, styles.lootBorder]}>
        <View style={styles.cardTop}>
          <RpgIcon name="star-four-points" size={18} color="#FFD54F" />
          <Text style={[styles.cardTitle, { color: '#FFD54F' }]}>LOOT</Text>
        </View>

        <View style={styles.contentBox}>
          <View style={styles.lootHeader}>
            <Text style={styles.mainTitle}>{loot.itemType}</Text>
            <Text style={styles.goldBadge}>{loot.goldValue}</Text>
          </View>
          <Text style={styles.subText}>{loot.magicAffix}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, styles.lootBtn, pressed && styles.btnPressed]}
          onPress={generateRandomLoot}>
          <Text style={styles.btnText}>GENERATE</Text>
        </Pressable>
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
    padding: 14,
    gap: 12,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 2,
    borderBottomWidth: 5,
  },
  npcBorder: {
    borderColor: '#1E88E5',
    borderBottomColor: '#0D47A1',
  },
  enemyBorder: {
    borderColor: '#E53935',
    borderBottomColor: '#7F1D1D',
  },
  lootBorder: {
    borderColor: '#F59E0B',
    borderBottomColor: '#78350F',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontFamily: BUNGEE_FONT,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  contentBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mainTitle: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 13,
  },
  subText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  secretText: {
    color: '#F48FB1',
    fontSize: 11,
    fontWeight: '700',
  },
  enemyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  hpBadge: {
    fontFamily: BUNGEE_FONT,
    color: '#EF5350',
    fontSize: 10,
  },
  lootHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  goldBadge: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 11,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
  },
  npcBtn: {
    backgroundColor: '#1E88E5',
    borderColor: '#90CAF9',
    borderBottomColor: '#0D47A1',
  },
  enemyBtn: {
    backgroundColor: '#E53935',
    borderColor: '#FF8A80',
    borderBottomColor: '#8E0000',
  },
  lootBtn: {
    backgroundColor: '#D97706',
    borderColor: '#FDE68A',
    borderBottomColor: '#78350F',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.8,
  },
});
