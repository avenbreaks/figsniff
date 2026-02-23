import type { Page } from "playwright";
import type { ShadowInfo } from "../types.js";

function dedup(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export async function extractShadows(page: Page): Promise<ShadowInfo> {
  const raw = await page.evaluate(() => {
    const boxShadows: string[] = [];
    const textShadows: string[] = [];

    // From stylesheets
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSStyleRule) {
              const s = rule.style;
              if (s.boxShadow) boxShadows.push(s.boxShadow);
              if (s.textShadow) textShadows.push(s.textShadow);
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
      const bs = cs.boxShadow;
      if (bs && bs !== "none") boxShadows.push(bs);
      const ts = cs.textShadow;
      if (ts && ts !== "none") textShadows.push(ts);
    }

    return { boxShadows, textShadows };
  });

  return {
    boxShadows: dedup(
      raw.boxShadows.filter((v) => v && v !== "none" && v !== "inherit")
    ).slice(0, 20),
    textShadows: dedup(
      raw.textShadows.filter((v) => v && v !== "none" && v !== "inherit")
    ).slice(0, 10),
  };
}
