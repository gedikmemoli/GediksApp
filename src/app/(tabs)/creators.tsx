import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RpgIcon } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';

const CREATOR_CARDS = [
  { id: 'c1', name: 'GEDIKS STUDIO', role: 'CORE', badge: '👑', color: '#FFD54F' },
  { id: 'c2', name: 'FORGE ENGINE', role: 'DEV', badge: '⚒️', color: '#42A5F5' },
  { id: 'c3', name: 'ARCANE ART', role: 'UI', badge: '✨', color: '#AB47BC' },
];

export default function CreatorsScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerBadge}>
        <RpgIcon name="account-group" size={22} color="#FFD54F" />
        <Text style={styles.headerTitle}>CREATORS</Text>
      </View>

      <View style={styles.grid}>
        {CREATOR_CARDS.map((card) => (
          <View
            key={card.id}
            style={[styles.card, { borderColor: card.color }]}>
            <Text style={styles.cardEmoji}>{card.badge}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={[styles.cardRole, { color: card.color }]}>
                {card.role}
              </Text>
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
    padding: 16,
    gap: 14,
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
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderBottomColor: '#090D16',
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontFamily: BUNGEE_FONT,
    color: '#F8FAFC',
    fontSize: 15,
    letterSpacing: 0.8,
  },
  cardRole: {
    fontFamily: BUNGEE_FONT,
    fontSize: 11,
    letterSpacing: 1,
  },
});
