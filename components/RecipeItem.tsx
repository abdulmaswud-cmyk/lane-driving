import { Image, StyleSheet, Text, View } from 'react-native';

import type { MealDbRecipe } from '@/hooks/useRecipes';
import { COLORS } from '@/utils/constants';

export function RecipeItem(props: { recipe: MealDbRecipe; size: number }) {
  const thumb = props.recipe.strMealThumb ?? undefined;

  return (
    <View style={[styles.wrap, { width: props.size, height: props.size }]}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={styles.fallback} />
      )}
      <View style={styles.badge}>
        <Text numberOfLines={1} style={styles.badgeText}>
          {props.recipe.strMeal}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    backgroundColor: COLORS.recipe,
    borderWidth: 2,
    borderColor: COLORS.recipeAccent,
    overflow: 'hidden',
  },
  img: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  badge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

