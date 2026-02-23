import { Command } from "commander";
import chalk, { type ChalkInstance } from "chalk";
import ora from "ora";
import { sniff } from "./core/extractor.js";
import { writeReports } from "./reporters/writer.js";
import type { FigsniffResult } from "./types.js";

const program = new Command();

// ── Layout helpers ────────────────────────────────────────────────────────────

const W = 72; // total line width
const COL = 22; // left label column width

const HASH  = chalk.dim("#".repeat(W));
const blank = () => console.log("");

// ANSI Shadow font — fits 72-col terminal at 2-space indent
const ASCII_LOGO: string[] = [
  "  ███████╗██╗ ██████╗ ███████╗███╗   ██╗██╗███████╗███████╗",
  "  ██╔════╝██║██╔════╝ ██╔════╝████╗  ██║██║██╔════╝██╔════╝",
  "  █████╗  ██║██║  ███╗███████╗██╔██╗ ██║██║█████╗  █████╗  ",
  "  ██╔══╝  ██║██║   ██║╚════██║██║╚██╗██║██║██╔══╝  ██╔══╝  ",
  "  ██║     ██║╚██████╔╝███████║██║ ╚████║██║██║     ██║     ",
  "  ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝     ",
];

function section(title: string) {
  console.log("");
  console.log(chalk.dim("  ##") + "  " + chalk.bold.hex("#818cf8")(title));
}

function row(label: string, value: string, accent = false) {
  const l = chalk.dim(label.padEnd(COL));
  const v = accent ? chalk.white(value) : chalk.hex("#e2e8f0")(value);
  console.log(`  ${l} ${v}`);
}

