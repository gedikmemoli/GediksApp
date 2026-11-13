import { Bungee_400Regular, useFonts } from '@expo-google-fonts/bungee';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as Haptics from 'expo-haptics';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RpgIcon } from '@/components/rpg-icon';
import { BUNGEE_FONT } from '@/constants/theme';
import { useRoleStore } from '@/store/useRoleStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDMMode = useRoleStore((state) => state.isDMMode);
  const toggleDMMode = useRoleStore((state) => state.toggleDMMode);

  const [fontsLoaded] = useFonts({
    Bungee_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NavigationBar.setHidden(true);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        NavigationBar.setHidden(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const handleToggleRole = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleDMMode();
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={DarkTheme}>
        <StatusBar style="light" />
        <NavigationBar hidden style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0F172A',
            },
            headerTintColor: '#FFD54F',
            headerShadowVisible: true,
            headerTitle: () => (
              <View style={styles.headerTitleWrapper}>
                <View
                  style={[
                    styles.roleDot,
                    { backgroundColor: isDMMode ? '#AB47BC' : '#42A5F5' },
                  ]}
                />
                <Text style={styles.appTitle}>D&D</Text>
                <Text style={styles.roleBadge}>
                  {isDMMode ? 'DM' : 'HERO'}
                </Text>
              </View>
            ),
            headerRight: () => (
              <Pressable
                onPress={handleToggleRole}
                accessibilityRole="button"
                accessibilityLabel="Rol Değiştir"
                style={({ pressed }) => [
                  styles.roleButton,
                  isDMMode ? styles.roleButtonDM : styles.roleButtonPlayer,
                  pressed && styles.roleButtonPressed,
                ]}>
                <RpgIcon
                  name={isDMMode ? 'crown' : 'shield-account'}
                  size={16}
                  color="#FFF8E1"
                />
                <Text style={styles.roleButtonText}>
                  {isDMMode ? 'DM' : 'HERO'}
                </Text>
              </Pressable>
            ),
          }}>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: true,
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  headerTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
  },
  appTitle: {
    fontFamily: BUNGEE_FONT,
    color: '#FFD54F',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  roleBadge: {
    fontFamily: BUNGEE_FONT,
    color: '#94A3B8',
    fontSize: 11,
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 4,
    marginRight: Platform.OS === 'web' ? 12 : 4,
  },
  roleButtonPlayer: {
    backgroundColor: '#1E88E5',
    borderColor: '#64B5F6',
    borderBottomColor: '#0D47A1',
  },
  roleButtonDM: {
    backgroundColor: '#8E24AA',
    borderColor: '#FFD54F',
    borderBottomColor: '#4A148C',
  },
  roleButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  roleButtonText: {
    fontFamily: BUNGEE_FONT,
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
