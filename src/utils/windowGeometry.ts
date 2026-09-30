import type {
  FloatyArrangeOptions,
  FloatyDockEdge,
  FloatyGeometry,
  FloatyLayoutDivider,
  FloatyPersistedState,
  FloatyPosition,
  FloatySize,
  FloatySizeConstraints,
  FloatySnapZone,
  FloatyWindowArrangement,
} from '../types';

export const DEFAULT_MIN_WIDTH = 240;
export const DEFAULT_MIN_HEIGHT = 96;
export const DEFAULT_SNAP_THRESHOLD = 28;
export const DEFAULT_DOCK_WIDTH = 360;
export const DEFAULT_DOCK_HEIGHT = 240;

const DOCK_EDGES: readonly FloatyWindowArrangement[] = ['left', 'right', 'top', 'bottom'];

export const isDockEdge = (layout: FloatyWindowArrangement): layout is FloatyDockEdge =>
  DOCK_EDGES.includes(layout);

/** Rectangle occupied by a layout divider, in viewport pixels. */
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Tracks laid out along one axis, sized by weight. */
interface TrackAxis {
  start: number;
  length: number;
  weights: number[];
  min: number;
}

interface LayoutPlan {
  geometries: FloatyGeometry[];
  dividers: FloatyLayoutDivider[];
  gap: number;
  axes: { column?: TrackAxis; row?: TrackAxis };
  dock?: {
    edge: FloatyDockEdge;
    bounds: Rect;
    lanes: number;
    minThickness: number;
    maxThickness: number;
  };
}

/** Minimum hit area for a divider, even when the gap between windows is smaller. */
const DIVIDER_HIT_SIZE = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Pads or trims weights to `count` tracks; missing or invalid entries take the average weight. */
const normalizeWeights = (weights: number[] | undefined, count: number) => {
  const valid = (weights ?? []).filter((weight) => Number.isFinite(weight) && weight > 0);
  const fallback = valid.length ? valid.reduce((sum, weight) => sum + weight, 0) / valid.length : 1;

  return Array.from({ length: count }, (_, index) => {
    const weight = weights?.[index];
    return weight !== undefined && Number.isFinite(weight) && weight > 0 ? weight : fallback;
  });
};

/** Start and end pixel of each track; equal weights split the axis exactly like equal cells. */
const getTrackEdges = (start: number, length: number, gap: number, weights: number[]) => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const unit = (length + gap) / total;
  // The epsilon keeps weights derived from pixel sizes (e.g. 509.9999…) on the intended pixel.
  const toPixel = (value: number) => start + Math.floor(value * unit + 1e-6);
  let accumulated = 0;

  return weights.map((weight) => {
    const trackStart = toPixel(accumulated);
    accumulated += weight;
    return [trackStart, toPixel(accumulated) - gap] as const;
  });
};

/** Dividers sit centred in the gap between two tracks. */
const getGapCenters = (edges: ReturnType<typeof getTrackEdges>) =>
  edges.slice(0, -1).map(([, end], index) => (end + edges[index + 1][0]) / 2);

/** Share of the first track within the pair around a boundary, as a percentage. */
const getBoundaryValue = (edges: ReturnType<typeof getTrackEdges>, index: number) => {
  const first = edges[index][1] - edges[index][0];
  const second = edges[index + 1][1] - edges[index + 1][0];
  return Math.round((first / Math.max(1, first + second)) * 100);
};

const resolveBounds = (
  viewport: { width: number; height: number },
  options: FloatyArrangeOptions,
): { bounds: Rect; gap: number } => {
  const margin = Math.max(0, options.margin ?? 16);
  const gap = Math.max(0, options.gap ?? 12);
  const inset = (value: number | undefined) => Math.max(0, value ?? 0);
  const left = margin + inset(options.insets?.left);
  const top = margin + inset(options.insets?.top);
  const right = margin + inset(options.insets?.right);
  const bottom = margin + inset(options.insets?.bottom ?? options.bottomInset);

  return {
    bounds: {
      x: left,
      y: top,
      width: Math.max(1, viewport.width - left - right),
      height: Math.max(1, viewport.height - top - bottom),
    },
    gap,
  };
};

/**
 * Stacks windows against one viewport edge: vertically for `left`/`right`, side by side for
 * `top`/`bottom`. Windows that do not fit at their minimum size wrap into extra lanes inward.
 */
