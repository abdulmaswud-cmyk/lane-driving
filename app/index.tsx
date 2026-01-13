import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/utils/constants';

export default function StartScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Lane Kitchen</Text>
        <Text style={styles.subtitle}>Swipe to switch lanes. Dodge obstacles. Collect recipes for power-ups.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Power-ups (recipes)</Text>
          <Text style={styles.cardLine}>- Shield: survive one crash</Text>
          <Text style={styles.cardLine}>- Boost: go faster (more score)</Text>
          <Text style={styles.cardLine}>- Slow: obstacles move slower</Text>
          <Text style={styles.cardLine}>- x2: score multiplier</Text>
        </View>

        <TouchableOpacity style={styles.primary} onPress={() => router.push('/game')}>
          <Text style={styles.primaryText}>Start Run</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Works on iOS, Android, and Web (Expo).</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.asphalt },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 14,
  },
  title: {
    color: COLORS.hudText,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  subtitle: {
    color: 'rgba(232,236,255,0.85)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 420,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 14,
    backgroundColor: COLORS.asphaltHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardTitle: { color: COLORS.hudText, fontWeight: '800', marginBottom: 6 },
  cardLine: { color: 'rgba(232,236,255,0.78)', lineHeight: 20 },
  primary: {
    marginTop: 8,
    backgroundColor: COLORS.car,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.carAccent,
  },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  hint: { marginTop: 4, color: 'rgba(232,236,255,0.65)', fontSize: 12 },
});

