import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RpgIcon, type RpgIconName } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';

const CREATOR_LINKS: {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  icon: RpgIconName;
  color: string;
}[] = [
  {
    id: 'website',
    title: 'GEDIK GAMES',
    subtitle: 'https://gedik.games',
    url: 'https://gedik.games',
    icon: 'web',
    color: '#42A5F5',
  },
  {
    id: 'google-play',
    title: 'GOOGLE PLAY',
    subtitle: 'PLAY STORE DEVELOPER',
    url: 'https://play.google.com/store/apps/dev?id=7067358905053963218&hl=tr',
    icon: 'google-play',
    color: '#66BB6A',
  },
];

export default function CreatorsScreen() {
  const openUrl = (url: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerBadge}>
        <RpgIcon name="account-group" size={22} color="#FFD54F" />
        <Text style={styles.headerTitle}>CREATORS</Text>
      </View>

      <View style={[styles.card, { borderColor: '#FFD54F' }]}>
        <RpgIcon name="crown" size={30} color="#FFD54F" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>GEDIK GAMES</Text>
          <Text style={[styles.cardRole, { color: '#FFD54F' }]}>
            CREATOR & DEVELOPER
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {CREATOR_LINKS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openUrl(item.url)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: item.color },
              pressed && styles.pressed,
            ]}>
            <RpgIcon name={item.icon} size={26} color={item.color} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.title}</Text>
              <Text style={[styles.cardRole, { color: item.color }]}>
                {item.subtitle}
              </Text>
            </View>
            <RpgIcon name="open-in-new" size={18} color="#94A3B8" />
          </Pressable>
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
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
});
