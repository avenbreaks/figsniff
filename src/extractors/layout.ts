import type { Page } from "playwright";
import type { LayoutInfo, BreakpointInfo } from "../types.js";

export async function extractLayout(page: Page): Promise<LayoutInfo> {
  const raw = await page.evaluate(() => {
    const breakpoints: Array<{ value: string; type: string }> = [];
    const containerWidths: string[] = [];
    let flexUsage = 0;
    let gridUsage = 0;

    // Extract breakpoints from media queries in stylesheets
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSMediaRule) {
              const media = rule.conditionText || rule.media.mediaText;
              const minMatch = media.match(/min-width:\s*([\d.]+(?:px|em|rem))/i);
              const maxMatch = media.match(/max-width:\s*([\d.]+(?:px|em|rem))/i);

              if (minMatch) {
                breakpoints.push({ value: minMatch[1], type: "min-width" });
              }
              if (maxMatch) {
                breakpoints.push({ value: maxMatch[1], type: "max-width" });
              }
              if (!minMatch && !maxMatch && media !== "all" && media !== "screen") {
                breakpoints.push({ value: media, type: "other" });
              }
            }
          }
        } catch {
          // cross-origin
        }
      }
    } catch {
      // ignore
    }

    // Count flex/grid usage and max-width containers
    const elements = Array.from(document.querySelectorAll("*")).slice(0, 500);
    for (const el of elements) {
      const cs = window.getComputedStyle(el as Element);
      const display = cs.display;

      if (display === "flex" || display === "inline-flex") flexUsage++;
      if (display === "grid" || display === "inline-grid") gridUsage++;

      const maxWidth = cs.maxWidth;
      if (
        maxWidth &&
        maxWidth !== "none" &&
        maxWidth !== "0px" &&
        /[\d]/.test(maxWidth)
      ) {
        containerWidths.push(maxWidth);
      }
    }

    return { breakpoints, containerWidths, flexUsage, gridUsage };
  });

  // Deduplicate and sort breakpoints
  const bpMap = new Map<string, BreakpointInfo>();
  for (const bp of raw.breakpoints) {
    const key = `${bp.type}:${bp.value}`;
    if (!bpMap.has(key)) {
      bpMap.set(key, {
        value: bp.value,
        type: bp.type as BreakpointInfo["type"],
      });
    }
  }

  const breakpoints = Array.from(bpMap.values()).sort(
    (a, b) => parseFloat(a.value) - parseFloat(b.value)
  );

  // Top container widths
  const cwCount = new Map<string, number>();
  for (const w of raw.containerWidths) {
    cwCount.set(w, (cwCount.get(w) ?? 0) + 1);
  }
  const containerWidths = Array.from(cwCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 10);

  return {
    breakpoints,
    flexUsage: raw.flexUsage,
    gridUsage: raw.gridUsage,
    containerWidths,
  };
}
