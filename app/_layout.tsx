import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useAudibleFonts } from '@/src/design/fonts';
import { colors } from '@/src/design';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const AudibleTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.panel,
    text: colors.text,
    border: colors.border,
    primary: colors.lime,
  },
};

export default function RootLayout() {
  const loaded = useAudibleFonts();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={AudibleTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="train/[topic]" options={{ title: 'Training' }} />
        <Stack.Screen name="train/playbook" options={{ title: 'Playbook Drill' }} />
        <Stack.Screen name="play/[id]" options={{ headerShown: false, title: 'Play' }} />
        <Stack.Screen name="learn/quiz" options={{ headerShown: false, title: 'Quiz' }} />
      </Stack>
    </ThemeProvider>
  );
}
