import type { Page } from "playwright";
import type { ComponentsInfo, ComponentInfo } from "../types.js";

async function extractBySelector(
  page: Page,
  selector: string,
  limit = 5
): Promise<ComponentInfo[]> {
  return page.evaluate(
    ({ sel, lim }) => {
      const els = Array.from(document.querySelectorAll(sel)).slice(0, lim);
      return els.map((el) => {
        const cs = window.getComputedStyle(el as HTMLElement);
        const rect = (el as HTMLElement).getBoundingClientRect();

        // Only pick elements in viewport
        if (rect.width === 0 || rect.height === 0) return null;

        return {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute("role") || undefined,
          classList: Array.from(el.classList).slice(0, 10),
          text: ((el as HTMLElement).innerText || "").trim().slice(0, 80),
          styles: {
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            padding: cs.padding,
            paddingTop: cs.paddingTop,
            paddingRight: cs.paddingRight,
            paddingBottom: cs.paddingBottom,
            paddingLeft: cs.paddingLeft,
            margin: cs.margin,
            borderRadius: cs.borderRadius,
            border: cs.border,
            borderWidth: cs.borderTopWidth,
            borderColor: cs.borderTopColor,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            fontFamily: cs.fontFamily,
            width: cs.width,
            height: cs.height,
            display: cs.display,
            boxShadow: cs.boxShadow !== "none" ? cs.boxShadow : undefined,
            cursor: cs.cursor,
          },
        };
      }).filter(Boolean) as any[];
    },
    { sel: selector, lim: limit }
  );
}

export async function extractComponents(page: Page): Promise<ComponentsInfo> {
  const [buttons, inputs, navbars, modals, badges, links, cards] =
    await Promise.all([
      // Buttons
      extractBySelector(
        page,
        'button, [role="button"], a.btn, input[type="submit"], input[type="button"], .btn',
        8
      ),
      // Inputs
      extractBySelector(
        page,
        'input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select',
        5
      ),
      // Navbars
      extractBySelector(page, 'nav, header, [role="navigation"], .navbar, .nav', 2),
      // Modals
      extractBySelector(
        page,
        '[role="dialog"], .modal, .dialog, [aria-modal="true"]',
        3
      ),
      // Badges
      extractBySelector(
        page,
        '.badge, .tag, .chip, .label, [class*="badge"], [class*="chip"]',
        5
      ),
      // Links
      extractBySelector(page, "a[href]", 5),
      // Cards — heuristic: divs with border/shadow and padding
      page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll("article, .card, [class*='card'], section > div, main > div")).slice(0, 10);
        return candidates.map((el) => {
          const cs = window.getComputedStyle(el as HTMLElement);
          const rect = (el as HTMLElement).getBoundingClientRect();
          if (rect.width < 100 || rect.height < 50) return null;
          const hasBorder = cs.borderTopWidth !== "0px";
          const hasShadow = cs.boxShadow !== "none";
          const hasPadding = parseFloat(cs.paddingTop) > 0;
          if (!hasBorder && !hasShadow && !hasPadding) return null;
          return {
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute("role") || undefined,
            classList: Array.from(el.classList).slice(0, 10),
            text: ((el as HTMLElement).innerText || "").trim().slice(0, 80),
            styles: {
              backgroundColor: cs.backgroundColor,
              color: cs.color,
              padding: cs.padding,
              paddingTop: cs.paddingTop,
              paddingRight: cs.paddingRight,
              paddingBottom: cs.paddingBottom,
              paddingLeft: cs.paddingLeft,
              borderRadius: cs.borderRadius,
              border: cs.border,
              borderWidth: cs.borderTopWidth,
              borderColor: cs.borderTopColor,
              boxShadow: cs.boxShadow !== "none" ? cs.boxShadow : undefined,
              width: cs.width,
              display: cs.display,
            },
          };
        }).filter(Boolean) as any[];
      }),
    ]);

  return {
    buttons: buttons.slice(0, 8),
    inputs: inputs.slice(0, 5),
    cards: cards.slice(0, 5),
    navbars: navbars.slice(0, 2),
    modals: modals.slice(0, 3),
    badges: badges.slice(0, 5),
    links: links.slice(0, 5),
  };
}
