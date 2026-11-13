import { TopTabs, type MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import React from 'react';

import { ClashRoyaleTabBar } from '@/components/clash-tab-bar';
import { useRoleStore } from '@/store/useRoleStore';

export const unstable_settings = {
  initialRouteName: 'index',
};

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
        name="creators"
        options={{
          title: 'CREATORS',
          tabBarLabel: 'CREATORS',
        }}
      />
      <TopTabs.Screen
        name="inventory"
        options={{
          title: 'BAG',
          tabBarLabel: 'BAG',
        }}
      />
      <TopTabs.Screen
        name="index"
        options={{
          title: 'DICE',
          tabBarLabel: 'DICE',
        }}
      />
      <TopTabs.Protected guard={!isDMMode}>
        <TopTabs.Screen
          name="character"
          options={{
            title: 'HERO',
            tabBarLabel: 'HERO',
          }}
        />
      </TopTabs.Protected>
      <TopTabs.Protected guard={isDMMode}>
        <TopTabs.Screen
          name="dm-tools"
          options={{
            title: 'DM',
            tabBarLabel: 'DM',
          }}
        />
      </TopTabs.Protected>
      <TopTabs.Screen
        name="wiki"
        options={{
          title: 'WIKI',
          tabBarLabel: 'WIKI',
        }}
      />
    </TopTabs>
  );
}
