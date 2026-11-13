import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RpgIcon } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';

type InvItem = {
  id: string;
  name: string;
  icon: string;
  qty: number;
  color: string;
};

const INITIAL_ITEMS: InvItem[] = [
  { id: 'hp-pot', name: 'POTION', icon: '🧪', qty: 3, color: '#EF5350' },
  { id: 'sword', name: 'BLADE', icon: '🗡️', qty: 1, color: '#42A5F5' },
  { id: 'shield', name: 'SHIELD', icon: '🛡️', qty: 1, color: '#FFA726' },
  { id: 'scroll', name: 'SCROLL', icon: '📜', qty: 2, color: '#AB47BC' },
  { id: 'key', name: 'KEY', icon: '🗝️', qty: 1, color: '#FFD54F' },
  { id: 'torch', name: 'TORCH', icon: '🔥', qty: 4, color: '#FF7043' },
];

export default function InventoryScreen() {
  const [gold, setGold] = useState(150);
  const [items, setItems] = useState<InvItem[]>(INITIAL_ITEMS);

  const adjustGold = (delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setGold((prev) => Math.max(0, prev + delta));
  };

  const adjustItem = (id: string, delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      )
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Gold Pouch */}
      <View style={styles.goldBar}>
        <Pressable
          onPress={() => adjustGold(-10)}
          style={({ pressed }) => [styles.goldBtn, pressed && styles.pressed]}>
          <Text style={styles.goldBtnText}>-10</Text>
        </Pressable>

        <View style={styles.goldCenter}>
          <RpgIcon name="bag-personal" size={20} color="#FFD54F" />
          <Text style={styles.goldValue}>{gold}G</Text>
        </View>

        <Pressable
          onPress={() => adjustGold(10)}
          style={({ pressed }) => [styles.goldBtn, pressed && styles.pressed]}>
          <Text style={styles.goldBtnText}>+10</Text>
        </Pressable>
      </View>

      {/* Item Grid */}
      <View style={styles.grid}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.slot,
              { borderColor: item.qty > 0 ? item.color : '#334155' },
              item.qty === 0 && styles.slotEmpty,
            ]}>
            <Text style={styles.slotIcon}>{item.icon}</Text>
            <Text style={styles.slotName}>{item.name}</Text>

            <View style={styles.qtyRow}>
              <Pressable
                onPress={() => adjustItem(item.id, -1)}
                style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>-</Text>
              </Pressable>
              <Text style={[styles.qtyText, { color: item.color }]}>
                x{item.qty}
              </Text>
              <Pressable
                onPress={() => adjustItem(item.id, 1)}
                style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
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
    gap: 14,
  },
  goldBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 10,
    borderWidth: 2,
    borderColor: '#FFD54F',
    borderBottomWidth: 5,
    borderBottomColor: '#7D6608',
  },
  goldCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goldValue: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 22,
    letterSpacing: 1,
  },
  goldBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  goldBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#F8FAFC',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  slot: {
    width: '48%',
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderBottomColor: '#090D16',
  },
  slotEmpty: {
    opacity: 0.45,
  },
  slotIcon: {
    fontSize: 30,
  },
  slotName: {
    fontFamily: BUNGEE_FONT,
    color: '#F8FAFC',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  qtyBtnText: {
    fontFamily: BUNGEE_FONT,
    color: '#F8FAFC',
    fontSize: 14,
  },
  qtyText: {
    fontFamily: BUNGEE_FONT,
    fontSize: 15,
    minWidth: 28,
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
});
