import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/src/design';

export function LearnMessage({ text }: { text: string }) {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.muted },
});
