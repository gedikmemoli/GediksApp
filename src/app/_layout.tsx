import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RpgIcon } from '@/components/rpg-icon';
import { useRoleStore } from '@/store/useRoleStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDMMode = useRoleStore((state) => state.isDMMode);
  const toggleDMMode = useRoleStore((state) => state.toggleDMMode);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0F172A',
            },
            headerTintColor: '#FFD54F',
            headerTitleStyle: {
              fontWeight: '900',
              fontSize: 16,
            },
            headerShadowVisible: true,
            headerTitle: () => (
              <View style={styles.headerTitleWrapper}>
                <View
                  style={[
                    styles.roleDot,
                    { backgroundColor: isDMMode ? '#AB47BC' : '#42A5F5' },
                  ]}
                />
                <View>
                  <Text style={styles.appTitle}>GEDIK&apos;S D&D</Text>
                  <Text style={styles.roleSubtitle}>
                    {isDMMode ? 'Dungeon Master (DM)' : 'Oyuncu (Player)'}
                  </Text>
                </View>
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
                  size={18}
                  color="#FFF8E1"
                />
                <Text style={styles.roleButtonText}>Rol Değiştir</Text>
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
    gap: 10,
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
  },
  appTitle: {
    color: '#FFD54F',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  roleSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
