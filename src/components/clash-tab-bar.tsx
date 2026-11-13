import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RpgIcon, type RpgIconName } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';

type TabVisualConfig = {
  icon: RpgIconName;
  activeColor: string;
  accentBorder: string;
  label: string;
};

const TAB_VISUALS: Record<string, TabVisualConfig> = {
  creators: {
    icon: 'account-group',
    activeColor: '#FB8C00',
    accentBorder: '#FFD54F',
    label: 'CREATORS',
  },
  inventory: {
    icon: 'bag-personal',
    activeColor: '#43A047',
    accentBorder: '#FFD54F',
    label: 'BAG',
  },
  index: {
    icon: 'dice-d20',
    activeColor: '#E53935',
    accentBorder: '#FFD54F',
    label: 'DICE',
  },
  character: {
    icon: 'shield-sword',
    activeColor: '#1E88E5',
    accentBorder: '#FFD54F',
    label: 'HERO',
  },
  'dm-tools': {
    icon: 'crown',
    activeColor: '#8E24AA',
    accentBorder: '#FFD54F',
    label: 'DM',
  },
  wiki: {
    icon: 'book-open-variant',
    activeColor: '#00ACC1',
    accentBorder: '#FFD54F',
    label: 'WIKI',
  },
};

export function ClashRoyaleTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  jumpTo,
}: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outerWrapper,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6),
        },
      ]}>
      {/* Clash Royale style metallic gold top trim */}
      <View style={styles.goldTopTrim} />

      <View style={styles.tabRow}>
        {state.routes.map(
          (
            route: { key: string; name: string; params?: object },
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
              label: label,
            };

            const onPress = () => {
              const event = emitter?.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event?.defaultPrevented) {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                if (navigateToTab) {
                  navigateToTab(route.key);
                } else if (jumpTo) {
                  jumpTo(route.key);
                }
              }
            };

            const onLongPress = () => {
              emitter?.emit({
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
                {/* Top glossy highlight inside active button */}
                {isFocused && <View style={styles.glossOverlay} />}

                <View
                  style={[
                    styles.iconBadge,
                    isFocused && styles.iconBadgeActive,
                  ]}>
                  <RpgIcon
                    name={visual.icon}
                    size={isFocused ? 18 : 15}
                    color={isFocused ? '#FFF8E1' : '#90A4AE'}
                  />
                </View>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={[
                    styles.tabTitle,
                    isFocused ? styles.tabTitleActive : styles.tabTitleInactive,
                  ]}>
                  {visual.label}
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
    paddingTop: 4,
    paddingHorizontal: 6,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  goldTopTrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#F4D03F',
    opacity: 0.85,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 5,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 3,
    overflow: 'hidden',
  },
  tabSlotInactive: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderBottomWidth: 3,
    borderBottomColor: '#090D16',
    minHeight: 48,
  },
  tabSlotActive: {
    flex: 1.15,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderBottomColor: '#7D6608',
    minHeight: 54,
    transform: [{ translateY: -3 }],
    elevation: 10,
    shadowColor: '#FFD54F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tabSlotPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginBottom: 1,
  },
  iconBadgeActive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.7)',
  },
  tabTitle: {
    fontFamily: BUNGEE_FONT,
    fontSize: 8.5,
    letterSpacing: 0.3,
  },
  tabTitleInactive: {
    color: '#94A3B8',
  },
  tabTitleActive: {
    color: '#FFFFFF',
    fontSize: 9.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
