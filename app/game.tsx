import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Car } from '@/components/Car';
import { Obstacle } from '@/components/Obstacle';
import { RecipeItem } from '@/components/RecipeItem';
import type { MealDbRecipe } from '@/hooks/useRecipes';
import { useRecipes } from '@/hooks/useRecipes';
import { useGameLoop } from '@/hooks/useGameLoop';
import { entityRectFromLane, rectsOverlap } from '@/utils/collision';
import {
  BASE_OBSTACLE_SPAWN_SEC,
  BASE_RECIPE_SPAWN_SEC,
  BASE_SPEED_PX_PER_SEC,
  CAR_HEIGHT,
  CAR_WIDTH,
  COLORS,
  EFFECT_DURATIONS_MS,
  EFFECT_FACTORS,
  LANE_COUNT,
  MIN_OBSTACLE_SPAWN_SEC,
  MIN_RECIPE_SPAWN_SEC,
  OBSTACLE_HEIGHT,
  OBSTACLE_WIDTH,
  RECIPE_ITEM_SIZE,
  ROAD_MAX_WIDTH,
  ROAD_WIDTH_RATIO,
  SPEED_RAMP_PX_PER_SEC,
  SWIPE_THRESHOLD_PX,
} from '@/utils/constants';

type ObstacleEntity = { id: string; lane: number; y: number };
type RecipeEntity = { id: string; lane: number; y: number; recipe: MealDbRecipe };

type PowerUp = 'shield' | 'boost' | 'slow' | 'multiplier';

function powerUpFromRecipe(r: MealDbRecipe): PowerUp {
  const category = (r.strCategory ?? '').toLowerCase();
  const area = (r.strArea ?? '').toLowerCase();

  if (category.includes('seafood')) return 'slow';
  if (category.includes('chicken')) return 'boost';
  if (category.includes('beef') || category.includes('pork') || category.includes('lamb')) return 'shield';
  if (area.includes('italian') || area.includes('mexican')) return 'multiplier';
  return 'multiplier';
}

function nowMs() {
  return Date.now();
}

