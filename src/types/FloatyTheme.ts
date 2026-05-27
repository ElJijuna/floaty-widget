/** CSS custom-property overrides that control the visual appearance of all widgets. */
export interface FloatyTheme {
  /** Widget background color. Maps to `--floaty-bg`. */
  background?: string;
  /** Widget text color. Maps to `--floaty-fg`. */
  foreground?: string;
  /** Body section background color. Maps to `--floaty-body-bg`. */
  bodyBackground?: string;
  /** Header background color. Maps to `--floaty-header-bg`. */
  headerBackground?: string;
  /** Header background color on hover. Defaults to `headerBackground`. */
  headerBackgroundHover?: string;
  /** Header text color. Maps to `--floaty-header-fg`. */
  headerForeground?: string;
  /** Header background color when the widget is pinned. */
  pinnedHeaderBackground?: string;
  /** Header background color on hover when pinned. Defaults to `pinnedHeaderBackground`. */
  pinnedHeaderBackgroundHover?: string;
  /** Header text color when the widget is pinned. */
  pinnedHeaderForeground?: string;
  /** Border style for unpinned widgets. Maps to `--floaty-border`. */
  border?: string;
  /** Border style for pinned widgets. Maps to `--floaty-pinned-border`. */
  pinnedBorder?: string;
  /** Border radius. Maps to `--floaty-radius`. */
  radius?: string;
  /** Box shadow. Maps to `--floaty-shadow`. */
  shadow?: string;
  /** Font family applied to the widget. Maps to `--floaty-font-family`. */
  fontFamily?: string;
  /** Block (top/bottom) padding of the header. Maps to `--floaty-header-padding-block`. */
  headerPaddingBlock?: string;
  /** Inline (left/right) padding of the header. Maps to `--floaty-header-padding-inline`. */
  headerPaddingInline?: string;
  /** Padding inside the widget body. Maps to `--floaty-body-padding`. */
  bodyPadding?: string;
  /** Border radius of header action buttons. Maps to `--floaty-button-radius`. */
  buttonRadius?: string;
  /** Background color of header action buttons on hover. Maps to `--floaty-button-hover-bg`. */
  buttonHoverBackground?: string;
}