const planDockLayout = (
  count: number,
  edge: FloatyDockEdge,
  bounds: Rect,
  gap: number,
  options: FloatyArrangeOptions,
): LayoutPlan => {
  const vertical = edge === 'left' || edge === 'right';
  const length = vertical ? bounds.height : bounds.width;
  const depth = vertical ? bounds.width : bounds.height;
  const lengthStart = vertical ? bounds.y : bounds.x;
  const depthStart = vertical ? bounds.x : bounds.y;
  const minLength = vertical ? DEFAULT_MIN_HEIGHT : DEFAULT_MIN_WIDTH;
  const minThickness = vertical ? DEFAULT_MIN_WIDTH : DEFAULT_MIN_HEIGHT;
  const perLane = Math.min(count, Math.max(1, Math.floor((length + gap) / (minLength + gap))));
  const lanes = Math.ceil(count / perLane);
  const requested = options.size ?? (vertical ? DEFAULT_DOCK_WIDTH : DEFAULT_DOCK_HEIGHT);
  const maxThickness = Math.max(1, Math.floor((depth - gap * (lanes - 1)) / lanes));
  const thickness = Math.min(maxThickness, Math.max(minThickness, Math.floor(requested)));
  const fromEnd = edge === 'right' || edge === 'bottom';
  const slotWeights = normalizeWeights(
    vertical ? options.rowWeights : options.columnWeights,
    perLane,
  );
  const hit = Math.max(gap, DIVIDER_HIT_SIZE);
  const toRect = (along: number, alongSize: number, across: number, acrossSize: number): Rect =>
    vertical
      ? { x: depthStart + across, y: along, width: acrossSize, height: alongSize }
      : { x: along, y: depthStart + across, width: alongSize, height: acrossSize };

  const geometries = Array.from({ length: count }, (_, index) => {
    const lane = Math.floor(index / perLane);
    const slot = index % perLane;
    const slots = Math.min(perLane, count - lane * perLane);
    const [start, end] = getTrackEdges(0, length, gap, slotWeights.slice(0, slots))[slot];
    const offset = lane * (thickness + gap);
    const across = fromEnd ? depth - offset - thickness : offset;
    const rect = toRect(lengthStart + start, Math.max(1, end - start), across, thickness);

    return {
      position: { x: rect.x, y: rect.y },
      size: { width: rect.width, height: rect.height },
    };
  });

  // The inner edge of the dock resizes its thickness.
  const innerOffset = lanes * thickness + (lanes - 1) * gap;
  const innerCenter = fromEnd ? depth - innerOffset - gap / 2 : innerOffset + gap / 2;
  const dividers: FloatyLayoutDivider[] = [
    {
      id: 'size',
      orientation: vertical ? 'vertical' : 'horizontal',
      rect: toRect(lengthStart, length, innerCenter - hit / 2, hit),
      value: Math.round((thickness / depth) * 100),
    },
  ];

  // Windows stacked in a single lane can trade space with their neighbours.
  if (lanes === 1 && count > 1) {
    const edges = getTrackEdges(lengthStart, length, gap, slotWeights);
    const across = fromEnd ? depth - thickness : 0;

    getGapCenters(edges).forEach((center, index) => {
      dividers.push({
        id: `${vertical ? 'row' : 'column'}:${index}`,
        orientation: vertical ? 'horizontal' : 'vertical',
        rect: toRect(center - hit / 2, hit, across, thickness),
        value: getBoundaryValue(edges, index),
      });
    });
  }

  const slotAxis: TrackAxis = {
    start: lengthStart,
    length,
    weights: slotWeights,
    min: minLength,
  };

  return {
    geometries,
    dividers,
    gap,
    axes: lanes === 1 ? (vertical ? { row: slotAxis } : { column: slotAxis }) : {},
    dock: { edge, bounds, lanes, minThickness, maxThickness },
  };
};

