// figsniff — public library API
export { sniff } from "./core/extractor.js";
export { generateHtmlReport } from "./reporters/html.js";
export { writeReports } from "./reporters/writer.js";
export type {
  FigsniffOptions,
  FigsniffResult,
  ColorInfo,
  TypographyInfo,
  SpacingInfo,
  BorderInfo,
  ShadowInfo,
  LayoutInfo,
  BreakpointInfo,
  ComponentsInfo,
  ComponentInfo,
  AnimationInfo,
  LibraryInfo,
  IconInfo,
} from "./types.js";
