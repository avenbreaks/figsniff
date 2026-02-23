import type { Page } from "playwright";
import type { LibraryInfo } from "../types.js";

interface LibrarySignature {
  name: string;
  checks: Array<{
    type: "global" | "class" | "attribute" | "selector" | "script" | "link" | "meta";
    value: string;
    version?: string;
  }>;
  confidence: LibraryInfo["confidence"];
}

const SIGNATURES: LibrarySignature[] = [
  // CSS Frameworks
  {
    name: "Tailwind CSS",
    checks: [
      { type: "class", value: "tailwind" },
      { type: "class", value: "tw-" },
      { type: "selector", value: ".text-sm,.font-bold,.flex,.grid,.bg-" },
      { type: "link", value: "tailwind" },
      { type: "script", value: "tailwind" },
    ],
    confidence: "certain",
  },
  {
    name: "Bootstrap",
    checks: [
      { type: "class", value: "btn btn-" },
      { type: "class", value: "container-fluid" },
      { type: "class", value: "row col-" },
      { type: "link", value: "bootstrap" },
      { type: "script", value: "bootstrap" },
      { type: "global", value: "bootstrap" },
    ],
    confidence: "certain",
  },
  {
    name: "Material UI (MUI)",
    checks: [
      { type: "class", value: "MuiButton" },
      { type: "class", value: "MuiTypography" },
      { type: "class", value: "MuiBox" },
      { type: "global", value: "__MUI_USE_NEXT_TYPOGRAPHY_VARIANTS__" },
    ],
    confidence: "certain",
  },
  {
    name: "Chakra UI",
    checks: [
      { type: "global", value: "chakra" },
      { type: "class", value: "chakra-" },
      { type: "attribute", value: "data-chakra-component" },
    ],
    confidence: "certain",
  },
  {
    name: "Ant Design",
    checks: [
      { type: "class", value: "ant-btn" },
      { type: "class", value: "ant-layout" },
      { type: "class", value: "ant-" },
      { type: "global", value: "antd" },
    ],
    confidence: "certain",
  },
  {
    name: "shadcn/ui",
    checks: [
      { type: "class", value: "data-[state=" },
      { type: "attribute", value: "data-radix" },
      { type: "global", value: "Radix" },
    ],
    confidence: "likely",
  },
  // JS Frameworks
  {
    name: "React",
    checks: [
      { type: "global", value: "React" },
      { type: "global", value: "__REACT_DEVTOOLS_GLOBAL_HOOK__" },
      { type: "attribute", value: "data-reactroot" },
      { type: "attribute", value: "data-reactid" },
    ],
    confidence: "certain",
  },
  {
    name: "Next.js",
    checks: [
      { type: "global", value: "__NEXT_DATA__" },
      { type: "global", value: "next" },
      { type: "attribute", value: "data-nextjs" },
      { type: "script", value: "_next/static" },
      { type: "meta", value: "next.js" },
    ],
    confidence: "certain",
  },
  {
    name: "Vue.js",
    checks: [
      { type: "global", value: "Vue" },
      { type: "global", value: "__VUE__" },
      { type: "attribute", value: "data-v-" },
    ],
    confidence: "certain",
  },
  {
    name: "Nuxt.js",
    checks: [
      { type: "global", value: "__NUXT__" },
      { type: "global", value: "$nuxt" },
      { type: "script", value: "_nuxt" },
    ],
    confidence: "certain",
  },
  {
    name: "Angular",
    checks: [
      { type: "attribute", value: "ng-version" },
      { type: "attribute", value: "_nghost" },
      { type: "attribute", value: "ng-app" },
    ],
    confidence: "certain",
  },
  {
    name: "Svelte",
    checks: [
      { type: "global", value: "__svelte" },
      { type: "attribute", value: "svelte-" },
      { type: "class", value: "svelte-" },
    ],
    confidence: "certain",
  },
  {
    name: "Remix",
    checks: [
      { type: "global", value: "__remixContext" },
      { type: "attribute", value: "data-remix" },
    ],
    confidence: "certain",
  },
  {
    name: "Gatsby",
    checks: [
      { type: "global", value: "___gatsby" },
      { type: "attribute", value: "data-gatsby" },
    ],
    confidence: "certain",
  },
  // Icon libraries
  {
    name: "Font Awesome",
    checks: [
      { type: "class", value: "fa fa-" },
      { type: "class", value: "fas fa-" },
      { type: "class", value: "far fa-" },
      { type: "link", value: "font-awesome" },
      { type: "link", value: "fontawesome" },
    ],
    confidence: "certain",
  },
  {
    name: "Lucide Icons",
    checks: [
      { type: "global", value: "lucide" },
      { type: "attribute", value: "lucide-" },
    ],
    confidence: "certain",
  },
  {
    name: "Heroicons",
    checks: [
      { type: "attribute", value: "data-heroicon" },
    ],
    confidence: "likely",
  },
  // CSS-in-JS
  {
    name: "Styled Components",
    checks: [
      { type: "global", value: "__styled-components-init__" },
      { type: "global", value: "styled" },
      { type: "attribute", value: "data-styled" },
      { type: "class", value: "sc-" },
    ],
    confidence: "certain",
  },
  {
    name: "Emotion",
    checks: [
      { type: "global", value: "__emotion_cache__" },
      { type: "attribute", value: "data-emotion" },
      { type: "class", value: "css-" },
    ],
    confidence: "likely",
  },
  // State management
  {
    name: "Redux",
    checks: [
      { type: "global", value: "__REDUX_DEVTOOLS_EXTENSION__" },
      { type: "global", value: "Redux" },
    ],
    confidence: "certain",
  },
  // Analytics / Tracking
  {
    name: "Google Analytics",
    checks: [
      { type: "global", value: "gtag" },
      { type: "script", value: "google-analytics.com" },
      { type: "script", value: "gtag/js" },
    ],
    confidence: "certain",
  },
  {
    name: "Google Tag Manager",
    checks: [
      { type: "global", value: "dataLayer" },
      { type: "script", value: "googletagmanager.com" },
    ],
    confidence: "certain",
  },
  // Fonts
  {
    name: "Google Fonts",
    checks: [
      { type: "link", value: "fonts.googleapis.com" },
      { type: "link", value: "fonts.gstatic.com" },
    ],
    confidence: "certain",
  },
  // Build tools (via script paths)
  {
    name: "Webpack",
    checks: [
      { type: "global", value: "__webpack_require__" },
      { type: "script", value: "webpack" },
    ],
    confidence: "certain",
  },
  {
    name: "Vite",
    checks: [
      { type: "global", value: "__vite_plugin_react_preamble_installed__" },
      { type: "script", value: "@vite" },
      { type: "script", value: "/vite/" },
    ],
    confidence: "certain",
  },
];

