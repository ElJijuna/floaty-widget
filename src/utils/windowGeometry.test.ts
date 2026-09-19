import { describe, expect, it, vi } from 'vitest';
import {
  clampPosition,
  constrainSize,
  getSnapGeometry,
  getSnapZone,
  readPersistedState,
  writePersistedState,
} from './windowGeometry';

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

  it('rejects missing, malformed, and outdated persisted geometry', () => {
    const key = 'floaty-test:invalid-layout';
    expect(readPersistedState(key)).toBeNull();

    for (const value of [
      '{',
      '{"version":2,"position":{"x":1,"y":2}}',
      '{"version":1,"position":{"x":"1","y":2}}',
    ]) {
      window.localStorage.setItem(key, value);
      expect(readPersistedState(key)).toBeNull();
    }

    window.localStorage.removeItem(key);
  });

  it('round-trips valid persisted geometry and tolerates unavailable storage', () => {
    const key = 'floaty-test:layout';
    const state = {
      version: 1 as const,
      position: { x: 24, y: 32 },
      size: { width: 480, height: 260 },
      isCollapsed: false,
      isMinimized: false,
      isPinned: false,
      isMaximized: false,
      snapZone: null,
    };

    writePersistedState(key, state);
    expect(readPersistedState(key)).toEqual(state);

    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readPersistedState(key)).toBeNull();
    getItem.mockRestore();
    window.localStorage.removeItem(key);
  });
});
