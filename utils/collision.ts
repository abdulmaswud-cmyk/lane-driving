export type Rect = { x: number; y: number; w: number; h: number };

export function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function laneCenterX(params: {
  roadLeft: number;
  roadWidth: number;
  laneIndex: number; // 0..LANE_COUNT-1
  laneCount: number;
}) {
  const laneWidth = params.roadWidth / params.laneCount;
  return params.roadLeft + laneWidth * (params.laneIndex + 0.5);
}

export function entityRectFromLane(params: {
  roadLeft: number;
  roadWidth: number;
  laneIndex: number;
  laneCount: number;
  y: number;
  w: number;
  h: number;
}) {
  const cx = laneCenterX({
    roadLeft: params.roadLeft,
    roadWidth: params.roadWidth,
    laneIndex: params.laneIndex,
    laneCount: params.laneCount,
  });
  return { x: cx - params.w / 2, y: params.y, w: params.w, h: params.h } satisfies Rect;
}