function tag(label: string, items: string[], color: ChalkInstance = chalk.hex("#818cf8")) {
  if (!items.length) return;
  const prefix = chalk.dim(label.padEnd(COL)) + " ";
  const cols   = W - COL - 3;
  // Wrap items into lines that fit
  const lines: string[] = [];
  let cur = "";
  for (const item of items) {
    const candidate = cur ? cur + "  " + item : item;
    if (candidate.length > cols && cur) {
      lines.push(cur);
      cur = item;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  lines.forEach((l, i) =>
    console.log(`  ${i === 0 ? prefix : " ".repeat(COL + 1) + " "}${color(l)}`)
  );
}

function swatches(palette: string[]) {
  if (!palette.length) return;

  const toHex = (v: string): string | null => {
    if (/^#[0-9a-f]{3,8}$/i.test(v.trim())) return v.trim().toLowerCase();
    const m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return null;
    return "#" + [m[1], m[2], m[3]]
      .map((n) => parseInt(n).toString(16).padStart(2, "0"))
      .join("");
  };

  const items = palette.slice(0, 24);
  const hexOnly = items.map(toHex).filter((h): h is string => h !== null);

  // Chip strip
  const chips = hexOnly.map((h) => chalk.bgHex(h)("  ")).join("");
  console.log(`  ${chalk.dim("palette".padEnd(COL))} ${chips}`);

  // Hex codes as comma-separated list, wrapped to width
  const codeStr = hexOnly.join(", ");
  const maxW = W - COL - 3;
  const words = codeStr.split(", ");
  let line = "";
  let first = true;
  for (const w of words) {
    const candidate = line ? line + ", " + w : w;
    if (candidate.length > maxW && line) {
      const pfx = first ? chalk.dim("hex".padEnd(COL)) : " ".repeat(COL);
      console.log(`  ${pfx} ${chalk.dim(line + ",")}`);
      line = w;
      first = false;
    } else {
      line = candidate;
    }
  }
  if (line) {
    const pfx = first ? chalk.dim("hex".padEnd(COL)) : " ".repeat(COL);
    console.log(`  ${pfx} ${chalk.dim(line)}`);
  }
}

function countRow(label: string, n: number, suffix = "") {
  const num   = chalk.bold.hex("#7dd3fc")(String(n));
  const suf   = suffix ? chalk.dim(" " + suffix) : "";
  console.log(`  ${chalk.dim(label.padEnd(COL))} ${num}${suf}`);
}

function libRow(name: string, confidence: string, evidence: string) {
  const icon =
    confidence === "certain" ? chalk.greenBright("✔") :
    confidence === "likely"  ? chalk.yellow("~") :
                               chalk.dim("?");
  const nameStr = chalk.white(name.padEnd(18));
  const evStr   = chalk.dim(evidence);
  console.log(`  ${icon}  ${nameStr} ${evStr}`);
}

function printResult(result: FigsniffResult) {
  // ── Page ────────────────────────────────────────────────────────────────────
  section("Page Info");
  row("title",    result.title || "(no title)");
  row("url",      result.url);
  row("scanned",  result.scannedAt);
  row("duration", `${result.durationMs} ms`);
  row("elements", result.meta.elementCount.toLocaleString());
  row("css rules",result.meta.ruleCount.toLocaleString());

  // ── Colors ──────────────────────────────────────────────────────────────────
  section("Colors");
  countRow("unique colors",   result.colors.palette.length);
  countRow("backgrounds",     result.colors.backgrounds.length);
  countRow("text colors",     result.colors.texts.length);
  countRow("border colors",   result.colors.borders.length);
  swatches(result.colors.palette);

  // ── Typography ──────────────────────────────────────────────────────────────
  section("Typography");
  tag("font families", result.typography.fontFamilies,  chalk.hex("#f9a8d4"));
  tag("font sizes",    result.typography.fontSizes,     chalk.hex("#fde68a"));
  tag("font weights",  result.typography.fontWeights,   chalk.hex("#fde68a"));
  tag("line heights",  result.typography.lineHeights,   chalk.dim);
  tag("letter spacing",result.typography.letterSpacings,chalk.dim);

  // ── Spacing ─────────────────────────────────────────────────────────────────
  section("Spacing");
  countRow("unique values", result.spacing.unique.length);
  tag("paddings", result.spacing.paddings.slice(0, 12), chalk.hex("#86efac"));
  tag("margins",  result.spacing.margins.slice(0, 12),  chalk.hex("#86efac"));
  tag("gaps",     result.spacing.gaps.slice(0, 10),     chalk.hex("#86efac"));

  // ── Borders ─────────────────────────────────────────────────────────────────
  section("Borders");
  tag("radii",  result.borders.radii,  chalk.hex("#67e8f9"));
  tag("widths", result.borders.widths, chalk.hex("#67e8f9"));
  tag("styles", result.borders.styles, chalk.hex("#67e8f9"));

  // ── Shadows ─────────────────────────────────────────────────────────────────
  if (result.shadows.boxShadows.length || result.shadows.textShadows.length) {
    section("Shadows");
    tag("box-shadow",  result.shadows.boxShadows.slice(0, 5), chalk.hex("#c4b5fd"));
    tag("text-shadow", result.shadows.textShadows.slice(0, 5),chalk.hex("#c4b5fd"));
  }

  // ── Layout ──────────────────────────────────────────────────────────────────
  section("Layout");
  tag("breakpoints",  result.layout.breakpoints.map((b) => b.value), chalk.hex("#fbbf24"));
  tag("containers",   result.layout.containerWidths, chalk.hex("#fbbf24"));
  countRow("flex usage",  result.layout.flexUsage,  "elements");
  countRow("grid usage",  result.layout.gridUsage,  "elements");

  // ── Components ──────────────────────────────────────────────────────────────
  section("Components");
  countRow("buttons",  result.components.buttons.length);
  countRow("inputs",   result.components.inputs.length);
  countRow("cards",    result.components.cards.length);
  countRow("navbars",  result.components.navbars.length);
  countRow("modals",   result.components.modals.length);
  countRow("badges",   result.components.badges.length);
  countRow("links",    result.components.links.length);

  // ── Animations ──────────────────────────────────────────────────────────────
  if (
    result.animations.durations.length ||
    result.animations.easings.length ||
    result.animations.keyframes.length
  ) {
    section("Animations");
    tag("durations", result.animations.durations,  chalk.hex("#a5f3fc"));
    tag("easings",   result.animations.easings,    chalk.hex("#a5f3fc"));
    tag("keyframes", result.animations.keyframes.slice(0, 8), chalk.hex("#a5f3fc"));
  }

  // ── Icons ───────────────────────────────────────────────────────────────────
  if (result.icons.length) {
    section("Icons");
    for (const ic of result.icons) {
      const lib = ic.library ? chalk.dim(` (${ic.library})`) : "";
      console.log(
        `  ${chalk.dim("type".padEnd(COL))} ${chalk.hex("#6ee7b7")(ic.type)}${lib}  ` +
        chalk.bold.hex("#7dd3fc")(String(ic.count))
      );
    }
  }

  // ── Libraries ───────────────────────────────────────────────────────────────
  if (result.libraries.length) {
    section("Detected Libraries");
    for (const lib of result.libraries) {
      libRow(lib.name, lib.confidence, lib.evidence);
    }
  }

  console.log("");
  console.log(HASH);
  console.log("");
}

// ── CLI definition ────────────────────────────────────────────────────────────

program
  .name("figsniff")
  .description(
    "Reverse-engineer any website's design system — colors, typography, spacing, components, and libraries."
  )
  .version("0.1.0");

program
  .argument("<url>", "URL of the website to sniff")
  .option("-o, --out <dir>", "Output directory for reports", "./figsniff-output")
  .option(
    "-f, --format <formats>",
    "Output formats: json,html (comma-separated)",
    "html,json"
  )
  .option("-p, --print", "Print results directly to terminal (no files written)", false)
  .option("--wait <ms>", "Extra wait time in ms after page load", "2000")
  .option("--width <px>", "Viewport width", "1440")
  .option("--height <px>", "Viewport height", "900")
  .option("--headed", "Run browser in headed mode (visible)", false)
  .action(async (url: string, opts: Record<string, string | boolean>) => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      console.error(chalk.red("  Invalid URL: " + url));
      process.exit(1);
    }

    const printMode = opts.print as boolean;

    const formats = (opts.format as string)
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f === "json" || f === "html") as ("json" | "html")[];

    if (!printMode && formats.length === 0) {
      console.error(chalk.red("  No valid formats specified. Use: json,html"));
      process.exit(1);
    }

    // ── Header banner ──────────────────────────────────────────────────────────
    console.log("");
    ASCII_LOGO.forEach((l) => console.log(chalk.hex("#818cf8")(l)));
    console.log(chalk.dim("  " + "#".repeat(W - 2)));
    console.log(chalk.dim("  reverse-engineer any website's design system"));
    console.log("");
    row("target",  url);
    if (!printMode) {
      row("output",  opts.out as string);
      row("format",  formats.join(", "));
    } else {
      row("mode",   "print  (no files written)");
    }
    console.log("");

    // ── Spinner ────────────────────────────────────────────────────────────────
    const spinner = ora({
      text: "Launching browser...",
      color: "magenta",
      spinner: "dots",
      indent: 2,
    }).start();

    try {
      spinner.text = "Loading page...";
      const result = await sniff({
        url,
        outDir: opts.out as string,
        format: printMode ? [] : formats,
        waitMs: parseInt(opts.wait as string, 10),
        viewportWidth: parseInt(opts.width as string, 10),
        viewportHeight: parseInt(opts.height as string, 10),
        headless: !(opts.headed as boolean),
      });

      if (printMode) {
        spinner.succeed(chalk.greenBright("Done  ") + chalk.dim(`${result.durationMs} ms`));
        printResult(result);
      } else {
        spinner.text = "Writing reports...";
        const output = await writeReports(result, opts.out as string, formats);
        spinner.succeed(chalk.greenBright("Done  ") + chalk.dim(`${result.durationMs} ms`));

        // ── File output summary ────────────────────────────────────────────────
        section("Output");
        if (output.htmlPath) row("html", output.htmlPath, true);
        if (output.jsonPath) row("json", output.jsonPath, true);

        // Quick stats
        section("Summary");
        row("page",      result.title || "(no title)");
        countRow("colors",    result.colors.palette.length);
        countRow("fonts",     result.typography.fontFamilies.length);
        countRow("spacing",   result.spacing.unique.length, "values");
        countRow("components",
          result.components.buttons.length +
          result.components.inputs.length  +
          result.components.cards.length   +
          result.components.navbars.length +
          result.components.badges.length
        );
        countRow("libraries", result.libraries.length, "detected");
        if (result.libraries.length) {
          tag("", result.libraries.map((l) => l.name), chalk.greenBright);
        }
        console.log("");
        console.log(HASH);
        console.log("");
      }
    } catch (err) {
      spinner.fail(chalk.red("Scan failed"));
      blank();
      console.error(
        "  " + chalk.red("error  ") +
        (err instanceof Error ? err.message : String(err))
      );
      if (err instanceof Error && err.stack) {
        console.error(chalk.dim(err.stack.split("\n").slice(1).join("\n")));
      }
      process.exit(1);
    }
  });

program.parse();
