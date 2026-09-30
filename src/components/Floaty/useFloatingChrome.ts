import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import type { FloatyMode } from '../../types';
import type { ChromeInsets } from '../../utils/windowGeometry';

/** Fallbacks for `--floaty-reveal-zone`, `--floaty-frame-top` and `--floaty-frame-inset`. */
const DEFAULT_REVEAL_ZONE = 48;
const DEFAULT_FRAME_TOP = 46;
const DEFAULT_FRAME_INSET = 6;
/** Grace period before the frame closes, so briefly overshooting the edge doesn't flicker it. */
const CHROME_HIDE_DELAY_MS = 300;

const floatingChromeInsets = (top: number, side: number): ChromeInsets => ({
  top,
  right: side,
  bottom: side,
  left: side,
});

const readPixels = (style: CSSStyleDeclaration, property: string, fallback: number) => {
  const value = Number.parseFloat(style.getPropertyValue(property));

  return Number.isFinite(value) ? value : fallback;
};

/**
 * Space the floating frame takes outside the widget box, read from `--floaty-frame-top` and
 * `--floaty-frame-inset`. Without an element (before mount) it returns the defaults.
 */
export const readFloatingChromeInsets = (element: HTMLElement | null): ChromeInsets => {
  if (!element) {
    return floatingChromeInsets(DEFAULT_FRAME_TOP, DEFAULT_FRAME_INSET);
  }

  const style = getComputedStyle(element);

  return floatingChromeInsets(
    readPixels(style, '--floaty-frame-top', DEFAULT_FRAME_TOP),
    readPixels(style, '--floaty-frame-inset', DEFAULT_FRAME_INSET),
  );
};

/**
 * Floating mode frame, like a device in the iOS Simulator: it opens when the pointer nears the top
 * edge and closes shortly after the pointer leaves. Spread `chromeHandlers` on the widget root.
 */
export const useFloatingChrome = (mode: FloatyMode) => {
  const [isChromeRevealed, setIsChromeRevealed] = useState(false);
  const chromeHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Distance from the top edge that reveals the frame, read from CSS when the pointer enters.
  const revealZoneRef = useRef(DEFAULT_REVEAL_ZONE);

  useEffect(
    () => () => {
      if (chromeHideTimeoutRef.current) {
        clearTimeout(chromeHideTimeoutRef.current);
      }
    },
    [],
  );

  const cancelChromeHide = () => {
    if (chromeHideTimeoutRef.current) {
      clearTimeout(chromeHideTimeoutRef.current);
      chromeHideTimeoutRef.current = null;
    }
  };

  const chromeHandlers = {
    onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
      cancelChromeHide();

      if (mode === 'floating') {
        revealZoneRef.current = readPixels(
          getComputedStyle(event.currentTarget),
          '--floaty-reveal-zone',
          DEFAULT_REVEAL_ZONE,
        );
      }
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      // Like a device in the iOS Simulator: the frame appears only near the top edge.
      if (mode !== 'floating' || event.pointerType === 'touch') {
        return;
      }

      // Coming back before the grace period ends keeps the open frame.
      cancelChromeHide();

      if (isChromeRevealed) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();

      if (event.clientY - rect.top <= revealZoneRef.current) {
        setIsChromeRevealed(true);
      }
    },
    onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === 'touch' || !isChromeRevealed) {
        return;
      }

      cancelChromeHide();
      chromeHideTimeoutRef.current = setTimeout(() => {
        chromeHideTimeoutRef.current = null;
        setIsChromeRevealed(false);
      }, CHROME_HIDE_DELAY_MS);
    },
  };

  return { isChromeRevealed, chromeHandlers };
};
