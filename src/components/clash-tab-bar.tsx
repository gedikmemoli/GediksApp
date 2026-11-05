import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RpgIcon, type RpgIconName } from '@/components/rpg-icon';

type TabVisualConfig = {
  icon: RpgIconName;
  activeColor: string;
  accentBorder: string;
  subtitle: string;
};

const TAB_VISUALS: Record<string, TabVisualConfig> = {
  index: {
    icon: 'dice-d20',
    activeColor: '#E53935',
    accentBorder: '#FFD54F',
    subtitle: 'Zar',
  },
  character: {
    icon: 'shield-sword',
    activeColor: '#1E88E5',
    accentBorder: '#FFD54F',
    subtitle: 'Karakter',
  },
  'dm-tools': {
    icon: 'crown',
    activeColor: '#8E24AA',
    accentBorder: '#FFD54F',
    subtitle: 'DM Araçları',
  },
};

export function ClashRoyaleTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outerWrapper,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8),
        },
      ]}>
      {/* Clash Royale style metallic gold top trim */}
      <View style={styles.goldTopTrim} />

      <View style={styles.tabRow}>
        {state.routes.map(
          (
            route: { key: string; name: string; params?: Record<string, unknown> },
            index: number
          ) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const visual = TAB_VISUALS[route.name] ?? {
            icon: 'compass',
            activeColor: '#1E88E5',
            accentBorder: '#FFD54F',
            subtitle: label,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
              }
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabSlot,
                isFocused ? styles.tabSlotActive : styles.tabSlotInactive,
                isFocused && {
                  backgroundColor: visual.activeColor,
                  borderColor: visual.accentBorder,
                },
                pressed && styles.tabSlotPressed,
              ]}>
              {/* Top glossy highlight inside active button (Clash Royale card/button look) */}
              {isFocused && <View style={styles.glossOverlay} />}

              <View style={[styles.iconBadge, isFocused && styles.iconBadgeActive]}>
                <RpgIcon
                  name={visual.icon}
                  size={isFocused ? 28 : 22}
                  color={isFocused ? '#FFF8E1' : '#90A4AE'}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[styles.tabTitle, isFocused ? styles.tabTitleActive : styles.tabTitleInactive]}>
                {label}
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.tabSubtitle,
                  isFocused ? styles.tabSubtitleActive : styles.tabSubtitleInactive,
                ]}>
                {visual.subtitle}
              </Text>
            </Pressable>
          );
          }
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: '#0F172A',
    borderTopWidth: 2,
    borderTopColor: '#B7950B',
    paddingTop: 6,
    paddingHorizontal: 10,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  goldTopTrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F4D03F',
    opacity: 0.85,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  tabSlotInactive: {
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    borderBottomWidth: 4,
    borderBottomColor: '#090D16',
    minHeight: 68,
  },
  tabSlotActive: {
    flex: 1.25,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderBottomColor: '#7D6608',
    minHeight: 78,
    transform: [{ translateY: -6 }],
    elevation: 12,
    shadowColor: '#FFD54F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  tabSlotPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginBottom: 2,
  },
  iconBadgeActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 213, 79, 0.7)',
  },
  tabTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tabTitleInactive: {
    color: '#94A3B8',
  },
  tabTitleActive: {
    color: '#FFFFFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  tabSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  tabSubtitleInactive: {
    color: '#64748B',
  },
  tabSubtitleActive: {
    color: '#FFF59D',
  },
});
