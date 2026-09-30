/** Localised labels for action buttons rendered in the widget header. */
export interface FloatyActionTexts {
  pin: string;
  unpin: string;
  collapse: string;
  expand: string;
  minimize: string;
  restore: string;
  close: string;
  /** Accessible name of the resize handle, announced as `"<resize> handle"`. */
  resize: string;
  maximize: string;
  unmaximize: string;
}

/** Localised text rendered by Floaty controls and built-in loading/error states. */
export interface FloatyTexts extends FloatyActionTexts {
  loading: string;
  loadError: string;
  retry: string;
  /**
   * Accessible name of the move handle (the grip, or the window icon), followed by the title.
   * Focus it and use the arrow keys to move the widget.
   */
  move: string;
  /** Accessible name of the tab strip in a tabbed window group. */
  tabs: string;
  /** Accessible name of the dividers between windows of an active layout. */
  layoutDivider: string;
}
