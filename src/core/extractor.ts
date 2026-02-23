import type { Page } from "playwright";
import type { FigsniffOptions, FigsniffResult } from "../types.js";
import { launchBrowser, navigateTo } from "./browser.js";
import { extractColors } from "../extractors/colors.js";
import { extractTypography } from "../extractors/typography.js";
import { extractSpacing } from "../extractors/spacing.js";
import { extractBorders } from "../extractors/borders.js";
import { extractShadows } from "../extractors/shadows.js";
import { extractLayout } from "../extractors/layout.js";
import { extractComponents } from "../extractors/components.js";
import { extractAnimations } from "../extractors/animations.js";
import { extractLibraries } from "../extractors/libraries.js";
import { extractIcons } from "../extractors/icons.js";

async function getPageMeta(page: Page) {
  return page.evaluate(() => ({
    title: document.title,
    stylesheetCount: document.styleSheets.length,
    elementCount: document.querySelectorAll("*").length,
    ruleCount: Array.from(document.styleSheets).reduce<number>((acc, s) => {
      try {
        return acc + (s.cssRules?.length ?? 0);
      } catch {
        return acc;
      }
    }, 0),
  }));
}

export async function sniff(options: FigsniffOptions): Promise<FigsniffResult> {
  const startTime = Date.now();
  const session = await launchBrowser(options);

  try {
    await navigateTo(session.page, options.url, options.waitMs ?? 2000);

    const [
      meta,
      colors,
      typography,
      spacing,
      borders,
      shadows,
      layout,
      components,
      animations,
      libraries,
      icons,
    ] = await Promise.all([
      getPageMeta(session.page),
      extractColors(session.page),
      extractTypography(session.page),
      extractSpacing(session.page),
      extractBorders(session.page),
      extractShadows(session.page),
      extractLayout(session.page),
      extractComponents(session.page),
      extractAnimations(session.page),
      extractLibraries(session.page),
      extractIcons(session.page),
    ]);

    const durationMs = Date.now() - startTime;

    return {
      url: options.url,
      title: meta.title,
      scannedAt: new Date().toISOString(),
      durationMs,
      colors,
      typography,
      spacing,
      borders,
      shadows,
      layout,
      components,
      animations,
      libraries,
      icons,
      meta: {
        stylesheetCount: meta.stylesheetCount,
        ruleCount: meta.ruleCount,
        elementCount: meta.elementCount,
      },
    };
  } finally {
    await session.close();
  }
}
