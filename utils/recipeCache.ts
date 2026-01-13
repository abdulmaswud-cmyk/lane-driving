import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MealDbRecipe } from '@/hooks/useRecipes';

const KEY_LIST = 'lanekitchen:recipes:list:v1';
const KEY_BY_ID_PREFIX = 'lanekitchen:recipes:byId:v1:';

export type CachedRecipeList = {
  updatedAt: number;
  recipes: MealDbRecipe[];
};

export async function loadCachedRecipes(): Promise<CachedRecipeList | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_LIST);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRecipeList;
    if (!Array.isArray(parsed.recipes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedRecipes(recipes: MealDbRecipe[]) {
  const payload: CachedRecipeList = { updatedAt: Date.now(), recipes };
  try {
    await AsyncStorage.setItem(KEY_LIST, JSON.stringify(payload));
  } catch {
    // ignore cache write errors
  }

  // Also store by id for offline recipe modal.
  await Promise.all(
    recipes.map(async (r) => {
      try {
        await AsyncStorage.setItem(`${KEY_BY_ID_PREFIX}${r.idMeal}`, JSON.stringify(r));
      } catch {
        // ignore
      }
    }),
  );
}

export async function loadCachedRecipeById(id: string): Promise<MealDbRecipe | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_BY_ID_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as MealDbRecipe;
  } catch {
    return null;
  }
}

