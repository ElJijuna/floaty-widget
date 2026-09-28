import {
  type ComponentType,
  createContext,
  forwardRef,
  lazy,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  FloatyActiveLayout,
  FloatyArrangeOptions,
  FloatyComponentLoader,
  FloatyDuplicateStrategy,
  FloatyHandle,
  FloatyLayoutDivider,
  FloatyLazyModule,
  FloatyOpenOptions,
  FloatyOpenWidget,
  FloatyOpenWidgetBase,
  FloatyPosition,
  FloatyTexts,
  FloatyWidget,
  FloatyWidgetManagerHandle,
  FloatyWidgetManagerProps,
  FloatyWidgetPatch,
  FloatyWidgetState,
  FloatyWindowArrangement,
  FloatyWindowGroup,
} from '../types';
import {
  clampPosition,
  getLayoutDividers,
  getWindowLayout,
  isDockEdge,
  moveLayoutBoundary,
  readPersistedState,
  writePersistedState,
} from '../utils/windowGeometry';

export const FloatyManagerContext = createContext<FloatyWidgetManagerHandle | null>(null);

const defaultLabels: FloatyTexts = {
  pin: 'Pin',
  unpin: 'Unpin',
  collapse: 'Collapse',
  expand: 'Expand',
  minimize: 'Minimize',
  restore: 'Restore',
  close: 'Close',
  resize: 'Resize widget',
  maximize: 'Maximize',
  unmaximize: 'Restore window',
  loading: 'Loading widget...',
  loadError: 'Could not load widget',
  retry: 'Retry',
  tabs: 'Tabs',
  layoutDivider: 'Resize windows',
};

const createDuplicateId = (id: string, widgets: Map<string, FloatyWidget>) => {
  let index = 2;
  let nextId = `${id}-${index}`;

  while (widgets.has(nextId)) {
    index += 1;
    nextId = `${id}-${index}`;
  }

  return nextId;
};

const normalizeLazyModule = <P,>(loaded: FloatyLazyModule<P>): { default: ComponentType<P> } => {
  if (typeof loaded === 'function') {
    return { default: loaded };
  }

  return loaded;
};

const findGroup = (groups: Map<string, FloatyWindowGroup>, id: string) => {
  for (const group of groups.values()) {
    if (group.widgetIds.includes(id)) {
      return group;
    }
  }

  return undefined;
};

/** Inactive tabs stay mounted but hidden; the group is represented by its active tab. */
const isHiddenTab = (groups: Map<string, FloatyWindowGroup>, id: string) => {
  const group = findGroup(groups, id);

  return Boolean(group && group.activeId !== id);
};

const isArrangeable = (widget: FloatyWidget, groups: Map<string, FloatyWindowGroup>) =>
  widget.mode === 'window' &&
  !widget.isMinimized &&
  !widget.isMaximized &&
  !isHiddenTab(groups, widget.id);

const getArrangedKey = (
  widgets: Map<string, FloatyWidget>,
  groups: Map<string, FloatyWindowGroup>,
) =>
  Array.from(widgets.values())
    .filter((widget) => isArrangeable(widget, groups))
    .map((widget) => widget.id)
    .join('\u0000');

const createLazyComponent = <P,>(loader: FloatyComponentLoader<P>) => {
  return lazy(async () => normalizeLazyModule(await loader()));
};

