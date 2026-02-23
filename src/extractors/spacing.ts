import type { Page } from "playwright";
import type { SpacingInfo } from "../types.js";

function dedup(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function sortSpacing(values: string[]): string[] {
  return dedup(values)
    .filter((v) => v && v !== "0px" && v !== "inherit" && v !== "auto" && /[\d.]/.test(v))
    .sort((a, b) => parseFloat(a) - parseFloat(b));
}

export async function extractSpacing(page: Page): Promise<SpacingInfo> {
  const raw = await page.evaluate(() => {
    const paddings: string[] = [];
    const margins: string[] = [];
    const gaps: string[] = [];

    const spacingProps = [
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "gap",
      "row-gap",
      "column-gap",
    ];

    // From stylesheets
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSStyleRule) {
              const s = rule.style;
              const pProps = [
                "padding",
                "paddingTop",
                "paddingRight",
                "paddingBottom",
                "paddingLeft",
              ];
              const mProps = [
                "margin",
                "marginTop",
                "marginRight",
                "marginBottom",
                "marginLeft",
              ];
              const gProps = ["gap", "rowGap", "columnGap"];

              for (const p of pProps) {
                const val = (s as any)[p];
                if (val) paddings.push(...val.split(" ").filter(Boolean));
              }
              for (const p of mProps) {
                const val = (s as any)[p];
                if (val) margins.push(...val.split(" ").filter(Boolean));
              }
              for (const p of gProps) {
                const val = (s as any)[p];
                if (val) gaps.push(...val.split(" ").filter(Boolean));
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

    // From computed styles
    const elements = Array.from(document.querySelectorAll("*")).slice(0, 300);
    for (const el of elements) {
      const cs = window.getComputedStyle(el as Element);

      for (const prop of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) {
        const val = cs.getPropertyValue(
          prop.replace(/([A-Z])/g, "-$1").toLowerCase()
        );
        if (val) paddings.push(val);
      }
      for (const prop of ["marginTop", "marginRight", "marginBottom", "marginLeft"]) {
        const val = cs.getPropertyValue(
          prop.replace(/([A-Z])/g, "-$1").toLowerCase()
        );
        if (val) margins.push(val);
      }
      const gap = cs.getPropertyValue("gap");
      if (gap) gaps.push(...gap.split(" ").filter(Boolean));
    }

    return { paddings, margins, gaps };
  });

  const cleanPaddings = sortSpacing(raw.paddings).slice(0, 30);
  const cleanMargins = sortSpacing(raw.margins).slice(0, 30);
  const cleanGaps = sortSpacing(raw.gaps).slice(0, 20);

  // Unique combined spacing scale
  const unique = sortSpacing([
    ...raw.paddings,
    ...raw.margins,
    ...raw.gaps,
  ]).slice(0, 40);

  return {
    paddings: cleanPaddings,
    margins: cleanMargins,
    gaps: cleanGaps,
    unique,
  };
}