const planLayout = (
  count: number,
  layout: FloatyWindowArrangement,
  viewport: { width: number; height: number },
  options: FloatyArrangeOptions,
): LayoutPlan => {
  const { bounds, gap } = resolveBounds(viewport, options);

  if (count <= 0) {
    return { geometries: [], dividers: [], gap, axes: {} };
  }

  if (isDockEdge(layout)) {
    return planDockLayout(count, layout, bounds, gap, options);
  }

  const maxColumns = Math.max(1, Math.floor((bounds.width + gap) / (DEFAULT_MIN_WIDTH + gap)));
  const maxRows = Math.max(1, Math.floor((bounds.height + gap) / (DEFAULT_MIN_HEIGHT + gap)));
  const columns =
    layout === 'columns'
      ? Math.min(count, maxColumns)
      : layout === 'rows'
        ? Math.ceil(count / Math.min(count, maxRows))
        : Math.min(Math.ceil(Math.sqrt(count)), maxColumns);
  const rows = Math.ceil(count / columns);
  const column: TrackAxis = {
    start: bounds.x,
    length: bounds.width,
    weights: normalizeWeights(options.columnWeights, columns),
    min: DEFAULT_MIN_WIDTH,
  };
  const row: TrackAxis = {
    start: bounds.y,
    length: bounds.height,
    weights: normalizeWeights(options.rowWeights, rows),
    min: DEFAULT_MIN_HEIGHT,
  };
  const columnEdges = getTrackEdges(column.start, column.length, gap, column.weights);
  const rowEdges = getTrackEdges(row.start, row.length, gap, row.weights);
  const hit = Math.max(gap, DIVIDER_HIT_SIZE);

  const geometries = Array.from({ length: count }, (_, index) => {
    const [x, cellRight] = columnEdges[index % columns];
    const [y, cellBottom] = rowEdges[Math.floor(index / columns)];

    return {
      position: { x, y },
      size: { width: Math.max(1, cellRight - x), height: Math.max(1, cellBottom - y) },
    };
  });

  const dividers: FloatyLayoutDivider[] = [
    ...getGapCenters(columnEdges).map((center, index) => ({
      id: `column:${index}`,
      orientation: 'vertical' as const,
      rect: { x: center - hit / 2, y: bounds.y, width: hit, height: bounds.height },
      value: getBoundaryValue(columnEdges, index),
    })),
    ...getGapCenters(rowEdges).map((center, index) => ({
      id: `row:${index}`,
      orientation: 'horizontal' as const,
      rect: { x: bounds.x, y: center - hit / 2, width: bounds.width, height: hit },
      value: getBoundaryValue(rowEdges, index),
    })),
  ];

  return { geometries, dividers, gap, axes: { column, row } };
};

/** Computes non-overlapping cells for a set of windows within the usable viewport. */
export const getWindowLayout = (
  count: number,
  layout: FloatyWindowArrangement,
  viewport: { width: number; height: number },
  options: FloatyArrangeOptions = {},
): FloatyGeometry[] => planLayout(count, layout, viewport, options).geometries;

/** Dividers between neighbouring windows of a layout, plus the inner edge of a dock. */
export const getLayoutDividers = (
  count: number,
  layout: FloatyWindowArrangement,
  viewport: { width: number; height: number },
  options: FloatyArrangeOptions = {},
): FloatyLayoutDivider[] => planLayout(count, layout, viewport, options).dividers;

/**
 * Returns layout options with the divider `id` moved to `coordinate` (x for vertical dividers,
 * y for horizontal ones). The two tracks around it trade space, and neither goes below its
 * minimum size; the `size` divider changes the dock thickness.
 */
export const moveLayoutBoundary = (
  count: number,
  layout: FloatyWindowArrangement,
  viewport: { width: number; height: number },
  options: FloatyArrangeOptions,
  id: string,
  coordinate: number,
): FloatyArrangeOptions => {
  const plan = planLayout(count, layout, viewport, options);

  if (id === 'size') {
    if (!plan.dock) {
      return options;
    }

    const { edge, bounds, lanes, minThickness, maxThickness } = plan.dock;
    const vertical = edge === 'left' || edge === 'right';
    const origin = vertical ? bounds.x : bounds.y;
    const depth = vertical ? bounds.width : bounds.height;
    const distance =
      edge === 'right' || edge === 'bottom' ? origin + depth - coordinate : coordinate - origin;
    const thickness = (distance - plan.gap / 2 - plan.gap * (lanes - 1)) / lanes;

    return { ...options, size: Math.round(clamp(thickness, minThickness, maxThickness)) };
  }

  const [kind, indexText] = id.split(':');
  const axis = kind === 'column' || kind === 'row' ? plan.axes[kind] : undefined;
  const index = Number(indexText);

  if (!axis || !Number.isInteger(index) || index < 0 || index >= axis.weights.length - 1) {
    return options;
  }

  const edges = getTrackEdges(axis.start, axis.length, plan.gap, axis.weights);
  const [pairStart] = edges[index];
  const available = edges[index + 1][1] - pairStart - plan.gap;
  const min = Math.min(axis.min, available / 2);
  const first = clamp(coordinate - plan.gap / 2 - pairStart, min, available - min);
  const weights = [...axis.weights];
  const pair = weights[index] + weights[index + 1];

  // Each track spans `weight × unit − gap` pixels, so the pair keeps its total weight.
  weights[index] = (pair * (first + plan.gap)) / (available + 2 * plan.gap);
  weights[index + 1] = pair - weights[index];

  return { ...options, [kind === 'column' ? 'columnWeights' : 'rowWeights']: weights };
};

export const numericSize = (value: number | string | undefined, fallback: number) =>
  typeof value === 'number' ? value : fallback;

