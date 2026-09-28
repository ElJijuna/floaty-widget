import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatyWidgetManager } from '../../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../../hooks/useFloatyWidgetManager';
import type { FloatyWidgetManagerHandle } from '../../types';
import { FloatyViewport } from './FloatyViewport';

let manager: FloatyWidgetManagerHandle;

const Capture = () => {
  manager = useFloatyWidgetManager();
  return null;
};

const Body = () => <span>body</span>;

const renderLayout = (count = 2) => {
  render(
    <FloatyWidgetManager>
      <Capture />
      <FloatyViewport />
    </FloatyWidgetManager>,
  );
  act(() => {
    for (let index = 0; index < count; index += 1) {
      manager.open({
        id: `w${index}`,
        mode: 'window',
        component: Body,
        props: {},
        size: { width: 300, height: 200 },
      });
    }
  });
};

const width = (id: string) => Number(manager.getWidget(id)?.size?.width);

describe('FloatyLayoutDividers', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    // Run pointer updates immediately instead of on the next frame.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dividers only while setLayout() keeps a resizable layout', () => {
    renderLayout();
    expect(screen.queryByRole('separator')).toBeNull();

    act(() => {
      manager.arrangeWindows('columns', { margin: 0, gap: 10 });
    });
    expect(screen.queryByRole('separator')).toBeNull();

    act(() => {
      manager.setLayout('columns', { margin: 0, gap: 10, animate: false });
    });
    const divider = screen.getByRole('separator', { name: 'Resize windows' });
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider).toHaveAttribute('aria-valuenow', '50');
    expect(divider).toHaveStyle({ left: '495px', width: '10px', height: '800px' });
    expect(manager.layoutDividers).toHaveLength(1);

    act(() => {
      manager.setLayout('columns', { margin: 0, gap: 10, resizable: false });
    });
    expect(screen.queryByRole('separator')).toBeNull();

    act(() => {
      manager.setLayout('columns', { margin: 0, gap: 10 });
    });
    act(() => {
      manager.maximizeWidget('w0');
    });
    // One window left in the layout: nothing to divide.
    expect(screen.queryByRole('separator')).toBeNull();

    act(() => {
      manager.setLayout(null);
    });
    expect(manager.layoutDividers).toEqual([]);
  });

  it('hides dividers while a window covers the layout maximized', () => {
    renderLayout(3);
    act(() => {
      manager.setLayout('columns', { margin: 0, gap: 10, animate: false });
    });
    expect(screen.getAllByRole('separator')).toHaveLength(2);

    act(() => manager.maximizeWidget('w0'));
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('resizes neighbouring windows by dragging, keyboard and double-click reset', () => {
    renderLayout();
    act(() => {
      manager.setLayout('columns', { margin: 0, gap: 10, animate: false });
    });
    expect([width('w0'), width('w1')]).toEqual([495, 495]);

    const divider = screen.getByRole('separator');
    divider.setPointerCapture = vi.fn();
    // The viewport sits 20px from the window origin (e.g. a padded container), so pointer
    // coordinates are 20px ahead of layout coordinates.
    vi.spyOn(divider, 'getBoundingClientRect').mockReturnValue({
      left: 515,
      top: 0,
      width: 10,
      height: 800,
    } as DOMRect);
    fireEvent.pointerDown(divider, { clientX: 520, pointerId: 1 });
    expect(divider).toHaveAttribute('data-dragging', 'true');
    fireEvent.pointerMove(divider, { clientX: 630, pointerId: 1 });
    fireEvent.pointerUp(divider, { clientX: 630, pointerId: 1 });

    expect(divider).not.toHaveAttribute('data-dragging');
    expect([width('w0'), width('w1')]).toEqual([605, 385]);
    expect(manager.layout?.options.columnWeights?.[0]).toBeGreaterThan(1);
    expect(screen.getByRole('separator')).toHaveStyle({ left: '605px' });

    // Moves from another pointer are ignored.
    fireEvent.pointerMove(divider, { clientX: 300, pointerId: 2 });
    expect(width('w0')).toBe(605);

    fireEvent.keyDown(divider, { key: 'ArrowLeft' });
    expect(width('w0')).toBe(589);
    fireEvent.keyDown(divider, { key: 'ArrowRight', shiftKey: true });
    expect(width('w0')).toBe(653);
    fireEvent.keyDown(divider, { key: 'ArrowUp' });
    expect(width('w0')).toBe(653);

    // New windows keep the custom split for existing tracks.
    act(() => {
      manager.open({ id: 'w2', mode: 'window', component: Body, props: {} });
    });
    expect(width('w0')).toBeGreaterThan(width('w1'));

    fireEvent.doubleClick(screen.getAllByRole('separator')[0]);
    expect(manager.layout?.options.columnWeights).toBeUndefined();
    // Even tracks again (pixel rounding may differ by one).
    expect(Math.abs(width('w0') - width('w1'))).toBeLessThanOrEqual(1);
  });

  it('resizes a dock from its inner edge', () => {
    renderLayout();
    act(() => {
      manager.setLayout('left', { margin: 0, gap: 10, size: 300, animate: false });
    });

    const edge = document.querySelector<HTMLElement>('[data-divider-id="size"]') as HTMLElement;
    const stack = document.querySelector<HTMLElement>('[data-divider-id="row:0"]') as HTMLElement;
    expect(stack).toHaveAttribute('aria-orientation', 'horizontal');

    fireEvent.keyDown(edge, { key: 'ArrowRight', shiftKey: true });
    expect(manager.layout?.options.size).toBe(364);
    expect(width('w0')).toBe(364);

    fireEvent.keyDown(stack, { key: 'ArrowDown' });
    expect(manager.getWidget('w0')?.size?.height).toBe(411);

    // The dock thickness has no even split to reset to.
    fireEvent.doubleClick(edge);
    expect(manager.layout?.options.size).toBe(364);
  });
});