export const FloatyWidgetManager = forwardRef<FloatyWidgetManagerHandle, FloatyWidgetManagerProps>(
  ({ children, labels: labelsProp, icons = {}, theme, windowGrouping = false }, ref) => {
    const widgetHandlesRef = useRef<Map<string, RefObject<FloatyHandle | null>>>(new Map());
    const zIndexRef = useRef(1000);
    const [widgets, setWidgets] = useState<Map<string, FloatyWidget>>(() => new Map());
    const widgetsRef = useRef(widgets);
    const [layout, setLayoutState] = useState<FloatyActiveLayout | null>(null);
    const layoutRef = useRef(layout);
    const arrangedKeyRef = useRef<string | null>(null);
    const [layoutDividers, setLayoutDividers] = useState<FloatyLayoutDivider[]>([]);
    const [groups, setGroups] = useState<Map<string, FloatyWindowGroup>>(() => new Map());
    const groupsRef = useRef(groups);
    const groupCounterRef = useRef(0);

    const updateWidgets = useCallback(
      (updater: (current: Map<string, FloatyWidget>) => Map<string, FloatyWidget>) => {
        const { current } = widgetsRef;
        const next = updater(current);

        if (next !== current) {
          widgetsRef.current = next;
          setWidgets(next);
        }

        return next;
      },
      [],
    );

    const labels = useMemo(() => ({ ...defaultLabels, ...labelsProp }), [labelsProp]);

    const raise = useCallback(
      (id: string) => {
        updateWidgets((current) => {
          const previous = current.get(id);

          if (!previous) {
            return current;
          }

          zIndexRef.current += 1;
          const next = new Map(current);

          next.set(id, { ...previous, zIndex: zIndexRef.current });

          return next;
        });
      },
      [updateWidgets],
    );

    /** Replaces the group map and mirrors `groupId` onto every widget. */
    const commitGroups = useCallback(
      (nextGroups: Map<string, FloatyWindowGroup>) => {
        groupsRef.current = nextGroups;
        setGroups(nextGroups);
        updateWidgets((current) => {
          let next = current;

          current.forEach((widget, id) => {
            const groupId = findGroup(nextGroups, id)?.id;

            if (widget.groupId !== groupId) {
              if (next === current) {
                next = new Map(current);
              }
              next.set(id, { ...widget, groupId });
            }
          });

          return next;
        });
      },
      [updateWidgets],
    );

    /** Gives a tab the geometry and window state of the tab it replaces on screen. */
    const syncTabGeometry = useCallback(
      (targetId: string, source: FloatyWidget | undefined) => {
        if (!source || targetId === source.id) {
          return;
        }

        const handle = widgetHandlesRef.current.get(targetId)?.current;

        if (handle) {
          if (source.isMaximized) {
            handle.maximize();
          } else if (source.snapZone) {
            handle.snapTo(source.snapZone);
          } else if (source.position) {
            handle.setGeometry({ position: source.position, size: source.size ?? {} });
          }

          if (source.isCollapsed) {
            handle.collapse();
          }
        }

        // Keep the manager in sync too, so a tab that is not mounted (minimized) opens in place.
        updateWidgets((current) => {
          const target = current.get(targetId);

          if (!target) {
            return current;
          }

          const next = new Map(current);

          next.set(targetId, {
            ...target,
            position: source.position,
            size: source.size,
            isMaximized: source.isMaximized,
            snapZone: source.snapZone,
            isCollapsed: source.isCollapsed,
          });

          return next;
        });
      },
      [updateWidgets],
    );

    const showWidget = useCallback(
      (id: string) => {
        const widget = widgetsRef.current.get(id);

        if (!widget) {
          return;
        }

        if (widget.isMinimized) {
          const persisted = readPersistedState(widget.persistenceKey);

          if (widget.persistenceKey && persisted) {
            writePersistedState(widget.persistenceKey, { ...persisted, isMinimized: false });
          }
          updateWidgets((current) => {
            const next = new Map(current);

            next.set(id, { ...widget, isMinimized: false });

            return next;
          });
        }

        raise(id);
      },
      [raise, updateWidgets],
    );

    const setActiveTab = useCallback(
      (id: string) => {
        const group = findGroup(groupsRef.current, id);

        if (group && group.activeId !== id) {
          syncTabGeometry(id, widgetsRef.current.get(group.activeId));
          const next = new Map(groupsRef.current);

          next.set(group.id, { ...group, activeId: id });
          commitGroups(next);
        }

        showWidget(id);
      },
      [commitGroups, showWidget, syncTabGeometry],
    );

    const bringToFront = useCallback(
      (id: string) => {
        if (isHiddenTab(groupsRef.current, id)) {
          setActiveTab(id);
        } else {
          raise(id);
        }
      },
      [raise, setActiveTab],
    );

    /**
     * Takes a widget out of its group. When it was the visible tab, its neighbour takes over the
     * window geometry. A group left with one tab is dissolved.
     */
    const removeFromGroup = useCallback(
      (id: string) => {
        const group = findGroup(groupsRef.current, id);

        if (!group) {
          return;
        }

        const index = group.widgetIds.indexOf(id);
        const remaining = group.widgetIds.filter((memberId) => memberId !== id);
        const neighborId =
          group.activeId === id ? remaining[Math.min(index, remaining.length - 1)] : undefined;
        const next = new Map(groupsRef.current);

        if (neighborId) {
          syncTabGeometry(neighborId, widgetsRef.current.get(id));
        }

        if (remaining.length < 2) {
          next.delete(group.id);
        } else {
          next.set(group.id, {
            ...group,
            widgetIds: remaining,
            activeId: neighborId ?? group.activeId,
          });
        }

        commitGroups(next);

        if (neighborId) {
          raise(neighborId);
        }
      },
      [commitGroups, raise, syncTabGeometry],
    );

    const groupWindows = useCallback(
      (ids: string[]) => {
        const { current } = widgetsRef;
        const valid = Array.from(new Set(ids)).filter((id) => current.get(id)?.mode === 'window');

        if (valid.length < 2) {
          return null;
        }

        const [targetId, ...sourceIds] = valid;
        const targetGroup = findGroup(groupsRef.current, targetId);
        const reference = current.get(targetGroup?.activeId ?? targetId);
        const members = targetGroup ? [...targetGroup.widgetIds] : [targetId];
        const next = new Map(groupsRef.current);

        sourceIds.forEach((sourceId) => {
          const sourceGroup = findGroup(next, sourceId);

          if (sourceGroup && sourceGroup.id !== targetGroup?.id) {
            next.delete(sourceGroup.id);
          }

          (sourceGroup?.widgetIds ?? [sourceId]).forEach((memberId) => {
            if (!members.includes(memberId)) {
              members.push(memberId);
            }
          });
        });

        const activeId = sourceIds[sourceIds.length - 1];
        const groupId = targetGroup?.id ?? `floaty-group-${++groupCounterRef.current}`;

        next.set(groupId, { id: groupId, widgetIds: members, activeId });
        syncTabGeometry(activeId, reference);
        commitGroups(next);
        showWidget(activeId);

        return groupId;
      },
      [commitGroups, showWidget, syncTabGeometry],
    );

    const ungroupWindow = useCallback(
      (id: string, position?: FloatyPosition) => {
        const group = findGroup(groupsRef.current, id);
        const widget = widgetsRef.current.get(id);

        if (!group || !widget) {
          return;
        }

        const reference = widgetsRef.current.get(group.activeId) ?? widget;
        const isDocked = reference.isMaximized || Boolean(reference.snapZone);
        const size = (isDocked ? widget.size : reference.size) ?? {};
        const origin = (isDocked ? widget.position : reference.position) ?? { x: 0, y: 0 };

        removeFromGroup(id);

        const geometry = {
          position: clampPosition(position ?? { x: origin.x + 32, y: origin.y + 32 }, size),
          size,
        };

        widgetHandlesRef.current.get(id)?.current?.setGeometry(geometry);
        updateWidgets((current) => {
          const target = current.get(id);

          if (!target) {
            return current;
          }

          const next = new Map(current);

          next.set(id, { ...target, ...geometry, isMaximized: false, snapZone: null });

          return next;
        });
        showWidget(id);
      },
      [removeFromGroup, showWidget, updateWidgets],
    );

    const getGroup = useCallback((id: string) => findGroup(groupsRef.current, id), []);

    const open = useCallback(
      <P,>(widget: FloatyOpenWidget<P>, options: FloatyOpenOptions = {}) => {
        const duplicateStrategy: FloatyDuplicateStrategy = options.duplicateStrategy ?? 'replace';
        const { current } = widgetsRef;
        const widgetExists = current.has(widget.id);
        const widgetId =
          widgetExists && duplicateStrategy === 'duplicate'
            ? createDuplicateId(widget.id, current)
            : widget.id;
        const persisted = readPersistedState(widget.persistenceKey);

        updateWidgets((currentWidgets) => {
          if (widgetExists) {
            if (duplicateStrategy === 'focus' && currentWidgets.has(widget.id)) {
              const existing = currentWidgets.get(widget.id);

              if (!existing) {
                return currentWidgets;
              }

              zIndexRef.current += 1;
              const next = new Map(currentWidgets);

              next.set(widget.id, {
                ...existing,
                isMinimized: false,
                zIndex: zIndexRef.current,
              });

              return next;
            }
          }

          zIndexRef.current += 1;
          const next = new Map(currentWidgets);
          const component =
            widget.component ?? (widget.loader ? createLazyComponent(widget.loader) : undefined);

          next.set(widgetId, {
            id: widgetId,
            title: widget.title,
            mode: widget.mode ?? 'floating',
            windowStyle: widget.windowStyle,
            windowIcon: widget.windowIcon,
            component: component as ComponentType<unknown> | undefined,
            loader: widget.loader as FloatyComponentLoader<unknown> | undefined,
            props: widget.props,
            fallback: widget.fallback,
            position: persisted?.position ?? widget.position,
            size: persisted?.size ?? widget.size,
            className: widget.className,
            autoFocus: widget.autoFocus,
            restoreFocus: widget.restoreFocus,
            isCollapsed: persisted?.isCollapsed ?? widget.collapsed ?? false,
            isMinimized: persisted?.isMinimized ?? widget.minimized ?? false,
            isPinned: persisted?.isPinned ?? widget.pinned ?? false,
            isMaximized: persisted?.isMaximized ?? widget.maximized ?? false,
            snapZone: persisted?.snapZone ?? null,
            persistenceKey: widget.persistenceKey,
            zIndex: zIndexRef.current,
            groupId: currentWidgets.get(widgetId)?.groupId,
          });

          return next;
        });

        return widgetId;
      },
      [updateWidgets],
    );

    const openComponent = useCallback(
      <P,>(component: ComponentType<P>, config: FloatyOpenWidgetBase<P>) =>
        open({ ...config, component }),
      [open],
    );

    const close = useCallback(
      (id: string) => {
        removeFromGroup(id);
        widgetHandlesRef.current.delete(id);
        updateWidgets((current) => {
          if (!current.has(id)) {
            return current;
          }

          const next = new Map(current);

          next.delete(id);

          return next;
        });
      },
      [removeFromGroup, updateWidgets],
    );

    const closeAll = useCallback(() => {
      widgetHandlesRef.current.clear();
      groupsRef.current = new Map();
      setGroups(groupsRef.current);
      updateWidgets((current) => (current.size === 0 ? current : new Map()));
    }, [updateWidgets]);

    const update = useCallback(
      <P,>(id: string, patch: FloatyWidgetPatch<P>) => {
        const handle = widgetHandlesRef.current.get(id)?.current;
        const collapsed = patch.collapsed ?? patch.isCollapsed;
        const minimized = patch.minimized ?? patch.isMinimized;
        const pinned = patch.pinned ?? patch.isPinned;
        const maximized = patch.maximized ?? patch.isMaximized;

        if (collapsed !== undefined) {
          handle?.[collapsed ? 'collapse' : 'expand']();
        }

        if (minimized !== undefined) {
          handle?.[minimized ? 'minimize' : 'restore']();
        }

        if (pinned !== undefined) {
          handle?.[pinned ? 'pin' : 'unpin']();
        }

        if (maximized !== undefined) {
          handle?.[maximized ? 'maximize' : 'unmaximize']();
        }

        if (patch.size) {
          handle?.resizeTo(patch.size);
        }

        if (patch.position) {
          handle?.moveTo(patch.position);
        }

        updateWidgets((current) => {
          const previous = current.get(id);

          if (!previous) {
            return current;
          }

          const next = new Map(current);

          next.set(id, {
            ...previous,
            ...patch,
            isCollapsed: patch.collapsed ?? patch.isCollapsed ?? previous.isCollapsed,
            isMinimized: patch.minimized ?? patch.isMinimized ?? previous.isMinimized,
            isPinned: patch.pinned ?? patch.isPinned ?? previous.isPinned,
            isMaximized: patch.maximized ?? patch.isMaximized ?? previous.isMaximized,
            component: patch.loader
              ? (createLazyComponent(patch.loader) as ComponentType<unknown>)
              : ((patch.component as ComponentType<unknown> | undefined) ?? previous.component),
            loader: (patch.loader as FloatyComponentLoader<unknown> | undefined) ?? previous.loader,
            props: patch.props ?? previous.props,
          });

          return next;
        });
      },
      [updateWidgets],
    );

    const updateProps = useCallback(
      <P,>(id: string, props: P) => {
        update(id, { props });
      },
      [update],
    );

    const registerFloaty = useCallback(
      (
        id: string,
        floatyRef: RefObject<FloatyHandle | null>,
        initialState: Partial<Omit<FloatyWidgetState, 'id'>> = {},
      ) => {
        widgetHandlesRef.current.set(id, floatyRef);
        updateWidgets((current) => {
          const previous = current.get(id);
          const next = new Map(current);

          next.set(id, {
            ...previous,
            id,
            title: initialState.title ?? previous?.title,
            mode: initialState.mode ?? previous?.mode ?? 'floating',
            windowStyle: initialState.windowStyle ?? previous?.windowStyle,
            windowIcon: initialState.windowIcon ?? previous?.windowIcon,
            position: initialState.position ?? previous?.position,
            size: initialState.size ?? previous?.size,
            isCollapsed: initialState.isCollapsed ?? previous?.isCollapsed ?? false,
            isMinimized: initialState.isMinimized ?? previous?.isMinimized ?? false,
            isPinned: initialState.isPinned ?? previous?.isPinned ?? false,
            isMaximized: initialState.isMaximized ?? previous?.isMaximized ?? false,
            snapZone: initialState.snapZone ?? previous?.snapZone ?? null,
            persistenceKey: initialState.persistenceKey ?? previous?.persistenceKey,
            zIndex: previous?.zIndex ?? zIndexRef.current,
          });

          return next;
        });

        return () => {
          widgetHandlesRef.current.delete(id);
          updateWidgets((current) => {
            const widget = current.get(id);

            if (widget?.component) {
              return current;
            }

            const next = new Map(current);

            next.delete(id);

            return next;
          });
        };
      },
      [updateWidgets],
    );

    const unregisterFloaty = useCallback((id: string) => {
      widgetHandlesRef.current.delete(id);
    }, []);

    const updateWidgetState = useCallback(
      (id: string, state: Partial<Omit<FloatyWidgetState, 'id'>>) => {
        updateWidgets((current) => {
          const previous = current.get(id);

          if (!previous) {
            return current;
          }

          const nextWidget = { ...previous, ...state };

          if (
            nextWidget.isCollapsed === previous.isCollapsed &&
            nextWidget.isMinimized === previous.isMinimized &&
            nextWidget.isPinned === previous.isPinned &&
            nextWidget.isMaximized === previous.isMaximized &&
            nextWidget.snapZone === previous.snapZone &&
            nextWidget.position === previous.position &&
            nextWidget.size === previous.size &&
            nextWidget.mode === previous.mode &&
            nextWidget.windowStyle === previous.windowStyle &&
            nextWidget.windowIcon === previous.windowIcon &&
            nextWidget.zIndex === previous.zIndex
          ) {
            return current;
          }

          const next = new Map(current);

          next.set(id, nextWidget);

          return next;
        });
      },
      [updateWidgets],
    );

    const expandAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.expand();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isCollapsed: false });
        });

        return next;
      });
    }, [updateWidgets]);

    const collapseAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.collapse();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isCollapsed: true });
        });

        return next;
      });
    }, [updateWidgets]);

    const minimizeAll = useCallback(() => {
      // Hidden tabs stay mounted so their content keeps its state; the visible tab hides the group.
      widgetHandlesRef.current.forEach((ref, id) => {
        if (!isHiddenTab(groupsRef.current, id)) {
          ref?.current?.minimize();
        }
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          if (!isHiddenTab(groupsRef.current, id)) {
            next.set(id, { ...widget, isMinimized: true });
          }
        });

        return next;
      });
    }, [updateWidgets]);

    const restoreAll = useCallback(() => {
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isMinimized: false });
          const persisted = readPersistedState(widget.persistenceKey);
          if (widget.persistenceKey && persisted) {
            writePersistedState(widget.persistenceKey, { ...persisted, isMinimized: false });
          }
        });

        return next;
      });
    }, [updateWidgets]);

    const pinAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.pin();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isPinned: true });
        });

        return next;
      });
    }, [updateWidgets]);

    const unpinAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.unpin();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isPinned: false });
        });

        return next;
      });
    }, [updateWidgets]);

    const expandWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.expand();
        updateWidgetState(id, { isCollapsed: false });
      },
      [updateWidgetState],
    );

    const collapseWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.collapse();
        updateWidgetState(id, { isCollapsed: true });
      },
      [updateWidgetState],
    );

    const minimizeWidget = useCallback(
      (id: string) => {
        // Minimizing any tab minimizes the tabbed window, which is its visible tab.
        const targetId = findGroup(groupsRef.current, id)?.activeId ?? id;

        widgetHandlesRef.current.get(targetId)?.current?.minimize();
        updateWidgetState(targetId, { isMinimized: true });
      },
      [updateWidgetState],
    );

    const restoreWidget = useCallback(
      (id: string) => {
        if (findGroup(groupsRef.current, id)) {
          setActiveTab(id);
          return;
        }

        const widget = widgetsRef.current.get(id);
        const persisted = readPersistedState(widget?.persistenceKey);
        if (widget?.persistenceKey && persisted) {
          writePersistedState(widget.persistenceKey, { ...persisted, isMinimized: false });
        }
        updateWidgetState(id, { isMinimized: false });
      },
      [setActiveTab, updateWidgetState],
    );

    const pinWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.pin();
        updateWidgetState(id, { isPinned: true });
      },
      [updateWidgetState],
    );

    const unpinWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.unpin();
        updateWidgetState(id, { isPinned: false });
      },
      [updateWidgetState],
    );

    const maximizeWidget = useCallback(
      (id: string) => {
        const widget = widgetsRef.current.get(id);
        const persisted = readPersistedState(widget?.persistenceKey);
        if (widget?.persistenceKey && persisted) {
          writePersistedState(widget.persistenceKey, {
            ...persisted,
            isMaximized: true,
            snapZone: null,
          });
        }
        widgetHandlesRef.current.get(id)?.current?.maximize();
        updateWidgetState(id, { isMaximized: true, snapZone: null });
      },
      [updateWidgetState],
    );

    const unmaximizeWidget = useCallback(
      (id: string) => {
        const widget = widgetsRef.current.get(id);
        const persisted = readPersistedState(widget?.persistenceKey);
        const restoredGeometry = persisted?.restoreGeometry;
        if (widget?.persistenceKey && persisted) {
          writePersistedState(widget.persistenceKey, {
            ...persisted,
            ...(restoredGeometry ?? {}),
            isMaximized: false,
            snapZone: null,
          });
        }
        widgetHandlesRef.current.get(id)?.current?.unmaximize();
        updateWidgetState(id, {
          isMaximized: false,
          snapZone: null,
          position: restoredGeometry?.position ?? widget?.position,
          size: restoredGeometry?.size ?? widget?.size,
        });
      },
      [updateWidgetState],
    );

    const applyArrangement = useCallback(
      (
        layout: FloatyWindowArrangement,
        options: FloatyArrangeOptions,
        windows: FloatyWidget[],
        animate = options.animate ?? true,
      ): FloatyArrangeOptions => {
        if (windows.length === 0) {
          return options;
        }

        const axis = layout === 'left' || layout === 'right' ? 'width' : 'height';
        const currentSizes = windows
          .map((widget) => widget.size?.[axis])
          .filter((value): value is number => typeof value === 'number');
        const resolvedOptions =
          isDockEdge(layout) && options.size === undefined && currentSizes.length > 0
            ? { ...options, size: Math.max(...currentSizes) }
            : options;
        const geometries = getWindowLayout(
          windows.length,
          layout,
          { width: window.innerWidth, height: window.innerHeight },
          resolvedOptions,
        );
        const next = new Map(widgetsRef.current);

        windows.forEach((widget, index) => {
          const geometry = geometries[index];
          widgetHandlesRef.current.get(widget.id)?.current?.setGeometry(geometry, { animate });
          next.set(widget.id, {
            ...widget,
            ...geometry,
            isCollapsed: false,
            isMaximized: false,
            snapZone: null,
          });

          if (widget.persistenceKey) {
            const persisted = readPersistedState(widget.persistenceKey);
            writePersistedState(widget.persistenceKey, {
              ...persisted,
              version: 1,
              ...geometry,
              isCollapsed: false,
              isMinimized: false,
              isPinned: widget.isPinned,
              isMaximized: false,
              snapZone: null,
              restoreGeometry: geometry,
            });
          }
        });

        updateWidgets(() => next);
        return resolvedOptions;
      },
      [updateWidgets],
    );

    const arrangeWindows = useCallback(
      (layout: FloatyWindowArrangement, options: FloatyArrangeOptions = {}) => {
        if (typeof window === 'undefined') {
          return 0;
        }

        const visibleWindows = Array.from(widgetsRef.current.values()).filter(
          (widget) =>
            widget.mode === 'window' &&
            !widget.isMinimized &&
            !isHiddenTab(groupsRef.current, widget.id),
        );
        applyArrangement(layout, options, visibleWindows);
        return visibleWindows.length;
      },
      [applyArrangement],
    );

    const reflowLayout = useCallback(
      (animate?: boolean) => {
        const active = layoutRef.current;

        if (!active || typeof window === 'undefined') {
          setLayoutDividers((current) => (current.length ? [] : current));
          return 0;
        }

        const windows = Array.from(widgetsRef.current.values()).filter((widget) =>
          isArrangeable(widget, groupsRef.current),
        );
        const resolvedOptions = applyArrangement(
          active.arrangement,
          active.options,
          windows,
          animate ?? active.options.animate ?? true,
        );

        setLayoutDividers(
          resolvedOptions.resizable === false
            ? []
            : getLayoutDividers(
                windows.length,
                active.arrangement,
                { width: window.innerWidth, height: window.innerHeight },
                resolvedOptions,
              ),
        );

        arrangedKeyRef.current = getArrangedKey(widgetsRef.current, groupsRef.current);

        if (resolvedOptions !== active.options) {
          // Freeze the dock thickness so later windows do not resize the whole stack.
          const nextLayout = { ...active, options: resolvedOptions };

          layoutRef.current = nextLayout;
          setLayoutState(nextLayout);
        }

        return windows.length;
      },
      [applyArrangement],
    );

    const setLayout = useCallback(
      (arrangement: FloatyWindowArrangement | null, options: FloatyArrangeOptions = {}) => {
        const nextLayout = arrangement ? { arrangement, options } : null;

        layoutRef.current = nextLayout;
        arrangedKeyRef.current = null;
        setLayoutState(nextLayout);

        return reflowLayout();
      },
      [reflowLayout],
    );

    const moveLayoutDivider = useCallback(
      (id: string, coordinate: number) => {
        const active = layoutRef.current;

        if (!active || typeof window === 'undefined') {
          return;
        }

        const windows = Array.from(widgetsRef.current.values()).filter((widget) =>
          isArrangeable(widget, groupsRef.current),
        );
        const options = moveLayoutBoundary(
          windows.length,
          active.arrangement,
          { width: window.innerWidth, height: window.innerHeight },
          active.options,
          id,
          coordinate,
        );

        if (options === active.options) {
          return;
        }

        layoutRef.current = { ...active, options };
        setLayoutState(layoutRef.current);
        // Follow the pointer directly; animating each step would lag behind it.
        reflowLayout(false);
      },
      [reflowLayout],
    );

    useEffect(() => {
      if (layout && getArrangedKey(widgets, groups) !== arrangedKeyRef.current) {
        reflowLayout();
      }
    }, [layout, widgets, groups, reflowLayout]);

    useEffect(() => {
      if (!layout) {
        return undefined;
      }

      let frame = 0;
      const handleResize = () => {
        cancelAnimationFrame(frame);
        // Follow the viewport immediately; animating here would lag behind the resize.
        frame = requestAnimationFrame(() => reflowLayout(false));
      };

      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', handleResize);
      };
    }, [layout, reflowLayout]);

    const getWidgetCount = useCallback(() => widgetsRef.current.size, []);

    const getWidget = useCallback((id: string) => widgetsRef.current.get(id), []);

    const manager = useMemo<FloatyWidgetManagerHandle>(
      () => ({
        open,
        openComponent,
        close,
        closeAll,
        update,
        updateProps,
        bringToFront,
        registerFloaty,
        unregisterFloaty,
        updateWidgetState,
        expandAll,
        collapseAll,
        minimizeAll,
        restoreAll,
        pinAll,
        unpinAll,
        expandWidget,
        collapseWidget,
        minimizeWidget,
        restoreWidget,
        pinWidget,
        unpinWidget,
        maximizeWidget,
        unmaximizeWidget,
        arrangeWindows,
        setLayout,
        layout,
        layoutDividers,
        moveLayoutDivider,
        groupWindows,
        ungroupWindow,
        setActiveTab,
        getGroup,
        groups,
        windowGrouping,
        getWidgetCount,
        getWidget,
        widgets,
        labels,
        icons,
        theme,
      }),
      [
        open,
        openComponent,
        close,
        closeAll,
        update,
        updateProps,
        bringToFront,
        registerFloaty,
        unregisterFloaty,
        updateWidgetState,
        expandAll,
        collapseAll,
        minimizeAll,
        restoreAll,
        pinAll,
        unpinAll,
        expandWidget,
        collapseWidget,
        minimizeWidget,
        restoreWidget,
        pinWidget,
        unpinWidget,
        maximizeWidget,
        unmaximizeWidget,
        arrangeWindows,
        setLayout,
        layout,
        layoutDividers,
        moveLayoutDivider,
        groupWindows,
        ungroupWindow,
        setActiveTab,
        getGroup,
        groups,
        windowGrouping,
        getWidgetCount,
        getWidget,
        widgets,
        labels,
        icons,
        theme,
      ],
    );

    useImperativeHandle(ref, () => manager, [manager]);

    return (
      <FloatyManagerContext.Provider value={manager}>{children}</FloatyManagerContext.Provider>
    );
  },
);

FloatyWidgetManager.displayName = 'FloatyWidgetManager';

/** Alias for `FloatyWidgetManager`. */
export const FloatyProvider = FloatyWidgetManager;