export async function extractLibraries(page: Page): Promise<LibraryInfo[]> {
  const detected: LibraryInfo[] = [];

  const pageInfo = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script")).map(
      (s) => s.src || s.textContent?.slice(0, 200) || ""
    );
    const links = Array.from(document.querySelectorAll("link[rel=stylesheet]")).map(
      (l) => (l as HTMLLinkElement).href || ""
    );
    const allClasses = Array.from(document.querySelectorAll("*"))
      .slice(0, 500)
      .flatMap((el) => Array.from(el.classList))
      .join(" ");
    const allAttributes = Array.from(document.querySelectorAll("*"))
      .slice(0, 200)
      .flatMap((el) =>
        Array.from(el.attributes).map((a) => `${a.name}=${a.value}`)
      )
      .join(" ");

    const globals = Object.keys(window).join(",");
    const metas = Array.from(document.querySelectorAll("meta"))
      .map((m) => `${m.name}=${m.content}`)
      .join(" ");

    return { scripts, links, allClasses, allAttributes, globals, metas };
  });

  const seenLibraries = new Set<string>();

  for (const sig of SIGNATURES) {
    if (seenLibraries.has(sig.name)) continue;

    for (const check of sig.checks) {
      let found = false;
      let evidence = "";

      switch (check.type) {
        case "global":
          if (pageInfo.globals.includes(check.value)) {
            found = true;
            evidence = `window.${check.value} detected`;
          }
          break;
        case "class":
          if (pageInfo.allClasses.includes(check.value)) {
            found = true;
            evidence = `CSS class "${check.value}" found`;
          }
          break;
        case "attribute":
          if (pageInfo.allAttributes.includes(check.value)) {
            found = true;
            evidence = `Attribute "${check.value}" found`;
          }
          break;
        case "script":
          if (pageInfo.scripts.some((s) => s.includes(check.value))) {
            found = true;
            evidence = `Script src contains "${check.value}"`;
          }
          break;
        case "link":
          if (
            pageInfo.links.some((l) => l.includes(check.value)) ||
            pageInfo.scripts.some((s) => s.includes(check.value))
          ) {
            found = true;
            evidence = `Link/resource contains "${check.value}"`;
          }
          break;
        case "meta":
          if (pageInfo.metas.toLowerCase().includes(check.value.toLowerCase())) {
            found = true;
            evidence = `Meta tag contains "${check.value}"`;
          }
          break;
        case "selector":
          // Check each class in the selector
          found = check.value.split(",").every((cls) => {
            const c = cls.replace(/^\./, "").trim();
            return pageInfo.allClasses.includes(c);
          });
          if (found) evidence = `Multiple marker classes found: ${check.value}`;
          break;
      }

      if (found) {
        detected.push({
          name: sig.name,
          confidence: sig.confidence,
          evidence,
        });
        seenLibraries.add(sig.name);
        break;
      }
    }
  }

  return detected;
}
