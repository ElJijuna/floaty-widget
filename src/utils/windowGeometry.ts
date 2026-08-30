import type {
  FloatyGeometry,
  FloatyPersistedState,
  FloatyPosition,
  FloatySize,
  FloatySizeConstraints,
  FloatySnapZone,
} from '../types';

export const DEFAULT_MIN_WIDTH = 240;
export const DEFAULT_MIN_HEIGHT = 96;
export const DEFAULT_SNAP_THRESHOLD = 28;

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
