import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { MealDbRecipe } from '@/hooks/useRecipes';
import { COLORS } from '@/utils/constants';
import { loadCachedRecipeById } from '@/utils/recipeCache';

type MealDbLookupResponse = { meals: MealDbRecipe[] | null };

export default function RecipeModal() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<MealDbRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) {
        setLoading(false);
        setError('Missing recipe id');
        return;
      }

      // Show cached recipe immediately (offline-friendly).
      const cached = await loadCachedRecipeById(id);
      if (!cancelled && cached) setRecipe(cached);

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`TheMealDB error (${res.status})`);
        const json = (await res.json()) as MealDbLookupResponse;
        const meal = json.meals?.[0] ?? null;
        if (!cancelled) setRecipe(meal);
      } catch (e) {
        // If we already have cached data, keep it and don't hard-fail the view.
        if (!cancelled) {
          if (!recipe) setError((e as Error).message ?? 'Failed to load recipe');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipe</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !recipe ? (
        <View style={styles.center}>
          <Text style={styles.error}>Recipe not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {recipe.strMealThumb ? (
            <Image source={{ uri: recipe.strMealThumb }} style={styles.image} resizeMode="cover" />
          ) : null}
          <Text style={styles.title}>{recipe.strMeal}</Text>
          <Text style={styles.meta}>
            {recipe.strCategory ?? 'Unknown category'} • {recipe.strArea ?? 'Unknown area'}
          </Text>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.body}>{recipe.strInstructions ?? 'No instructions provided.'}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.asphalt },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  headerTitle: { color: COLORS.hudText, fontSize: 18, fontWeight: '900' },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  closeText: { color: '#fff', fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 8 },
  muted: { color: 'rgba(232,236,255,0.7)' },
  error: { color: COLORS.danger, fontWeight: '900', textAlign: 'center' },
  content: { padding: 16, gap: 10 },
  image: { width: '100%', height: 220, borderRadius: 16, backgroundColor: COLORS.asphaltHighlight },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  meta: { color: 'rgba(232,236,255,0.7)', fontWeight: '700' },
  sectionTitle: { marginTop: 4, color: COLORS.hudText, fontSize: 16, fontWeight: '900' },
  body: { color: 'rgba(232,236,255,0.85)', lineHeight: 20 },
});

