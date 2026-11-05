import { TopTabs, type MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import React from 'react';

import { ClashRoyaleTabBar } from '@/components/clash-tab-bar';
import { useRoleStore } from '@/store/useRoleStore';

export default function TabsLayout() {
  const isDMMode = useRoleStore((state) => state.isDMMode);

  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={(props: MaterialTopTabBarProps) => <ClashRoyaleTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        sceneStyle: {
          backgroundColor: '#0B0F19',
        },
      }}>
      <TopTabs.Screen
        name="index"
        options={{
          title: 'Dice',
          tabBarLabel: 'Dice',
        }}
      />
      <TopTabs.Screen
        name="character"
        options={{
          title: 'Character',
          tabBarLabel: 'Character',
        }}
      />
      <TopTabs.Protected guard={isDMMode}>
        <TopTabs.Screen
          name="dm-tools"
          options={{
            title: 'DM Tools',
            tabBarLabel: 'DM Tools',
          }}
        />
      </TopTabs.Protected>
    </TopTabs>
  );
}
