import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RpgIcon } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';

const WIKI_ENTRIES = [
  { id: 'w1', tag: 'CRIT', val: 'NAT 20 = 2X DMG', icon: '🎲', color: '#EF5350' },
  { id: 'w2', tag: 'AC', val: 'D20 + ATK >= AC', icon: '🛡️', color: '#42A5F5' },
  { id: 'w3', tag: 'DC', val: 'EASY 10 / HARD 15', icon: '🎯', color: '#FFD54F' },
  { id: 'w4', tag: 'REST', val: 'SHORT 1H / LONG 8H', icon: '⛺', color: '#66BB6A' },
  { id: 'w5', tag: 'ADV', val: '2D20 PICK HIGH', icon: '⚡', color: '#AB47BC' },
];

export default function WikiScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerBadge}>
        <RpgIcon name="book-open-variant" size={22} color="#FFD54F" />
        <Text style={styles.headerTitle}>WIKI</Text>
      </View>

      <View style={styles.list}>
        {WIKI_ENTRIES.map((item) => (
          <View
            key={item.id}
            style={[styles.card, { borderColor: item.color }]}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTag, { color: item.color }]}>
                {item.tag}
              </Text>
              <Text style={styles.cardVal}>{item.val}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  content: {
    padding: 14,
    gap: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#090D16',
  },
  headerTitle: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#131C2E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderBottomColor: '#090D16',
  },
  cardIcon: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTag: {
    fontFamily: BUNGEE_FONT,
    fontSize: 15,
    letterSpacing: 0.8,
  },
  cardVal: {
    fontFamily: BUNGEE_FONT,
    color: '#F8FAFC',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
