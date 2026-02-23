import type { Page } from "playwright";
import type { AnimationInfo } from "../types.js";

function dedup(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export async function extractAnimations(page: Page): Promise<AnimationInfo> {
  const raw = await page.evaluate(() => {
    const transitions: string[] = [];
    const transforms: string[] = [];
    const keyframes: string[] = [];
    const durations: string[] = [];
    const easings: string[] = [];

    // From stylesheets — also grab @keyframes
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSStyleRule) {
              const s = rule.style;
              if (s.transition) transitions.push(s.transition);
              if (s.transform) transforms.push(s.transform);
              if (s.animationDuration) durations.push(s.animationDuration);
              if (s.animationTimingFunction) easings.push(s.animationTimingFunction);
              if (s.transitionTimingFunction) easings.push(s.transitionTimingFunction);
              if (s.transitionDuration) durations.push(s.transitionDuration);
            }
            if (rule instanceof CSSKeyframesRule) {
              keyframes.push(rule.name);
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
      const t = cs.transition;
      if (t && t !== "all 0s ease 0s" && t !== "none") transitions.push(t);
      const tr = cs.transform;
      if (tr && tr !== "none") transforms.push(tr);
    }

    return { transitions, transforms, keyframes, durations, easings };
  });

  return {
    transitions: dedup(
      raw.transitions.filter((v) => v && v !== "none" && v !== "all 0s ease 0s")
    ).slice(0, 20),
    transforms: dedup(
      raw.transforms.filter((v) => v && v !== "none" && !v.startsWith("matrix"))
    ).slice(0, 20),
    keyframes: dedup(raw.keyframes.filter(Boolean)).slice(0, 20),
    durations: dedup(
      raw.durations.filter((v) => v && v !== "0s" && v !== "0ms")
    ).slice(0, 15),
    easings: dedup(
      raw.easings.filter((v) => v && v !== "ease" && v !== "initial")
    ).slice(0, 15),
  };
}
