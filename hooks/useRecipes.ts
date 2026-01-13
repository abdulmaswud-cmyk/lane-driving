import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type MealDbRecipe = {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strArea: string | null;
  strMealThumb: string | null;
  strInstructions: string | null;
};

type MealDbRandomResponse = { meals: MealDbRecipe[] | null };

async function fetchRandomMeal(signal?: AbortSignal) {
  const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php', { signal });
  if (!res.ok) throw new Error(`TheMealDB error (${res.status})`);
  const json = (await res.json()) as MealDbRandomResponse;
  const meal = json.meals?.[0];
  if (!meal) throw new Error('No meal returned');
  return meal;
}

async function fetchRandomMeals(count: number, signal?: AbortSignal) {
  const results = await Promise.allSettled(Array.from({ length: count }, () => fetchRandomMeal(signal)));
  const meals = results
    .filter((r): r is PromiseFulfilledResult<MealDbRecipe> => r.status === 'fulfilled')
    .map((r) => r.value);

  // Deduplicate by idMeal
  const map = new Map<string, MealDbRecipe>();
  for (const m of meals) map.set(m.idMeal, m);
  return Array.from(map.values());
}

export function useRecipes(params?: { enabled?: boolean; count?: number }) {
  const enabled = params?.enabled ?? true;
  const count = params?.count ?? 10;

  const [recipes, setRecipes] = useState<MealDbRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRandomMeals(count, controller.signal);
      setRecipes(data);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError((e as Error).message ?? 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    if (!enabled) return;
    refetch();
    return () => abortRef.current?.abort();
  }, [enabled, refetch]);

  const byId = useMemo(() => {
    const m = new Map<string, MealDbRecipe>();
    for (const r of recipes) m.set(r.idMeal, r);
    return m;
  }, [recipes]);

  return { recipes, recipesById: byId, loading, error, refetch };
}

