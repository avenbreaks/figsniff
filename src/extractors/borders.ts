import type { Page } from "playwright";
import type { BorderInfo } from "../types.js";

function dedup(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export async function extractBorders(page: Page): Promise<BorderInfo> {
  const raw = await page.evaluate(() => {
    const radii: string[] = [];
    const widths: string[] = [];
    const styles: string[] = [];

    // From stylesheets
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSStyleRule) {
              const s = rule.style;
              const radiusProps = [
                "borderRadius",
                "borderTopLeftRadius",
                "borderTopRightRadius",
                "borderBottomLeftRadius",
                "borderBottomRightRadius",
              ];
              const widthProps = [
                "borderWidth",
                "borderTopWidth",
                "borderRightWidth",
                "borderBottomWidth",
                "borderLeftWidth",
              ];
              const styleProps = ["borderStyle"];

              for (const p of radiusProps) {
                const val = (s as any)[p];
                if (val) radii.push(...val.split(" ").filter(Boolean));
              }
              for (const p of widthProps) {
                const val = (s as any)[p];
                if (val) widths.push(...val.split(" ").filter(Boolean));
              }
              for (const p of styleProps) {
                const val = (s as any)[p];
                if (val) styles.push(val);
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
      const br = cs.borderRadius;
      if (br && br !== "0px") radii.push(br);
      const bw = cs.borderTopWidth;
      if (bw && bw !== "0px") widths.push(bw);
      const bs = cs.borderTopStyle;
      if (bs && bs !== "none") styles.push(bs);
    }

    return { radii, widths, styles };
  });

  const cleanRadii = dedup(
    raw.radii.filter((v) => v && v !== "0px" && /[\d%]/.test(v))
  )
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .slice(0, 20);

  const cleanWidths = dedup(
    raw.widths.filter((v) => v && v !== "0px" && /[\d.]/.test(v))
  )
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .slice(0, 10);

  const cleanStyles = dedup(
    raw.styles.filter((v) => v && v !== "none" && v !== "inherit")
  ).slice(0, 10);

  return {
    radii: cleanRadii,
    widths: cleanWidths,
    styles: cleanStyles,
  };
}
