export const LANE_COUNT = 3;

// Road sizing (responsive). Road width is computed at runtime as:
// min(screenWidth * ROAD_WIDTH_RATIO, ROAD_MAX_WIDTH)
export const ROAD_WIDTH_RATIO = 0.92;
export const ROAD_MAX_WIDTH = 440;

export const CAR_WIDTH = 42;
export const CAR_HEIGHT = 72;

export const OBSTACLE_WIDTH = 44;
export const OBSTACLE_HEIGHT = 44;

export const RECIPE_ITEM_SIZE = 48;

export const BASE_SPEED_PX_PER_SEC = 260;
export const SPEED_RAMP_PX_PER_SEC = 10; // added per second survived

export const BASE_OBSTACLE_SPAWN_SEC = 1.1;
export const MIN_OBSTACLE_SPAWN_SEC = 0.45;

export const BASE_RECIPE_SPAWN_SEC = 4.5;
export const MIN_RECIPE_SPAWN_SEC = 2.0;

export const SWIPE_THRESHOLD_PX = 22;

export const EFFECT_DURATIONS_MS = {
  shield: 12_000,
  boost: 6_000,
  slow: 6_000,
  multiplier: 10_000,
} as const;

export const EFFECT_FACTORS = {
  boostSpeed: 1.35,
  slowSpeed: 0.7,
  multiplier: 2,
} as const;

export const COLORS = {
  asphalt: '#0B0D12',
  asphaltHighlight: '#101522',
  laneLine: 'rgba(255,255,255,0.45)',
  hudText: '#E8ECFF',
  car: '#3B82F6',
  carAccent: '#93C5FD',
  obstacle: '#F97316',
  obstacleAccent: '#FDBA74',
  recipe: '#22C55E',
  recipeAccent: '#86EFAC',
  danger: '#EF4444',
} as const;

