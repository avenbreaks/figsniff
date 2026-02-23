import { chromium, Browser, Page } from "playwright";
import type { FigsniffOptions } from "../types.js";

export interface BrowserSession {
  browser: Browser;
  page: Page;
  close: () => Promise<void>;
}

export async function launchBrowser(
  options: Pick<FigsniffOptions, "headless" | "viewportWidth" | "viewportHeight">
): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: options.headless ?? true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const context = await browser.newContext({
    viewport: {
      width: options.viewportWidth ?? 1440,
      height: options.viewportHeight ?? 900,
    },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const page = await context.newPage();

  // Block unnecessary resources for speed
  await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}", (route) => {
    // Allow fonts (needed for font detection), block images
    if (route.request().resourceType() === "image") {
      route.abort();
    } else {
      route.continue();
    }
  });

  return {
    browser,
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

export async function navigateTo(
  page: Page,
  url: string,
  waitMs = 2000
): Promise<void> {
  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }
}