/** Space a widget draws outside its own box, such as the floating frame and its controls. */
export interface ChromeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const NO_CHROME_INSETS: ChromeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Keeps a widget inside the viewport, including anything it draws outside its box (`insets`).
 * When the viewport is too small, the top-left wins so the controls stay reachable.
 */
export const clampPosition = (
  position: FloatyPosition,
  size: FloatySize | undefined,
  viewportWidth = typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerWidth,
  viewportHeight = typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerHeight,
  insets: ChromeInsets = NO_CHROME_INSETS,
): FloatyPosition => {
  const width = numericSize(size?.width, 320);
  const height = numericSize(size?.height, DEFAULT_MIN_HEIGHT);

  return {
    x: Math.max(insets.left, Math.min(position.x, viewportWidth - width - insets.right)),
    y: Math.max(insets.top, Math.min(position.y, viewportHeight - height - insets.bottom)),
  };
};

export const getSnapZone = (
  pointer: FloatyPosition,
  viewportWidth: number,
  viewportHeight: number,
  threshold = DEFAULT_SNAP_THRESHOLD,
): FloatySnapZone | null => {
  const nearLeft = pointer.x <= threshold;
  const nearRight = pointer.x >= viewportWidth - threshold;
  const nearTop = pointer.y <= threshold;
  const nearBottom = pointer.y >= viewportHeight - threshold;

  if (nearTop && nearLeft) {
    return 'top-left';
  }
  if (nearTop && nearRight) {
    return 'top-right';
  }
  if (nearBottom && nearLeft) {
    return 'bottom-left';
  }
  if (nearBottom && nearRight) {
    return 'bottom-right';
  }
  if (nearTop) {
    return 'top';
  }
  if (nearLeft) {
    return 'left';
  }
  if (nearRight) {
    return 'right';
  }

  return null;
};

export const getSnapGeometry = (
  zone: FloatySnapZone,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
): FloatyGeometry => {
  const halfWidth = Math.floor(viewportWidth / 2);
  const halfHeight = Math.floor(viewportHeight / 2);

  const geometries: Record<FloatySnapZone, FloatyGeometry> = {
    top: { position: { x: 0, y: 0 }, size: { width: viewportWidth, height: viewportHeight } },
    left: { position: { x: 0, y: 0 }, size: { width: halfWidth, height: viewportHeight } },
    right: {
      position: { x: halfWidth, y: 0 },
      size: { width: viewportWidth - halfWidth, height: viewportHeight },
    },
    'top-left': { position: { x: 0, y: 0 }, size: { width: halfWidth, height: halfHeight } },
    'top-right': {
      position: { x: halfWidth, y: 0 },
      size: { width: viewportWidth - halfWidth, height: halfHeight },
    },
    'bottom-left': {
      position: { x: 0, y: halfHeight },
      size: { width: halfWidth, height: viewportHeight - halfHeight },
    },
    'bottom-right': {
      position: { x: halfWidth, y: halfHeight },
      size: { width: viewportWidth - halfWidth, height: viewportHeight - halfHeight },
    },
  };

  return geometries[zone];
};

export const constrainSize = (
  size: Required<Pick<FloatySize, 'width' | 'height'>>,
  constraints: FloatySizeConstraints,
  available: { width: number; height: number },
): { width: number; height: number } => {
  const width = numericSize(size.width, DEFAULT_MIN_WIDTH);
  const height = numericSize(size.height, DEFAULT_MIN_HEIGHT);
  const minWidth = constraints.minWidth ?? DEFAULT_MIN_WIDTH;
  const minHeight = constraints.minHeight ?? DEFAULT_MIN_HEIGHT;
  const maxWidth = Math.max(
    minWidth,
    Math.min(constraints.maxWidth ?? available.width, available.width),
  );
  const maxHeight = Math.max(
    minHeight,
    Math.min(constraints.maxHeight ?? available.height, available.height),
  );

  return {
    width: Math.max(minWidth, Math.min(width, maxWidth)),
    height: Math.max(minHeight, Math.min(height, maxHeight)),
  };
};

export const readPersistedState = (key?: string): FloatyPersistedState | null => {
  if (!key || typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);
    if (!value) {
      return null;
    }
    const parsed = JSON.parse(value) as Partial<FloatyPersistedState>;

    if (
      parsed.version !== 1 ||
      typeof parsed.position?.x !== 'number' ||
      typeof parsed.position?.y !== 'number'
    ) {
      return null;
    }

    return parsed as FloatyPersistedState;
  } catch {
    return null;
  }
};

export const writePersistedState = (key: string, state: FloatyPersistedState) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage may be unavailable in privacy mode or embedded documents.
  }
};
