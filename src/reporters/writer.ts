import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import type { FigsniffResult } from "../types.js";
import { generateHtmlReport } from "./html.js";

export interface ReportOutput {
  jsonPath?: string;
  htmlPath?: string;
}

export async function writeReports(
  result: FigsniffResult,
  outDir: string,
  formats: ("json" | "html")[]
): Promise<ReportOutput> {
  const absDir = resolve(outDir);
  await mkdir(absDir, { recursive: true });

  const slug = new URL(result.url).hostname.replace(/\./g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const base = `${slug}-${timestamp}`;

  const output: ReportOutput = {};

  if (formats.includes("json")) {
    const jsonPath = join(absDir, `${base}.json`);
    await writeFile(jsonPath, JSON.stringify(result, null, 2), "utf-8");
    output.jsonPath = jsonPath;
  }

  if (formats.includes("html")) {
    const htmlPath = join(absDir, `${base}.html`);
    const html = generateHtmlReport(result);
    await writeFile(htmlPath, html, "utf-8");
    output.htmlPath = htmlPath;
  }

  return output;
}
