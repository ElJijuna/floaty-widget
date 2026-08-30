import { describe, expect, it } from 'vitest';
import { clampPosition, constrainSize, getSnapGeometry, getSnapZone } from './windowGeometry';

describe('window geometry utilities', () => {
  it('detects edge and corner snap zones', () => {
    expect(getSnapZone({ x: 2, y: 2 }, 1000, 800)).toBe('top-left');
    expect(getSnapZone({ x: 500, y: 2 }, 1000, 800)).toBe('top');
    expect(getSnapZone({ x: 999, y: 400 }, 1000, 800)).toBe('right');
    expect(getSnapZone({ x: 500, y: 400 }, 1000, 800)).toBeNull();
  });

  it('builds deterministic half and quarter viewport geometry', () => {
    expect(getSnapGeometry('right', 1001, 801)).toEqual({
      position: { x: 500, y: 0 },
      size: { width: 501, height: 801 },
    });
    expect(getSnapGeometry('bottom-left', 1001, 801)).toEqual({
      position: { x: 0, y: 400 },
      size: { width: 500, height: 401 },
    });
  });

  it('clamps position and constrained size to available bounds', () => {
    expect(clampPosition({ x: 900, y: -4 }, { width: 300, height: 200 }, 1000, 800)).toEqual({
      x: 700,
      y: 0,
    });
    expect(
      constrainSize(
        { width: 900, height: 40 },
        { minWidth: 300, minHeight: 120, maxWidth: 700 },
        { width: 800, height: 600 },
      ),
    ).toEqual({ width: 700, height: 120 });
  });
});
