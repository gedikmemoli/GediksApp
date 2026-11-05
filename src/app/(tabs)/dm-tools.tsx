import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RpgIcon } from '@/components/rpg-icon';
import { pickCryptoRandomItem } from '@/utils/crypto-dice';

// 1. RASTGELE NPC JENERATÖRÜ VERİ DİZİLERİ (İsim, Kişilik Özelliği, Sır)
const NPC_NAMES: string[] = [
  'Aldren Gümüşdil (Yarı-Elf Ozan)',
  'Baelgor Kayaçekiç (Cüce Demirci)',
  'Seraphina Vane (İnsan Simyacı)',
  'Kaelen Gölgeadım (Tiefling Haberci)',
  'Morwenna Külfısıltısı (Orman Elfi Korucu)',
  'Garrick Demirpençe (Yarı-Ork Hancı)',
  'Liora Yıldızdokuyan (Gnome Rün Ustası)',
  'Varian Korgöz (İnsan Eski Şövalye)',
];

const NPC_PERSONALITIES: string[] = [
  'Aşırı şüpheci; konuşurken sürekli kapıyı ve pencereleri kontrol eder.',
  'Son derece neşeli ama her cümlesini eski bir kehanetle bitirir.',
  'Altın sesi duyduğunda gözleri parlar, pazarlık yapmadan su bile vermez.',
  'Soğukkanlı ve resmi; her soruya askeri bir disiplinle yanıt verir.',
  'Unutkan görünür ancak karşısındakinin en küçük yalanını bile anında yakalar.',
  'Cömert ve misafirperver; ancak büyücülere karşı derin bir önyargısı vardır.',
];

const NPC_SECRETS: string[] = [
  'Kraliyet muhafızlarından kaçan eski bir suikast loncası lideri.',
  'Mahzeninde mühürlü bir İblis Tılsımı saklıyor ve geceleri onunla konuşuyor.',
  'Kasabadaki kayıp kervanların güzergahını haydutlara bizzat kendisi sızdırdı.',
  'Aslında yüz yıl önce düşmüş bir sınır kalesinin son meşru varisi.',
  'Üzerindeki yara izi bir kurt saldırısından değil, lanetli bir likantropluk ritüelinden kalma.',
  'Partideki maceracıları gizlice gözetlemek için Karanlık Konsey tarafından tutuldu.',
];

// 2. RASTGELE DÜŞMAN JENERATÖRÜ VERİ DİZİLERİ (Canavar Türü, HP, Özel Saldırı)
const ENEMY_TYPES: string[] = [
  'Kızıl Kabuklu Manticore',
  'Zırhlı Mezar Şövalyesi (Wight)',
  'Hiçlikten Gelen Gölge İblisi',
  'Kadim Mağara Trolü',
  'Kan Büyücüsü Kultist Lideri',
  'Zehirli Kristal Örümcek Kraliçesi',
  'Cehennem Ateşi Tazısı (Hell Hound)',
  'Rünlü Kemik Golem Muhafızı',
];

const ENEMY_HPS: string[] = [
  '45 HP (Zırh Sınıfı: 14)',
  '68 HP (Zırh Sınıfı: 16)',
  '84 HP (Zırh Sınıfı: 17)',
  '56 HP (Zırh Sınıfı: 15)',
  '115 HP (Zırh Sınıfı: 18 • Boss)',
  '38 HP (Zırh Sınıfı: 13)',
  '92 HP (Zırh Sınıfı: 16)',
];

const ENEMY_SPECIAL_ATTACKS: string[] = [
  'Ruh Sömüren Çığlık: 30 ft alandaki herkes DC 14 WIS kurtarma atışı yapmalı; başarısız olanlar 3d6 nekrotik hasar alır ve Korkmuş (Frightened) olur.',
  'Asitli Diken Yağmuru: Menzilli 3 hedefe aynı anda +6 isabet ile 2d8+3 asit hasarı fırlatır.',
  'Gölge Adımı & Arkadan Saplama: Karanlık bir noktaya ışınlanır ve avantajlı saldırıyla 4d6+4 delici hasar vurur.',
  'Volkanik Nefes (Dolum 5-6): 15 ft koni alanında 6d6 ateş hasarı (DC 15 DEX ile yarı hasar).',
  'Kemik Kırıcı Darbe: İsabet halinde 2d12+5 künt hasar verir ve hedefi 10 ft geriye savurup Yere Devirir (Prone).',
  'Zihin Kilidi Laneti: Hedefi DC 14 INT ile 1 tur boyunca Felç (Paralyzed) bırakır ve 2d8 psişik hasar verir.',
];

