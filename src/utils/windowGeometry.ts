import type {
  FloatyArrangeOptions,
  FloatyDockEdge,
  FloatyGeometry,
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

/**
 * Stacks windows against one viewport edge: vertically for `left`/`right`, side by side for
 * `top`/`bottom`. Windows that do not fit at their minimum size wrap into extra lanes inward.
 */
const getDockLayout = (
  count: number,
  edge: FloatyDockEdge,
  bounds: { x: number; y: number; width: number; height: number },
  gap: number,
  size: number | undefined,
): FloatyGeometry[] => {
  const vertical = edge === 'left' || edge === 'right';
  const length = vertical ? bounds.height : bounds.width;
  const depth = vertical ? bounds.width : bounds.height;
  const minLength = vertical ? DEFAULT_MIN_HEIGHT : DEFAULT_MIN_WIDTH;
  const minThickness = vertical ? DEFAULT_MIN_WIDTH : DEFAULT_MIN_HEIGHT;
  const perLane = Math.min(count, Math.max(1, Math.floor((length + gap) / (minLength + gap))));
  const lanes = Math.ceil(count / perLane);
  const requested = size ?? (vertical ? DEFAULT_DOCK_WIDTH : DEFAULT_DOCK_HEIGHT);
  const maxThickness = Math.max(1, Math.floor((depth - gap * (lanes - 1)) / lanes));
  const thickness = Math.min(maxThickness, Math.max(minThickness, Math.floor(requested)));
  const fromEnd = edge === 'right' || edge === 'bottom';

  return Array.from({ length: count }, (_, index) => {
    const lane = Math.floor(index / perLane);
    const slot = index % perLane;
    const slots = Math.min(perLane, count - lane * perLane);
    const step = (length + gap) / slots;
    const start = Math.floor(slot * step);
    const extent = Math.max(1, Math.floor((slot + 1) * step) - gap - start);
    const offset = lane * (thickness + gap);
    const across = fromEnd ? depth - offset - thickness : offset;

    return vertical
      ? {
          position: { x: bounds.x + across, y: bounds.y + start },
          size: { width: thickness, height: extent },
        }
      : {
          position: { x: bounds.x + start, y: bounds.y + across },
          size: { width: extent, height: thickness },
        };
  });
};

/** Computes non-overlapping cells for a set of windows within the usable viewport. */
export const getWindowLayout = (
  count: number,
  layout: FloatyWindowArrangement,
  viewport: { width: number; height: number },
  options: FloatyArrangeOptions = {},
): FloatyGeometry[] => {
  if (count <= 0) {
    return [];
  }

  const margin = Math.max(0, options.margin ?? 16);
  const gap = Math.max(0, options.gap ?? 12);
  const bottomInset = Math.max(0, options.bottomInset ?? 0);
  const usableWidth = Math.max(1, viewport.width - margin * 2);
  const usableHeight = Math.max(1, viewport.height - margin * 2 - bottomInset);

  if (isDockEdge(layout)) {
    return getDockLayout(
      count,
      layout,
      { x: margin, y: margin, width: usableWidth, height: usableHeight },
      gap,
      options.size,
    );
  }

  const maxColumns = Math.max(1, Math.floor((usableWidth + gap) / (DEFAULT_MIN_WIDTH + gap)));
  const maxRows = Math.max(1, Math.floor((usableHeight + gap) / (DEFAULT_MIN_HEIGHT + gap)));
  const columns =
    layout === 'columns'
      ? Math.min(count, maxColumns)
      : layout === 'rows'
        ? Math.ceil(count / Math.min(count, maxRows))
        : Math.min(Math.ceil(Math.sqrt(count)), maxColumns);
  const rows = Math.ceil(count / columns);
  const widthStep = (usableWidth + gap) / columns;
  const heightStep = (usableHeight + gap) / rows;

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = margin + Math.floor(column * widthStep);
    const y = margin + Math.floor(row * heightStep);
    const right = margin + Math.floor((column + 1) * widthStep) - gap;
    const bottom = margin + Math.floor((row + 1) * heightStep) - gap;

    return {
      position: { x, y },
      size: { width: Math.max(1, right - x), height: Math.max(1, bottom - y) },
    };
  });
};

export const numericSize = (value: number | string | undefined, fallback: number) =>
  typeof value === 'number' ? value : fallback;

export const clampPosition = (
  position: FloatyPosition,
  size: FloatySize | undefined,
  viewportWidth = typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerWidth,
  viewportHeight = typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerHeight,
): FloatyPosition => {
  const width = numericSize(size?.width, 320);
  const height = numericSize(size?.height, DEFAULT_MIN_HEIGHT);

  return {
    x: Math.max(0, Math.min(position.x, Math.max(0, viewportWidth - width))),
    y: Math.max(0, Math.min(position.y, Math.max(0, viewportHeight - height))),
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
