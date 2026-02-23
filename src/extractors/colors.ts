import type { Page } from "playwright";
import type { ColorInfo } from "../types.js";

// Normalize any CSS color value to a comparable key
function normalizeColor(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

// Clamp + linear-light sRGB gamma
function gam(v: number): number {
  const c = Math.max(0, Math.min(1, v));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function toHexByte(v: number): string {
  return Math.round(Math.max(0, Math.min(255, v * 255)))
    .toString(16)
    .padStart(2, "0");
}

// oklab(L a b) → #rrggbb
function oklabToHex(raw: string): string | undefined {
  const m = raw.match(/oklab\(\s*([\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i);
  if (!m) return undefined;
  const [L, a, b] = [+m[1], +m[2], +m[3]];
  // oklab → OKL MS → linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const ll = l_ ** 3, mm = m_ ** 3, ss = s_ ** 3;
  const r = gam( 4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss);
  const g = gam(-1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss);
  const bv= gam(-0.0041960863 * ll - 0.7034186147 * mm + 1.7076147010 * ss);
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(bv)}`;
}

// lab(L a b) → #rrggbb  (D50 → D65 Bradford, then linear sRGB)
function labToHex(raw: string): string | undefined {
  const m = raw.match(/^lab\(\s*([\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i);
  if (!m) return undefined;
  const [L, a, b] = [+m[1], +m[2], +m[3]];
  // Lab → XYZ D50
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const k = 24389 / 27, e = 216 / 24389;
  const x = (fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k) * 0.3457 / 0.3585;
  const y =  L > k * e ? ((L + 16) / 116) ** 3 : L / k;
  const z = (fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k) * (1 - 0.3457 / 0.3585 - 0.2958 / 0.3585);
  // D50 → D65 (Bradford)
  const xd = x *  0.9555766 - y * 0.0230393 + z * 0.0631636;
  const yd = x * -0.0282895 + y * 1.0099416 + z * 0.0210077;
  const zd = x *  0.0122982 - y * 0.0204830 + z * 1.3299098;
  // XYZ D65 → linear sRGB
  const rl =  3.2404542 * xd - 1.5371385 * yd - 0.4985314 * zd;
  const gl = -0.9692660 * xd + 1.8760108 * yd + 0.0415560 * zd;
  const bl =  0.0556434 * xd - 0.2040259 * yd + 1.0572252 * zd;
  return `#${toHexByte(gam(rl))}${toHexByte(gam(gl))}${toHexByte(gam(bl))}`;
}

// Convert rgb(r,g,b) or rgba(r,g,b,a) to hex
function rgbToHex(rgb: string): string | undefined {
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return undefined;
  const [, r, g, b] = match.map(Number);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Master converter — tries all known formats
function anyToHex(value: string): string | undefined {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/.test(v)) return v;
  return rgbToHex(v) ?? oklabToHex(v) ?? labToHex(v);
}

function isTransparent(v: string): boolean {
  return (
    v === "transparent" ||
    v === "rgba(0, 0, 0, 0)" ||
    v === "rgba(0,0,0,0)" ||
    v === "inherit" ||
    v === "initial" ||
    v === "unset" ||
    v === "currentcolor" ||
    v === "currentColor"
  );
}

export interface ColorsExtracted {
  all: ColorInfo[];
  backgrounds: ColorInfo[];
  texts: ColorInfo[];
  borders: ColorInfo[];
  palette: string[];
}

export async function extractColors(page: Page): Promise<ColorsExtracted> {
  const raw = await page.evaluate(() => {
    const results: { value: string; property: string }[] = [];
    const colorProps = [
      "color",
      "background-color",
      "border-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "outline-color",
      "text-decoration-color",
      "caret-color",
      "fill",
      "stroke",
    ];

    // Get from stylesheets
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              for (const prop of colorProps) {
                const val = rule.style.getPropertyValue(prop);
                if (val && val !== "") {
                  results.push({ value: val.trim(), property: prop });
                }
              }
            }
          }
        } catch {
          // cross-origin stylesheet, skip
        }
      }
    } catch {
      // ignore
    }

    // Get computed styles from visible elements
    const elements = Array.from(document.querySelectorAll("*")).slice(0, 500);
    for (const el of elements) {
      const cs = window.getComputedStyle(el as Element);
      for (const prop of ["color", "background-color", "border-color"]) {
        const val = cs.getPropertyValue(prop);
        if (val && val !== "") {
          results.push({ value: val.trim(), property: prop });
        }
      }
    }

    return results;
  });

  // Aggregate
  const map = new Map<string, ColorInfo>();

  for (const { value, property } of raw) {
    const norm = normalizeColor(value);
    if (!norm || isTransparent(norm)) continue;

    if (map.has(norm)) {
      const entry = map.get(norm)!;
      entry.count++;
      if (!entry.properties.includes(property)) {
        entry.properties.push(property);
      }
    } else {
      map.set(norm, {
        value: norm,
        hex: anyToHex(norm),
        count: 1,
        properties: [property],
      });
    }
  }

  const all = Array.from(map.values())
    .filter((c) => !isTransparent(c.value))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  const backgrounds = all.filter((c) =>
    c.properties.some((p) => p.includes("background"))
  );
  const texts = all.filter((c) => c.properties.some((p) => p === "color"));
  const borders = all.filter((c) =>
    c.properties.some((p) => p.includes("border"))
  );

  // Build palette: unique hex values sorted by frequency
  const paletteSet = new Set<string>();
  const palette: string[] = [];
  for (const c of all) {
    const key = c.hex ?? c.value;
    if (!paletteSet.has(key)) {
      paletteSet.add(key);
      palette.push(key);
    }
    if (palette.length >= 30) break;
  }

  return { all, backgrounds, texts, borders, palette };
}
