/** Localised labels for action buttons rendered in the widget header. */
export interface FloatyActionTexts {
  pin: string;
  unpin: string;
  collapse: string;
  expand: string;
  minimize: string;
  restore: string;
  close: string;
  resize: string;
}

/** Localised text rendered by Floaty controls and built-in loading/error states. */
export interface FloatyTexts extends FloatyActionTexts {
  loading: string;
  loadError: string;
  retry: string;
}
