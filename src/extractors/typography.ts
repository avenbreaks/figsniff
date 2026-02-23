import type { Page } from "playwright";
import type { TypographyInfo } from "../types.js";

function dedup<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function sortSizes(sizes: string[]): string[] {
  return dedup(sizes).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return numA - numB;
  });
}

export async function extractTypography(page: Page): Promise<TypographyInfo> {
  const raw = await page.evaluate(() => {
    const fontFamilies: string[] = [];
    const fontSizes: string[] = [];
    const fontWeights: string[] = [];
    const lineHeights: string[] = [];
    const letterSpacings: string[] = [];

    // From stylesheets
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSStyleRule) {
              const s = rule.style;
              if (s.fontFamily) fontFamilies.push(s.fontFamily);
              if (s.fontSize) fontSizes.push(s.fontSize);
              if (s.fontWeight) fontWeights.push(s.fontWeight);
              if (s.lineHeight) lineHeights.push(s.lineHeight);
              if (s.letterSpacing) letterSpacings.push(s.letterSpacing);
            }
          }
        } catch {
          // cross-origin
        }
      }
    } catch {
      // ignore
    }

    // From computed styles on key text elements
    const textElements = Array.from(
      document.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,input,textarea"
      )
    ).slice(0, 200);

    for (const el of textElements) {
      const cs = window.getComputedStyle(el as Element);
      fontFamilies.push(cs.fontFamily);
      fontSizes.push(cs.fontSize);
      fontWeights.push(cs.fontWeight);
      lineHeights.push(cs.lineHeight);
      letterSpacings.push(cs.letterSpacing);
    }

    return { fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacings };
  });

  // Clean font families
  const cleanFamilies = dedup(
    raw.fontFamilies
      .flatMap((f) =>
        f
          .split(",")
          .map((ff) =>
            ff
              .trim()
              .replace(/^["']|["']$/g, "")
              .trim()
          )
          .filter(
            (ff) =>
              ff &&
              ff !== "inherit" &&
              ff !== "initial" &&
              ff !== "unset" &&
              ff !== "sans-serif" &&
              ff !== "serif" &&
              ff !== "monospace" &&
              ff !== "cursive" &&
              ff !== "fantasy"
          )
      )
      .filter(Boolean)
  ).slice(0, 20);

  // Clean sizes — only px/rem/em/% values
  const cleanSizes = sortSizes(
    raw.fontSizes
      .filter((s) => s && s !== "normal" && s !== "inherit" && /[\d.]/.test(s))
      .map((s) => s.trim())
  ).slice(0, 30);

  // Clean weights
  const cleanWeights = dedup(
    raw.fontWeights
      .filter((w) => w && w !== "inherit" && w !== "initial" && w !== "normal" && /\d/.test(w))
      .map((w) => w.trim())
  )
    .sort((a, b) => Number(a) - Number(b))
    .slice(0, 15);

  // Clean line heights
  const cleanLineHeights = dedup(
    raw.lineHeights
      .filter((v) => v && v !== "normal" && v !== "inherit" && /[\d.]/.test(v))
      .map((v) => v.trim())
  ).slice(0, 20);

  // Clean letter spacings
  const cleanLetterSpacings = dedup(
    raw.letterSpacings
      .filter((v) => v && v !== "normal" && v !== "inherit" && v !== "0px")
      .map((v) => v.trim())
  ).slice(0, 15);

  return {
    fontFamilies: cleanFamilies,
    fontSizes: cleanSizes,
    fontWeights: cleanWeights,
    lineHeights: cleanLineHeights,
    letterSpacings: cleanLetterSpacings,
  };
}
