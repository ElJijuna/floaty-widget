import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FloatyTaskbar } from '../components/Floaty/FloatyTaskbar';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import type { FloatyWidgetManagerHandle } from '../types';
import { FloatyWidgetManager } from './FloatyWidgetManager';

const Counter = ({ label }: { label: string }) => {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      {label} {count}
    </button>
  );
};

let manager: FloatyWidgetManagerHandle;

const Capture = () => {
  manager = useFloatyWidgetManager();
  return null;
};

const renderWorkspace = ({
  windowGrouping = true,
  children,
}: {
  windowGrouping?: boolean;
  children?: ReactNode;
} = {}) =>
  render(
    <FloatyWidgetManager windowGrouping={windowGrouping}>
      <Capture />
      <FloatyViewport />
      {children}
    </FloatyWidgetManager>,
  );

const openWindow = (id: string, x: number, y = 40) =>
  manager.open({
    id,
    title: id.toUpperCase(),
    mode: 'window',
    component: Counter,
    props: { label: id },
    position: { x, y },
    size: { width: 300, height: 200 },
  });

const root = (id: string) => document.querySelector<HTMLElement>(`[data-floaty-id="${id}"]`);

const visibleTabs = () => {
  const visible = Array.from(document.querySelectorAll<HTMLElement>('.floaty')).find(
    (element) => !element.hidden,
  );

  return within(visible as HTMLElement).getAllByRole('tab');
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('window groups', () => {
  it('merges windows into tabs that keep their content state', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 500);
    });

    fireEvent.click(screen.getByRole('button', { name: 'b 0' }));

    let groupId: string | null = null;
    act(() => {
      groupId = manager.groupWindows(['a', 'b']);
    });

    expect(groupId).toMatch(/^floaty-group-/);
    expect(manager.getGroup('a')).toEqual({ id: groupId, widgetIds: ['a', 'b'], activeId: 'b' });
    expect(manager.getWidget('a')?.groupId).toBe(groupId);
    expect(root('a')).not.toBeVisible();
    expect(root('b')).toBeVisible();
    // The dropped window takes the target window's place.
    expect(root('b')).toHaveStyle({ transform: 'translate(40px, 40px)' });
    expect(visibleTabs().map((tab) => tab.textContent)).toEqual(['A', 'B']);
    expect(visibleTabs()[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(visibleTabs()[0]);
    expect(root('a')).toBeVisible();
    expect(root('b')).not.toBeVisible();
    expect(manager.getGroup('a')?.activeId).toBe('a');

    fireEvent.click(visibleTabs()[1]);
    // Nothing was remounted: the counter kept its value.
    expect(screen.getByRole('button', { name: 'b 1' })).toBeVisible();
  });

  it('syncs geometry between tabs and treats the group as one window when arranging', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 500);
      openWindow('c', 900);
      manager.groupWindows(['a', 'b']);
    });

    act(() => manager.update('b', { position: { x: 120, y: 90 } }));
    act(() => manager.setActiveTab('a'));
    expect(root('a')).toHaveStyle({ transform: 'translate(120px, 90px)' });

    let arranged = 0;
    act(() => {
      arranged = manager.arrangeWindows('columns', { margin: 0, gap: 0, animate: false });
    });
    expect(arranged).toBe(2);
    expect(manager.getWidget('a')?.position).toEqual({ x: 0, y: 0 });
    expect(manager.getWidget('c')?.position?.x).toBe(Math.floor(window.innerWidth / 2));
  });

  it('merges whole groups and keeps the target group', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 400);
      openWindow('c', 800);
      openWindow('d', 800, 400);
    });

    let first: string | null = null;
    act(() => {
      first = manager.groupWindows(['a', 'b']);
      manager.groupWindows(['c', 'd']);
    });
    act(() => {
      expect(manager.groupWindows(['a', 'c'])).toBe(first);
    });

    expect(manager.groups.size).toBe(1);
    expect(manager.getGroup('d')).toEqual({
      id: first,
      widgetIds: ['a', 'b', 'c', 'd'],
      activeId: 'c',
    });
    expect(manager.groupWindows(['a'])).toBeNull();
    expect(manager.groupWindows(['a', 'missing'])).toBeNull();
  });

  it('hands the window to a neighbour when the active tab closes and dissolves single tabs', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 400);
      openWindow('c', 800);
      manager.groupWindows(['a', 'b', 'c']);
    });

    expect(manager.getGroup('a')?.activeId).toBe('c');

    act(() => manager.close('c'));
    expect(manager.getGroup('a')).toMatchObject({ widgetIds: ['a', 'b'], activeId: 'b' });
    expect(root('b')).toBeVisible();

    act(() => manager.close('a'));
    expect(manager.groups.size).toBe(0);
    expect(manager.getWidget('b')?.groupId).toBeUndefined();
    expect(root('b')).toBeVisible();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('detaches a tab into a standalone window', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 400);
      manager.groupWindows(['a', 'b']);
    });

    act(() => manager.ungroupWindow('a', { x: 300, y: 250 }));

    expect(manager.groups.size).toBe(0);
    expect(root('a')).toBeVisible();
    expect(root('b')).toBeVisible();
    expect(root('a')).toHaveStyle({ transform: 'translate(300px, 250px)' });
    expect(manager.getWidget('a')?.zIndex).toBeGreaterThan(manager.getWidget('b')?.zIndex ?? 0);
  });

  it('supports keyboard navigation, closing and detaching from the tab strip', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 400);
      openWindow('c', 800);
      manager.groupWindows(['a', 'b', 'c']);
    });

    const [, , tabC] = visibleTabs();
    expect(tabC).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(tabC, { key: 'ArrowRight' });
    expect(manager.getGroup('a')?.activeId).toBe('a');
    expect(visibleTabs()[0]).toHaveFocus();

    fireEvent.keyDown(visibleTabs()[0], { key: 'End' });
    expect(manager.getGroup('a')?.activeId).toBe('c');

    fireEvent.keyDown(visibleTabs()[2], { key: 'Delete' });
    expect(manager.getWidget('c')).toBeUndefined();

    fireEvent.keyDown(visibleTabs()[1], { key: 'ArrowDown', altKey: true });
    expect(manager.groups.size).toBe(0);
    expect(manager.getWidget('b')?.groupId).toBeUndefined();

    act(() => manager.groupWindows(['a', 'b']));
    const closeButton = screen.getByRole('button', { name: 'Close: A' });
    fireEvent.click(closeButton);
    expect(manager.getWidget('a')).toBeUndefined();
  });

  it('detaches a tab dragged out of the strip at the drop point', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 400);
      manager.groupWindows(['a', 'b']);
    });

    const [tab] = visibleTabs();
    tab.setPointerCapture = vi.fn();
    vi.spyOn(
      tab.closest('[role="tablist"]') as HTMLElement,
      'getBoundingClientRect',
    ).mockReturnValue({
      left: 40,
      top: 40,
      right: 340,
      bottom: 78,
      width: 300,
      height: 38,
    } as DOMRect);
    fireEvent.pointerDown(tab, { clientX: 60, clientY: 50, pointerId: 3 });
    fireEvent.pointerMove(tab, { clientX: 70, clientY: 52, pointerId: 3 });
    expect(tab).not.toHaveAttribute('data-detaching');
    fireEvent.pointerMove(tab, { clientX: 400, clientY: 300, pointerId: 3 });
    expect(tab).toHaveAttribute('data-detaching');
    fireEvent.pointerUp(tab, { clientX: 400, clientY: 300, pointerId: 3 });
    fireEvent.click(tab);

    expect(manager.groups.size).toBe(0);
    expect(manager.getWidget('a')?.position).toEqual({ x: 340, y: 284 });
    expect(manager.getGroup('b')).toBeUndefined();
  });

  it('merges a window dropped on another title bar when grouping is enabled', () => {
    renderWorkspace();
    act(() => {
      openWindow('a', 40);
      openWindow('b', 500);
    });

    const targetHeader = root('a')?.querySelector('.floaty-header') as HTMLElement;
    const draggedHeader = root('b')?.querySelector('.floaty-header') as HTMLElement;
    draggedHeader.setPointerCapture = vi.fn();
    const elementsFromPoint = vi.fn(() => [draggedHeader, targetHeader]);
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: elementsFromPoint,
    });

    fireEvent.pointerDown(draggedHeader, { clientX: 600, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(globalThis as unknown as Window, {
      clientX: 120,
      clientY: 55,
      pointerId: 1,
    });
    expect(root('a')).toHaveAttribute('data-merge-target', 'true');

    fireEvent.pointerUp(globalThis as unknown as Window);

    expect(root('a')).not.toHaveAttribute('data-merge-target');
    expect(manager.getGroup('b')).toMatchObject({ widgetIds: ['a', 'b'], activeId: 'b' });
    expect(root('b')).toHaveStyle({ transform: 'translate(40px, 40px)' });
    Reflect.deleteProperty(document, 'elementsFromPoint');
  });

  it('ignores title bars covered by another window and does nothing when grouping is off', () => {
    renderWorkspace({ windowGrouping: false });
    act(() => {
      openWindow('a', 40);
      openWindow('b', 500);
    });

    const targetHeader = root('a')?.querySelector('.floaty-header') as HTMLElement;
    const draggedHeader = root('b')?.querySelector('.floaty-header') as HTMLElement;
    draggedHeader.setPointerCapture = vi.fn();
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [draggedHeader, targetHeader],
    });

    fireEvent.pointerDown(draggedHeader, { clientX: 600, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(globalThis as unknown as Window, {
      clientX: 120,
      clientY: 55,
      pointerId: 1,
    });
    expect(root('a')).not.toHaveAttribute('data-merge-target');
    fireEvent.pointerUp(globalThis as unknown as Window);
    expect(manager.groups.size).toBe(0);
    Reflect.deleteProperty(document, 'elementsFromPoint');
  });

  it('routes minimize, restore and taskbar focus through the visible tab', () => {
    renderWorkspace({ children: <FloatyTaskbar /> });
    act(() => {
      openWindow('a', 40);
      openWindow('b', 400);
      manager.groupWindows(['a', 'b']);
    });

    act(() => manager.minimizeAll());
    expect(manager.getWidget('b')?.isMinimized).toBe(true);
    // The hidden tab stays mounted instead of being minimized.
    expect(manager.getWidget('a')?.isMinimized).toBe(false);
    expect(root('a')).toBeInTheDocument();

    act(() => manager.restoreWidget('a'));
    expect(manager.getGroup('a')?.activeId).toBe('a');
    expect(root('a')).toBeVisible();

    act(() => manager.minimizeWidget('b'));
    expect(manager.getWidget('a')?.isMinimized).toBe(true);

    const taskbar = screen.getByRole('toolbar', { name: 'Open windows' });
    fireEvent.click(within(taskbar).getByRole('button', { name: 'B' }));
    expect(manager.getGroup('a')?.activeId).toBe('b');
    expect(root('b')).toBeVisible();
    expect(manager.getWidget('b')?.isMinimized).toBe(false);

    act(() => manager.closeAll());
    expect(manager.groups.size).toBe(0);
  });
});
