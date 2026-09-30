import { describe, expect, it, vi } from 'vitest';
import {
  clampPosition,
  constrainSize,
  getLayoutDividers,
  getSnapGeometry,
  getSnapZone,
  getWindowLayout,
  moveLayoutBoundary,
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
    const insets = { top: 46, right: 6, bottom: 6, left: 6 };
    expect(clampPosition({ x: -10, y: 0 }, { width: 300, height: 200 }, 1000, 800, insets)).toEqual(
      { x: 6, y: 46 },
    );
    expect(
      clampPosition({ x: 900, y: 900 }, { width: 300, height: 200 }, 1000, 800, insets),
    ).toEqual({ x: 694, y: 594 });
    // Too small to fit: the top-left wins so the controls stay reachable.
    expect(clampPosition({ x: 50, y: 50 }, { width: 300, height: 200 }, 200, 150, insets)).toEqual({
      x: 6,
      y: 46,
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

  it('arranges windows in grid, columns, and rows with reserved space', () => {
    const viewport = { width: 1000, height: 800 };
    const options = { margin: 20, gap: 10, bottomInset: 50 };
    const grid = getWindowLayout(4, 'grid', viewport, options);

    expect(grid).toEqual([
      { position: { x: 20, y: 20 }, size: { width: 475, height: 350 } },
      { position: { x: 505, y: 20 }, size: { width: 475, height: 350 } },
      { position: { x: 20, y: 380 }, size: { width: 475, height: 350 } },
      { position: { x: 505, y: 380 }, size: { width: 475, height: 350 } },
    ]);
    expect(
      getWindowLayout(3, 'columns', viewport, options).map(({ position }) => position.y),
    ).toEqual([20, 20, 20]);
    expect(getWindowLayout(3, 'rows', viewport, options).map(({ position }) => position.x)).toEqual(
      [20, 20, 20],
    );
    expect(getWindowLayout(0, 'grid', viewport)).toEqual([]);
  });

  it('reserves insets on every edge on top of the margin', () => {
    const viewport = { width: 1000, height: 800 };
    const insets = { top: 60, right: 100, bottom: 72, left: 200 };

    expect(getWindowLayout(1, 'grid', viewport, { margin: 10, insets })).toEqual([
      { position: { x: 210, y: 70 }, size: { width: 680, height: 648 } },
    ]);
    expect(getWindowLayout(1, 'right', viewport, { margin: 0, insets, size: 300 })).toEqual([
      { position: { x: 600, y: 60 }, size: { width: 300, height: 668 } },
    ]);
    expect(getWindowLayout(1, 'top', viewport, { margin: 0, insets, size: 200 })).toEqual([
      { position: { x: 200, y: 60 }, size: { width: 700, height: 200 } },
    ]);
    // `insets.bottom` wins over the deprecated `bottomInset`; negative values are ignored.
    expect(
      getWindowLayout(1, 'grid', viewport, {
        margin: 0,
        bottomInset: 300,
        insets: { bottom: 100, left: -50 },
      })[0],
    ).toEqual({ position: { x: 0, y: 0 }, size: { width: 1000, height: 700 } });
  });

  it('docks windows stacked against each viewport edge', () => {
    const viewport = { width: 1000, height: 800 };
    const options = { margin: 20, gap: 10, bottomInset: 50, size: 300 };

    expect(getWindowLayout(3, 'left', viewport, options)).toEqual([
      { position: { x: 20, y: 20 }, size: { width: 300, height: 230 } },
      { position: { x: 20, y: 260 }, size: { width: 300, height: 230 } },
      { position: { x: 20, y: 500 }, size: { width: 300, height: 230 } },
    ]);
    expect(getWindowLayout(2, 'right', viewport, options)).toEqual([
      { position: { x: 680, y: 20 }, size: { width: 300, height: 350 } },
      { position: { x: 680, y: 380 }, size: { width: 300, height: 350 } },
    ]);
    expect(getWindowLayout(2, 'top', viewport, { ...options, size: 200 })).toEqual([
      { position: { x: 20, y: 20 }, size: { width: 475, height: 200 } },
      { position: { x: 505, y: 20 }, size: { width: 475, height: 200 } },
    ]);
    expect(getWindowLayout(2, 'bottom', viewport, { ...options, size: 200 })).toEqual([
      { position: { x: 20, y: 530 }, size: { width: 475, height: 200 } },
      { position: { x: 505, y: 530 }, size: { width: 475, height: 200 } },
    ]);
  });

  it('sizes tracks by weight and places a divider in each gap', () => {
    const viewport = { width: 1000, height: 800 };
    const options = { margin: 0, gap: 10, columnWeights: [3, 1] };

    expect(getWindowLayout(2, 'columns', viewport, options).map(({ size }) => size.width)).toEqual([
      747, 243,
    ]);
    expect(getLayoutDividers(2, 'columns', viewport, options)).toEqual([
      {
        id: 'column:0',
        orientation: 'vertical',
        rect: { x: 747, y: 0, width: 10, height: 800 },
        value: 75,
      },
    ]);
    // Rows get horizontal dividers; a single window has none.
    expect(
      getLayoutDividers(3, 'rows', viewport, { margin: 0, gap: 0 }).map(({ id, rect }) => [
        id,
        rect.height,
      ]),
    ).toEqual([
      ['row:0', 8],
      ['row:1', 8],
    ]);
    expect(getLayoutDividers(1, 'grid', viewport)).toEqual([]);
    expect(getLayoutDividers(0, 'grid', viewport)).toEqual([]);
  });

  it('moves a boundary so both tracks trade space within their minimum size', () => {
    const viewport = { width: 1000, height: 800 };
    const options = { margin: 0, gap: 10 };
    const moved = moveLayoutBoundary(2, 'columns', viewport, options, 'column:0', 505 + 5);

    expect(getWindowLayout(2, 'columns', viewport, moved).map(({ size }) => size.width)).toEqual([
      505, 485,
    ]);
    // The divider lands under the pointer.
    const [divider] = getLayoutDividers(2, 'columns', viewport, moved);
    expect(divider.rect.x + divider.rect.width / 2).toBe(510);

    const squeezed = moveLayoutBoundary(2, 'columns', viewport, options, 'column:0', 20);
    expect(getWindowLayout(2, 'columns', viewport, squeezed)[0].size.width).toBe(240);

    const rows = moveLayoutBoundary(2, 'rows', viewport, options, 'row:0', 205);
    expect(getWindowLayout(2, 'rows', viewport, rows)[0].size.height).toBe(200);

    // Unknown or out-of-range dividers leave the options untouched.
    expect(moveLayoutBoundary(2, 'columns', viewport, options, 'column:4', 10)).toBe(options);
    expect(moveLayoutBoundary(2, 'columns', viewport, options, 'size', 10)).toBe(options);
    expect(moveLayoutBoundary(2, 'columns', viewport, options, 'lane:0', 10)).toBe(options);
  });

  it('resizes docks from their inner edge and between stacked windows', () => {
    const viewport = { width: 1000, height: 800 };
    const options = { margin: 0, gap: 10, size: 300 };
    const dividers = getLayoutDividers(2, 'right', viewport, options);

    expect(dividers.map(({ id, orientation }) => [id, orientation])).toEqual([
      ['size', 'vertical'],
      ['row:0', 'horizontal'],
    ]);
    expect(dividers[0].rect).toEqual({ x: 690, y: 0, width: 10, height: 800 });

    const wider = moveLayoutBoundary(2, 'right', viewport, options, 'size', 600);
    expect(wider.size).toBe(395);
    expect(getWindowLayout(2, 'right', viewport, wider)[0]).toMatchObject({
      position: { x: 605 },
      size: { width: 395 },
    });
    expect(moveLayoutBoundary(2, 'left', viewport, options, 'size', 5000).size).toBe(1000);

    const taller = moveLayoutBoundary(2, 'right', viewport, options, 'row:0', 605);
    expect(getWindowLayout(2, 'right', viewport, taller)[0].size.height).toBe(600);
    const top = moveLayoutBoundary(2, 'top', viewport, { margin: 0, gap: 0 }, 'column:0', 700);
    expect(getWindowLayout(2, 'top', viewport, top)[0].size.width).toBe(700);
    // Multi-lane docks only expose their thickness.
    expect(
      getLayoutDividers(3, 'right', { width: 1000, height: 200 }, { margin: 0, gap: 0 }).map(
        ({ id }) => id,
      ),
    ).toEqual(['size']);
  });

  it('wraps docked windows into inward lanes and clamps thickness', () => {
    const viewport = { width: 1000, height: 200 };
    const docked = getWindowLayout(3, 'right', viewport, { margin: 0, gap: 0, size: 5000 });

    expect(docked.map(({ position }) => position)).toEqual([
      { x: 500, y: 0 },
      { x: 500, y: 100 },
      { x: 0, y: 0 },
    ]);
    expect(docked.map(({ size }) => size)).toEqual([
      { width: 500, height: 100 },
      { width: 500, height: 100 },
      { width: 500, height: 200 },
    ]);
    expect(getWindowLayout(1, 'left', viewport, { size: 10 })[0].size.width).toBe(240);
  });
});