// 3. RASTGELE LOOT JENERATÖRÜ VERİ DİZİLERİ (Silah/Eşya Türü, Sihirli Ek, Altın Değeri)
const LOOT_ITEMS: string[] = [
  'Çift Elli Mithril Büyük Kılıç',
  'Elf İşlemesi Uzun Yay',
  'Obsidyen Saplı Suikast Hançeri',
  'Ejderha Pulu Göğüs Zırhı',
  'Kadim Rünlü Büyücü Asası',
  'Gümüş Kakmalı Savaş Çekici',
  'Gölge Dokuması Pelerin',
  'Yakut Taşlı Mühür Yüzüğü',
];

const LOOT_MAGIC_AFFIXES: string[] = [
  'Alev Kusan (+1 Saldırı, her vuruşta ekstra +1d6 Ateş Hasarı)',
  'Vampirik Dokunuş (Kritik vuruşlarda verilen hasarın yarısı kadar HP iyileştirir)',
  'Yıldırım Çağıran (Günde 1 kez 3d8 Lightning Bolt büyüsü tetikler)',
  'Buzul Muhafızı (+2 AC ve Soğuk hasarına karşı Tam Direnç sağlar)',
  'Ruhbağlayan (Sahibine İnisiyatif zarlarında Avantaj ve +10 ft Hız kazandırır)',
  'Hiçlik Keskinliği (19 ve 20 zarlarında Kritik Vuruş yapar ve +1d8 Güç Hasarı ekler)',
];