export default function GameScreen() {
  const isFocused = useIsFocused();
  const screen = Dimensions.get('window');
  const roadWidth = Math.min(screen.width * ROAD_WIDTH_RATIO, ROAD_MAX_WIDTH);
  const roadLeft = (screen.width - roadWidth) / 2;
  const roadHeight = screen.height;

  const { recipes, loading: recipesLoading, error: recipesError, refetch } = useRecipes({ enabled: true, count: 12 });

  const [running, setRunning] = useState(true); // game is still alive (not gameover)
  const [paused, setPaused] = useState(false); // pause when recipe modal (or any route) opens
  const [carLane, setCarLane] = useState(1);
  const [score, setScore] = useState(0);

  const [obstacles, setObstacles] = useState<ObstacleEntity[]>([]);
  const [recipeDrops, setRecipeDrops] = useState<RecipeEntity[]>([]);

  const [hudMsg, setHudMsg] = useState<string | null>(null);
  const [hudRecipe, setHudRecipe] = useState<MealDbRecipe | null>(null);

  const scoreRef = useRef(0);
  const timeAliveRef = useRef(0);
  const obstacleSpawnRef = useRef(0);
  const recipeSpawnRef = useRef(0);
  const idRef = useRef(0);

  const shieldUntilRef = useRef(0);
  const boostUntilRef = useRef(0);
  const slowUntilRef = useRef(0);
  const multiplierUntilRef = useRef(0);

  const hudUntilRef = useRef(0);

  const carY = roadHeight - 170;

  // Pause whenever this screen isn't focused (e.g. recipe modal is open),
  // and resume automatically when focus returns (as long as we're not game-over).
  useEffect(() => {
    if (!running) return;
    setPaused(!isFocused);
  }, [isFocused, running]);

  const panResponder = useMemo(() => {
    let startX = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        startX = evt.nativeEvent.pageX;
      },
      onPanResponderRelease: (evt) => {
        const dx = evt.nativeEvent.pageX - startX;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        if (dx < 0) moveLeft();
        else moveRight();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carLane]);

  function moveLeft() {
    setCarLane((l) => Math.max(0, l - 1));
  }

  function moveRight() {
    setCarLane((l) => Math.min(LANE_COUNT - 1, l + 1));
  }

  function showHud(message: string, recipe?: MealDbRecipe) {
    setHudMsg(message);
    setHudRecipe(recipe ?? null);
    hudUntilRef.current = nowMs() + 2_200;
  }

  function endGame() {
    setRunning(false);
    setPaused(true);
    setTimeout(() => {
      router.replace({ pathname: '/gameover', params: { score: String(Math.floor(scoreRef.current)) } });
    }, 120);
  }

  useGameLoop({
    running: running && !paused,
    onFrame: (dt) => {
      timeAliveRef.current += dt;

      const ms = nowMs();
      if (hudUntilRef.current && hudUntilRef.current < ms && hudMsg) {
        setHudMsg(null);
        setHudRecipe(null);
        hudUntilRef.current = 0;
      }

      const hasBoost = boostUntilRef.current > ms;
      const hasSlow = slowUntilRef.current > ms;
      const hasMultiplier = multiplierUntilRef.current > ms;

      const speedFactor = hasSlow ? EFFECT_FACTORS.slowSpeed : hasBoost ? EFFECT_FACTORS.boostSpeed : 1;
      const baseSpeed = BASE_SPEED_PX_PER_SEC + timeAliveRef.current * SPEED_RAMP_PX_PER_SEC;
      const speed = baseSpeed * speedFactor;

      const multiplier = hasMultiplier ? EFFECT_FACTORS.multiplier : 1;
      scoreRef.current += speed * dt * 0.05 * multiplier; // tuned
      setScore(scoreRef.current);

      // Spawn pacing ramps with time alive
      const obstacleSpawnSec = Math.max(
        MIN_OBSTACLE_SPAWN_SEC,
        BASE_OBSTACLE_SPAWN_SEC - timeAliveRef.current * 0.01,
      );
      const recipeSpawnSec = Math.max(MIN_RECIPE_SPAWN_SEC, BASE_RECIPE_SPAWN_SEC - timeAliveRef.current * 0.005);

      obstacleSpawnRef.current += dt;
      recipeSpawnRef.current += dt;

      if (obstacleSpawnRef.current >= obstacleSpawnSec) {
        obstacleSpawnRef.current = 0;
        const lane = Math.floor(Math.random() * LANE_COUNT);
        idRef.current += 1;
        setObstacles((prev) => [...prev, { id: `o${idRef.current}`, lane, y: -OBSTACLE_HEIGHT - 10 }]);
      }

      if (recipes.length > 0 && recipeSpawnRef.current >= recipeSpawnSec) {
        recipeSpawnRef.current = 0;
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const recipe = recipes[Math.floor(Math.random() * recipes.length)];
        idRef.current += 1;
        setRecipeDrops((prev) => [...prev, { id: `r${idRef.current}`, lane, y: -RECIPE_ITEM_SIZE - 10, recipe }]);
      }

      const carRect = entityRectFromLane({
        roadLeft,
        roadWidth,
        laneIndex: carLane,
        laneCount: LANE_COUNT,
        y: carY,
        w: CAR_WIDTH,
        h: CAR_HEIGHT,
      });

      setObstacles((prev) => {
        const next: ObstacleEntity[] = [];
        for (const o of prev) {
          const y = o.y + speed * dt;
          if (y > roadHeight + 80) continue;

          const oRect = entityRectFromLane({
            roadLeft,
            roadWidth,
            laneIndex: o.lane,
            laneCount: LANE_COUNT,
            y,
            w: OBSTACLE_WIDTH,
            h: OBSTACLE_HEIGHT,
          });

          if (rectsOverlap(carRect, oRect)) {
            if (shieldUntilRef.current > ms) {
              shieldUntilRef.current = 0;
              showHud('Shield saved you!');
              continue; // remove obstacle
            }
            // Collision
            endGame();
            return prev;
          }

          next.push({ ...o, y });
        }
        return next;
      });

      setRecipeDrops((prev) => {
        const next: RecipeEntity[] = [];
        for (const r of prev) {
          const y = r.y + speed * dt;
          if (y > roadHeight + 80) continue;

          const rRect = entityRectFromLane({
            roadLeft,
            roadWidth,
            laneIndex: r.lane,
            laneCount: LANE_COUNT,
            y,
            w: RECIPE_ITEM_SIZE,
            h: RECIPE_ITEM_SIZE,
          });

          if (rectsOverlap(carRect, rRect)) {
            const p = powerUpFromRecipe(r.recipe);
            const until = ms + EFFECT_DURATIONS_MS[p];
            if (p === 'shield') shieldUntilRef.current = until;
            if (p === 'boost') boostUntilRef.current = until;
            if (p === 'slow') slowUntilRef.current = until;
            if (p === 'multiplier') multiplierUntilRef.current = until;

            showHud(`Collected: ${r.recipe.strMeal}`, r.recipe);
            continue; // remove recipe
          }

          next.push({ ...r, y });
        }
        return next;
      });
    },
  });

  const hasShield = shieldUntilRef.current > nowMs();
  const hasBoost = boostUntilRef.current > nowMs();
  const hasSlow = slowUntilRef.current > nowMs();
  const hasMultiplier = multiplierUntilRef.current > nowMs();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hud}>
          <Text style={styles.hudTitle}>Score: {Math.floor(score)}</Text>
          <View style={styles.effects}>
            <Text style={[styles.effect, hasShield && styles.effectOn]}>Shield</Text>
            <Text style={[styles.effect, hasBoost && styles.effectOn]}>Boost</Text>
            <Text style={[styles.effect, hasSlow && styles.effectOn]}>Slow</Text>
            <Text style={[styles.effect, hasMultiplier && styles.effectOn]}>x2</Text>
          </View>
        </View>

        <View style={[styles.road, { width: roadWidth }]} {...panResponder.panHandlers}>
          {/* Lane dividers */}
          <View style={[styles.laneLine, { left: roadWidth / 3 }]} />
          <View style={[styles.laneLine, { left: (roadWidth / 3) * 2 }]} />

          {/* Entities */}
          {obstacles.map((o) => {
            const left =
              (roadWidth / LANE_COUNT) * (o.lane + 0.5) - OBSTACLE_WIDTH / 2;
            return (
              <View key={o.id} style={[styles.entity, { left, top: o.y, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT }]}>
                <Obstacle size={OBSTACLE_WIDTH} />
              </View>
            );
          })}

          {recipeDrops.map((r) => {
            const left =
              (roadWidth / LANE_COUNT) * (r.lane + 0.5) - RECIPE_ITEM_SIZE / 2;
            return (
              <View
                key={r.id}
                style={[
                  styles.entity,
                  { left, top: r.y, width: RECIPE_ITEM_SIZE, height: RECIPE_ITEM_SIZE },
                ]}
              >
                <RecipeItem recipe={r.recipe} size={RECIPE_ITEM_SIZE} />
              </View>
            );
          })}

          {/* Car */}
          <View
            style={[
              styles.entity,
              {
                left: (roadWidth / LANE_COUNT) * (carLane + 0.5) - CAR_WIDTH / 2,
                top: carY,
                width: CAR_WIDTH,
                height: CAR_HEIGHT,
              },
            ]}
          >
            <Car width={CAR_WIDTH} height={CAR_HEIGHT} />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={moveLeft} accessibilityLabel="Move left">
            <Text style={styles.ctrlText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={moveRight} accessibilityLabel="Move right">
            <Text style={styles.ctrlText}>▶</Text>
          </TouchableOpacity>
        </View>

        {hudMsg ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{hudMsg}</Text>
            {hudRecipe ? (
              <TouchableOpacity
                style={styles.toastLink}
                onPress={() => {
                  // Pause immediately so nothing moves during the transition.
                  setPaused(true);
                  router.push({ pathname: '/recipe', params: { id: hudRecipe.idMeal } });
                }}
              >
                <Text style={styles.toastLinkText}>View recipe</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {recipesError ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Recipe fetch failed: {recipesError}</Text>
            <TouchableOpacity onPress={refetch} style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : recipesLoading ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Loading recipes…</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.asphalt },
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  hud: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudTitle: { color: COLORS.hudText, fontWeight: '900', fontSize: 16 },
  effects: { flexDirection: 'row', gap: 8 },
  effect: {
    color: 'rgba(232,236,255,0.55)',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  effectOn: {
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  road: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: COLORS.asphaltHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  laneLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.laneLine,
  },
  entity: { position: 'absolute' },
  controls: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ctrlBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctrlText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 94,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toastText: { color: '#fff', fontWeight: '800', flex: 1 },
  toastLink: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  toastLinkText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  banner: {
    position: 'absolute',
    top: 74,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bannerText: { color: '#fff', fontWeight: '700', flex: 1 },
  bannerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  bannerBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
});

