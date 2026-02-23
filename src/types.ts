// Shared types across figsniff

export interface FigsniffOptions {
  /** Target URL to analyze */
  url: string;
  /** Output directory for reports */
  outDir?: string;
  /** Output formats */
  format?: ("json" | "html")[];
  /** Wait extra ms after page load */
  waitMs?: number;
  /** Viewport width */
  viewportWidth?: number;
  /** Viewport height */
  viewportHeight?: number;
  /** Headless browser */
  headless?: boolean;
  /** Max number of stylesheets to process */
  maxStylesheets?: number;
}

export interface ColorInfo {
  value: string;
  hex?: string;
  count: number;
  properties: string[];
}

export interface TypographyInfo {
  fontFamilies: string[];
  fontSizes: string[];
  fontWeights: string[];
  lineHeights: string[];
  letterSpacings: string[];
}

export interface SpacingInfo {
  paddings: string[];
  margins: string[];
  gaps: string[];
  unique: string[];
}

export interface BorderInfo {
  radii: string[];
  widths: string[];
  styles: string[];
}

export interface ShadowInfo {
  boxShadows: string[];
  textShadows: string[];
}

export interface BreakpointInfo {
  value: string;
  type: "min-width" | "max-width" | "other";
}

export interface LayoutInfo {
  breakpoints: BreakpointInfo[];
  flexUsage: number;
  gridUsage: number;
  containerWidths: string[];
}

export interface ComponentInfo {
  tag: string;
  role?: string;
  classList: string[];
  styles: Record<string, string>;
  text?: string;
}

export interface ComponentsInfo {
  buttons: ComponentInfo[];
  inputs: ComponentInfo[];
  cards: ComponentInfo[];
  navbars: ComponentInfo[];
  modals: ComponentInfo[];
  badges: ComponentInfo[];
  links: ComponentInfo[];
}

export interface AnimationInfo {
  transitions: string[];
  transforms: string[];
  keyframes: string[];
  durations: string[];
  easings: string[];
}

export interface LibraryInfo {
  name: string;
  version?: string;
  confidence: "certain" | "likely" | "possible";
  evidence: string;
}

export interface IconInfo {
  type: "svg-inline" | "img" | "icon-font" | "sprite";
  count: number;
  library?: string;
}

export interface FigsniffResult {
  url: string;
  title: string;
  scannedAt: string;
  durationMs: number;
  colors: {
    all: ColorInfo[];
    backgrounds: ColorInfo[];
    texts: ColorInfo[];
    borders: ColorInfo[];
    palette: string[];
  };
  typography: TypographyInfo;
  spacing: SpacingInfo;
  borders: BorderInfo;
  shadows: ShadowInfo;
  layout: LayoutInfo;
  components: ComponentsInfo;
  animations: AnimationInfo;
  libraries: LibraryInfo[];
  icons: IconInfo[];
  meta: {
    stylesheetCount: number;
    ruleCount: number;
    elementCount: number;
  };
}