const LOOT_GOLD_VALUES: string[] = [
  '180 Altın (GP)',
  '350 Altın (GP)',
  '600 Altın (GP)',
  '950 Altın (GP)',
  '1.400 Altın (GP)',
  '2.500 Altın (GP • Nadir Koleksiyon Değeri)',
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

  // 1. Rastgele NPC Jeneratörü
  const generateRandomNPC = async () => {
    triggerHaptic();
    const [name, personality, secret] = await Promise.all([
      pickCryptoRandomItem(NPC_NAMES),
      pickCryptoRandomItem(NPC_PERSONALITIES),
      pickCryptoRandomItem(NPC_SECRETS),
    ]);
    setNpc({ name, personality, secret });
  };

  // 2. Rastgele Düşman Jeneratörü
  const generateRandomEnemy = async () => {
    triggerHaptic();
    const [monsterType, hp, specialAttack] = await Promise.all([
      pickCryptoRandomItem(ENEMY_TYPES),
      pickCryptoRandomItem(ENEMY_HPS),
      pickCryptoRandomItem(ENEMY_SPECIAL_ATTACKS),
    ]);
    setEnemy({ monsterType, hp, specialAttack });
  };

  // 3. Rastgele Loot Jeneratörü
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
      {/* DM Banner */}
      <View style={styles.dmBanner}>
        <View style={styles.dmIconBox}>
          <RpgIcon name="crown" size={32} color="#FFD54F" />
        </View>
        <View style={styles.dmBannerInfo}>
          <Text style={styles.dmTag}>DM TOOLS • PROSEDÜREL İÇERİK ÜRETİCİ</Text>
          <Text style={styles.dmTitle}>Zindan Efendisi Atölyesi</Text>
          <Text style={styles.dmDesc}>
            Rastgele NPC, Düşman (Monster) ve Sihirli Ganimet (Loot) Jeneratörleri
          </Text>
        </View>
      </View>

      {/* 1. RASTGELE NPC JENERATÖRÜ */}
      <View style={[styles.generatorCard, styles.npcCardBorder]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <RpgIcon name="shield-account" size={22} color="#64B5F6" />
            <View>
              <Text style={styles.generatorCategory}>1. PROSEDÜREL JENERATÖR</Text>
              <Text style={styles.generatorTitle}>Rastgele NPC Jeneratörü</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultBox}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#64B5F6' }]}>İSİM:</Text>
            <Text style={styles.fieldMainValue}>{npc.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#93C5FD' }]}>KİŞİLİK ÖZELLİĞİ:</Text>
            <Text style={styles.fieldValue}>{npc.personality}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#F48FB1' }]}>GİZLİ SIRRI:</Text>
            <Text style={styles.fieldValue}>{npc.secret}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.generateButton,
            styles.npcButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={generateRandomNPC}>
          <RpgIcon name="dice-multiple" size={18} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>NPC OLUŞTUR (GENERATE)</Text>
        </Pressable>
      </View>

      {/* 2. RASTGELE DÜŞMAN JENERATÖRÜ */}
      <View style={[styles.generatorCard, styles.enemyCardBorder]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <RpgIcon name="shield-sword" size={22} color="#EF5350" />
            <View>
              <Text style={styles.generatorCategory}>2. PROSEDÜREL JENERATÖR</Text>
              <Text style={styles.generatorTitle}>Rastgele Düşman Jeneratörü</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultBox}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#EF5350' }]}>CANAVAR TÜRÜ:</Text>
            <Text style={styles.fieldMainValue}>{enemy.monsterType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#FF8A80' }]}>CAN PUANI (HP) & ZIRH:</Text>
            <Text style={styles.fieldHighlightRed}>{enemy.hp}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#FFCC80' }]}>ÖZEL SALDIRI:</Text>
            <Text style={styles.fieldValue}>{enemy.specialAttack}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.generateButton,
            styles.enemyButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={generateRandomEnemy}>
          <RpgIcon name="dice-multiple" size={18} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>DÜŞMAN OLUŞTUR (GENERATE)</Text>
        </Pressable>
      </View>

      {/* 3. RASTGELE LOOT JENERATÖRÜ */}
      <View style={[styles.generatorCard, styles.lootCardBorder]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <RpgIcon name="star-four-points" size={22} color="#FFD54F" />
            <View>
              <Text style={styles.generatorCategory}>3. PROSEDÜREL JENERATÖR</Text>
              <Text style={styles.generatorTitle}>Rastgele Loot Jeneratörü</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultBox}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#FFD54F' }]}>SİLAH / EŞYA TÜRÜ:</Text>
            <Text style={styles.fieldMainValue}>{loot.itemType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#CE93D8' }]}>SİHİRLİ EK (EFSUN):</Text>
            <Text style={styles.fieldValue}>{loot.magicAffix}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: '#81C784' }]}>ALTIN DEĞERİ:</Text>
            <Text style={styles.fieldHighlightGold}>{loot.goldValue}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.generateButton,
            styles.lootButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={generateRandomLoot}>
          <RpgIcon name="dice-multiple" size={18} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>LOOT OLUŞTUR (GENERATE)</Text>
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
    padding: 16,
    gap: 16,
    paddingBottom: 36,
  },
  dmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#2A1238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: '#AB47BC',
    borderBottomWidth: 5,
    borderBottomColor: '#4A148C',
  },
  dmIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#160821',
    borderWidth: 2,
    borderColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmBannerInfo: {
    flex: 1,
    gap: 2,
  },
  dmTag: {
    color: '#CE93D8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dmTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  dmDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  generatorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderBottomWidth: 5,
  },
  npcCardBorder: {
    borderColor: '#1E88E5',
    borderBottomColor: '#0D47A1',
  },
  enemyCardBorder: {
    borderColor: '#E53935',
    borderBottomColor: '#7F1D1D',
  },
  lootCardBorder: {
    borderColor: '#F59E0B',
    borderBottomColor: '#78350F',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generatorCategory: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  generatorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  resultBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fieldRow: {
    gap: 3,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  fieldMainValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  fieldValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  fieldHighlightRed: {
    color: '#FF8A80',
    fontSize: 15,
    fontWeight: '900',
  },
  fieldHighlightGold: {
    color: '#FFD54F',
    fontSize: 15,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  npcButton: {
    backgroundColor: '#1E88E5',
    borderColor: '#90CAF9',
    borderBottomColor: '#0D47A1',
  },
  enemyButton: {
    backgroundColor: '#E53935',
    borderColor: '#FF8A80',
    borderBottomColor: '#8E0000',
  },
  lootButton: {
    backgroundColor: '#D97706',
    borderColor: '#FDE68A',
    borderBottomColor: '#78350F',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
