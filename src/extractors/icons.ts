import type { Page } from "playwright";
import type { IconInfo } from "../types.js";

export async function extractIcons(page: Page): Promise<IconInfo[]> {
  const raw = await page.evaluate(() => {
    const result: Record<string, { type: string; count: number; library?: string }> = {};

    // Inline SVGs
    const inlineSvgs = document.querySelectorAll("svg").length;
    if (inlineSvgs > 0) {
      result["svg-inline"] = {
        type: "svg-inline",
        count: inlineSvgs,
        library: undefined,
      };
    }

    // SVG sprites (use element)
    const svgUse = document.querySelectorAll("svg use").length;
    if (svgUse > 0) {
      result["sprite"] = {
        type: "sprite",
        count: svgUse,
        library: undefined,
      };
    }

    // Image-based icons
    const iconImgs = Array.from(document.querySelectorAll("img")).filter((img) => {
      const src = img.src.toLowerCase();
      return src.includes("icon") || src.includes("ico");
    }).length;
    if (iconImgs > 0) {
      result["img"] = { type: "img", count: iconImgs };
    }

    // Font Awesome
    const fa = document.querySelectorAll('[class*="fa-"],[class*="fas "],[class*="far "],[class*="fab "]').length;
    if (fa > 0) {
      result["icon-font-fa"] = {
        type: "icon-font",
        count: fa,
        library: "Font Awesome",
      };
    }

    // Material Icons
    const mi = document.querySelectorAll(".material-icons, .material-symbols-outlined, .material-symbols-rounded").length;
    if (mi > 0) {
      result["icon-font-mi"] = {
        type: "icon-font",
        count: mi,
        library: "Material Icons",
      };
    }

    // Bootstrap Icons
    const bi = document.querySelectorAll('[class*="bi-"]').length;
    if (bi > 0) {
      result["icon-font-bi"] = {
        type: "icon-font",
        count: bi,
        library: "Bootstrap Icons",
      };
    }

    return result;
  });

  return Object.values(raw).map((v) => ({
    type: v.type as IconInfo["type"],
    count: v.count,
    library: v.library,
  }));
}
