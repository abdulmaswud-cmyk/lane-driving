import { Link, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/utils/constants';

export default function GameOverScreen() {
  const params = useLocalSearchParams<{ score?: string }>();
  const score = Number(params.score ?? 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Game Over</Text>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.score}>{Number.isFinite(score) ? score : 0}</Text>

        <TouchableOpacity style={styles.primary} onPress={() => router.replace('/game')}>
          <Text style={styles.primaryText}>Run Again</Text>
        </TouchableOpacity>

        <Link href="/" asChild>
          <TouchableOpacity style={styles.secondary}>
            <Text style={styles.secondaryText}>Back to Start</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.asphalt },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, gap: 10 },
  title: { color: COLORS.hudText, fontSize: 36, fontWeight: '900' },
  scoreLabel: { color: 'rgba(232,236,255,0.7)', fontWeight: '800', marginTop: 8 },
  score: { color: '#fff', fontSize: 54, fontWeight: '900' },
  primary: {
    marginTop: 14,
    backgroundColor: COLORS.car,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.carAccent,
  },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  secondaryText: { color: '#fff', fontWeight: '900' },
});

