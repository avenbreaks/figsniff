import type { FigsniffResult, ColorInfo, ComponentInfo } from "../types.js";

function isLightColor(hex: string): boolean {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return false;
  const [, r, g, b] = match.map((x, i) => i === 0 ? x : parseInt(x, 16));
  return (0.299 * (r as number) + 0.587 * (g as number) + 0.114 * (b as number)) / 255 > 0.5;
}

function colorSwatch(c: ColorInfo): string {
  const bg = c.hex ?? c.value;
  const light = isLightColor(bg);
  return `<div class="swatch reveal" title="${c.value}">
    <div class="swatch-face" style="background:${c.value}">
      <span class="swatch-hex" style="color:${light ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)"}">${c.hex ?? ""}</span>
      <span class="swatch-count" style="color:${light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"}">×${c.count}</span>
    </div>
    <div class="swatch-label">${c.value}</div>
  </div>`;
}

function componentCard(comp: ComponentInfo, label: string): string {
  const rows = Object.entries(comp.styles)
    .filter(([, v]) => v && v !== "rgba(0, 0, 0, 0)" && v !== "none" && v !== "0px" && v !== "undefined")
    .map(([k, v]) => `<tr><td class="pk">${k}</td><td class="pv">${v}</td></tr>`)
    .join("");

  const isBtn = comp.tag === "button" || comp.role === "button";
  const preview = isBtn
    ? `<div class="comp-stage">
        <button style="
          background:${comp.styles.backgroundColor ?? "#333"};
          color:${comp.styles.color ?? "#fff"};
          padding:${comp.styles.paddingTop ?? "8px"} ${comp.styles.paddingRight ?? "16px"} ${comp.styles.paddingBottom ?? "8px"} ${comp.styles.paddingLeft ?? "16px"};
          border-radius:${comp.styles.borderRadius ?? "6px"};
          border:${comp.styles.borderWidth ?? "1px"} solid ${comp.styles.borderColor ?? "transparent"};
          font-size:${comp.styles.fontSize ?? "14px"};
          font-weight:${comp.styles.fontWeight ?? "500"};
          font-family:inherit;cursor:pointer;outline:none;
        ">${comp.text?.slice(0, 28) || label}</button>
      </div>`
    : "";

  return `<div class="comp-card reveal">
    <div class="comp-head">
      <code class="comp-tag">&lt;${comp.tag}&gt;</code>
      ${comp.role ? `<span class="chip chip-role">${comp.role}</span>` : ""}
      ${comp.classList.length ? `<span class="chip chip-class">.${comp.classList.slice(0, 2).join(".")}</span>` : ""}
    </div>
    ${preview}
    ${rows ? `<table class="ptable"><tbody>${rows}</tbody></table>` : ""}
  </div>`;
}

function libCard(lib: { name: string; confidence: string; evidence: string }): string {
  const dot = lib.confidence === "certain" ? "#22c55e" : lib.confidence === "likely" ? "#f59e0b" : "#94a3b8";
  const label = lib.confidence === "certain" ? "certain" : lib.confidence === "likely" ? "likely" : "possible";
  return `<div class="lib-card reveal">
    <div class="lib-dot" style="background:${dot};box-shadow:0 0 8px ${dot}"></div>
    <div class="lib-body">
      <span class="lib-name">${lib.name}</span>
      <span class="lib-conf" style="color:${dot}">${label}</span>
    </div>
    <p class="lib-ev">${lib.evidence}</p>
  </div>`;
}

function emptyState(msg: string): string {
  return `<div class="empty-state"><span class="empty-icon">◌</span><span>${msg}</span></div>`;
}

function sectionWrap(id: string, icon: string, title: string, body: string): string {
  return `<section class="section" id="${id}">
    <div class="sec-head">
      <div class="sec-icon">${icon}</div>
      <h2 class="sec-title">${title}</h2>
      <div class="sec-line"></div>
    </div>
    <div class="sec-body">${body}</div>
  </section>`;
}

export function generateHtmlReport(result: FigsniffResult): string {

  /* ── COLORS ───────────────────────────────────────────── */
  const colorsBody = result.colors.palette.length ? `
    <div class="palette-hero">
      ${result.colors.palette.map(c => `<div class="ph-chip" style="background:${c}" title="${c}"></div>`).join("")}
    </div>
    <div class="color-groups">
      <div class="color-group">
        <div class="group-label">Backgrounds <span class="group-count">${result.colors.backgrounds.length}</span></div>
        <div class="swatches">${result.colors.backgrounds.map(colorSwatch).join("") || emptyState("none")}</div>
      </div>
      <div class="color-group">
        <div class="group-label">Text <span class="group-count">${result.colors.texts.length}</span></div>
        <div class="swatches">${result.colors.texts.map(colorSwatch).join("") || emptyState("none")}</div>
      </div>
      <div class="color-group">
        <div class="group-label">Borders <span class="group-count">${result.colors.borders.length}</span></div>
        <div class="swatches">${result.colors.borders.map(colorSwatch).join("") || emptyState("none")}</div>
      </div>
    </div>` : emptyState("No colors detected");

  /* ── TYPOGRAPHY ──────────────────────────────────────── */
  const typBody = `
    <div class="typ-grid">
      <div class="card-block">
        <div class="block-label">Font Families</div>
        ${result.typography.fontFamilies.length
          ? result.typography.fontFamilies.map(f => `
            <div class="font-row reveal">
              <span class="font-tag">${f.split(",")[0].replace(/['"]/g, "").trim()}</span>
              <span class="font-preview" style="font-family:${f}">Aa Bb Cc 123</span>
            </div>`).join("")
          : emptyState("None")}
      </div>
      <div class="card-block">
        <div class="block-label">Size Scale</div>
        <div class="size-ladder">
          ${result.typography.fontSizes.map(s => `
            <div class="size-rung reveal">
              <span class="size-tag">${s}</span>
              <span class="size-glyph" style="font-size:clamp(10px,${s},52px);line-height:1">Aa</span>
            </div>`).join("") || emptyState("None")}
        </div>
      </div>
    </div>
    <div class="pills-row">
      <div class="pill-group"><span class="pill-label">Weights</span><div class="pills">${result.typography.fontWeights.map(w => `<span class="pill" style="font-weight:${w}">${w}</span>`).join("") || "—"}</div></div>
      <div class="pill-group"><span class="pill-label">Line Heights</span><div class="pills">${result.typography.lineHeights.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div></div>
      <div class="pill-group"><span class="pill-label">Letter Spacing</span><div class="pills">${result.typography.letterSpacings.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div></div>
    </div>`;

  /* ── SPACING ─────────────────────────────────────────── */
  const spacingBody = `
    <div class="spacing-vis">
      <div class="block-label">Spacing Scale — ${result.spacing.unique.length} unique values</div>
      <div class="sp-bars">
        ${result.spacing.unique.map(s => `
          <div class="sp-row reveal">
            <span class="sp-tag">${s}</span>
            <div class="sp-track"><div class="sp-fill" style="--w:min(${s},260px)"></div></div>
          </div>`).join("") || emptyState("None")}
      </div>
    </div>
    <div class="pills-row mt">
      <div class="pill-group"><span class="pill-label">Padding</span><div class="pills">${result.spacing.paddings.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div></div>
      <div class="pill-group"><span class="pill-label">Margin</span><div class="pills">${result.spacing.margins.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div></div>
      <div class="pill-group"><span class="pill-label">Gap</span><div class="pills">${result.spacing.gaps.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div></div>
    </div>`;

  /* ── BORDERS ─────────────────────────────────────────── */
  const bordersBody = `
    <div class="borders-grid">
      <div class="card-block">
        <div class="block-label">Border Radius</div>
        <div class="radius-row">
          ${result.borders.radii.map(r => `
            <div class="radius-chip reveal">
              <div class="radius-box" style="border-radius:${r}"></div>
              <span class="radius-val">${r}</span>
            </div>`).join("") || emptyState("None")}
        </div>
      </div>
      <div class="card-block">
        <div class="block-label">Border Widths</div>
        ${result.borders.widths.map(w => `
          <div class="bw-row reveal" style="--bw:${w}">
            <div class="bw-line"></div>
            <span class="bw-val">${w}</span>
          </div>`).join("") || emptyState("None")}
        <div class="block-label mt">Border Styles</div>
        <div class="pills">${result.borders.styles.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div>
      </div>
    </div>`;

  /* ── SHADOWS ─────────────────────────────────────────── */
  const shadowsBody = `
    <div class="shadows-grid">
      <div class="card-block">
        <div class="block-label">Box Shadows — ${result.shadows.boxShadows.length}</div>
        ${result.shadows.boxShadows.map(s => `
          <div class="shadow-item reveal">
            <div class="shadow-ball" style="box-shadow:${s}"></div>
            <code class="shadow-val">${s}</code>
          </div>`).join("") || emptyState("None")}
      </div>
      <div class="card-block">
        <div class="block-label">Text Shadows — ${result.shadows.textShadows.length}</div>
        ${result.shadows.textShadows.map(s => `
          <div class="shadow-item reveal">
            <span class="tshadow-demo" style="text-shadow:${s}">figsniff</span>
            <code class="shadow-val">${s}</code>
          </div>`).join("") || emptyState("None")}
      </div>
    </div>`;

  /* ── LAYOUT ──────────────────────────────────────────── */
  const layoutBody = `
    <div class="layout-grid">
      <div class="card-block">
        <div class="block-label">Breakpoints — ${result.layout.breakpoints.length}</div>
        ${result.layout.breakpoints.length
          ? result.layout.breakpoints.map(bp => `
            <div class="bp-row reveal">
              <span class="bp-pill bp-${bp.type.replace("-", "")}">${bp.type}</span>
              <span class="bp-val">${bp.value}</span>
              <div class="bp-bar" style="--bpw:clamp(20px, calc(${bp.value.replace(/[^\d.]/g, "")}px / 15), 180px)"></div>
            </div>`).join("")
          : emptyState("None")}
      </div>
      <div class="card-block">
        <div class="block-label">Layout Stats</div>
        <div class="stat-tiles">
          <div class="stat-tile"><span class="st-val">${result.layout.flexUsage}</span><span class="st-key">flex</span></div>
          <div class="stat-tile"><span class="st-val">${result.layout.gridUsage}</span><span class="st-key">grid</span></div>
          <div class="stat-tile"><span class="st-val">${result.layout.breakpoints.length}</span><span class="st-key">breakpoints</span></div>
          <div class="stat-tile"><span class="st-val">${result.layout.containerWidths.length}</span><span class="st-key">containers</span></div>
        </div>
        ${result.layout.containerWidths.length ? `
          <div class="block-label mt">Container Widths</div>
          <div class="pills">${result.layout.containerWidths.map(v => `<span class="pill">${v}</span>`).join("")}</div>` : ""}
      </div>
    </div>`;

  /* ── COMPONENTS ──────────────────────────────────────── */
  const compsBody = `
    ${[
      ["Buttons", result.components.buttons, "Button"],
      ["Inputs", result.components.inputs, "Input"],
      ["Cards", result.components.cards, "Card"],
      ["Navigation", result.components.navbars, "Nav"],
      ["Badges", result.components.badges, "Badge"],
    ].map(([label, items, fallback]) => `
      <div class="comp-section">
        <div class="block-label">${label} <span class="group-count">${(items as ComponentInfo[]).length}</span></div>
        <div class="comp-grid">${(items as ComponentInfo[]).map(c => componentCard(c, fallback as string)).join("") || emptyState("None detected")}</div>
      </div>`).join("")}`;

  /* ── ANIMATIONS ──────────────────────────────────────── */
  const animBody = `
    <div class="anim-grid">
      <div class="card-block">
        <div class="block-label">Transitions — ${result.animations.transitions.length}</div>
        ${result.animations.transitions.map(t => `<code class="anim-code reveal">${t}</code>`).join("") || emptyState("None")}
        <div class="block-label mt">Durations</div>
        <div class="pills">${result.animations.durations.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div>
        <div class="block-label mt">Easings</div>
        <div class="pills">${result.animations.easings.map(v => `<span class="pill">${v}</span>`).join("") || "—"}</div>
      </div>
      <div class="card-block">
        <div class="block-label">Keyframes — ${result.animations.keyframes.length}</div>
        <div class="pills">${result.animations.keyframes.map(v => `<span class="pill pill-kf">${v}</span>`).join("") || emptyState("None").replace("◌ ", "")}</div>
        <div class="block-label mt">Transforms</div>
        ${result.animations.transforms.map(t => `<code class="anim-code reveal">${t}</code>`).join("") || emptyState("None")}
      </div>
    </div>`;

  /* ── LIBRARIES ───────────────────────────────────────── */
  const libsBody = result.libraries.length
    ? `<div class="libs-grid">${result.libraries.map(libCard).join("")}</div>`
    : emptyState("No libraries detected");

  /* ── ICONS ───────────────────────────────────────────── */
  const iconsBody = result.icons.length
    ? `<div class="icons-row">
        ${result.icons.map(ic => `
          <div class="icon-card reveal">
            <div class="icon-count">${ic.count}</div>
            <div class="icon-type">${ic.type}</div>
            ${ic.library ? `<div class="icon-lib">${ic.library}</div>` : ""}
          </div>`).join("")}
      </div>`
    : emptyState("No icon sets detected");

  /* ── NAV ─────────────────────────────────────────────── */
  const navItems = [
    ["colors",     "🎨", "Colors"],
    ["typography", "✏️", "Typography"],
    ["spacing",    "📏", "Spacing"],
    ["borders",    "⬡",  "Borders"],
    ["shadows",    "☁",  "Shadows"],
    ["layout",     "⊞",  "Layout"],
    ["components", "◈",  "Components"],
    ["animations", "◎",  "Animations"],
    ["libraries",  "◇",  "Libraries"],
    ["icons",      "◉",  "Icons"],
  ];

  /* ── HERO STATS ──────────────────────────────────────── */
  const heroStats = [
    [result.colors.palette.length, "colors"],
    [result.typography.fontFamilies.length, "fonts"],
    [result.spacing.unique.length, "spacing"],
    [result.libraries.length, "libraries"],
    [result.components.buttons.length + result.components.inputs.length + result.components.cards.length, "components"],
    [result.layout.breakpoints.length, "breakpoints"],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>figsniff — ${result.title || result.url}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

    :root{
      --bg:          #060608;
      --bg1:         #0d0d12;
      --bg2:         #12121a;
      --bg3:         #18182280;
      --border:      rgba(255,255,255,0.06);
      --border2:     rgba(255,255,255,0.1);
      --text:        #f0f0ff;
      --text2:       #8888aa;
      --text3:       #44445a;
      --a:           #7c6aff;
      --a2:          #a78bfa;
      --a3:          #4c3aff30;
      --ag:          linear-gradient(135deg,#7c6aff,#c084fc);
      --green:       #22c55e;
      --yellow:      #f59e0b;
      --cyan:        #22d3ee;
      --r:           12px;
      --r2:          8px;
      --mono:        'JetBrains Mono',monospace;
      --sans:        'Inter',-apple-system,sans-serif;
      --glow:        0 0 40px rgba(124,106,255,0.15);
    }

    html { scroll-behavior: smooth; }

    body{
      background:var(--bg);
      color:var(--text);
      font-family:var(--sans);
      display:flex;
      min-height:100vh;
      overflow-x:hidden;
    }

    /* ─── NOISE LAYER ────────────────────────────────── */
    body::before{
      content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      opacity:0.4;
    }

    /* ─── SIDEBAR ────────────────────────────────────── */
    .sidebar{
      width:230px;flex-shrink:0;
      position:sticky;top:0;height:100vh;
      background:var(--bg1);
      border-right:1px solid var(--border);
      display:flex;flex-direction:column;
      z-index:10;
      backdrop-filter:blur(20px);
    }

    .brand{
      padding:24px 20px 16px;
      border-bottom:1px solid var(--border);
    }
    .brand-logo{
      display:flex;align-items:center;gap:8px;
      margin-bottom:8px;
    }
    .brand-icon{
      width:28px;height:28px;border-radius:8px;
      background:var(--ag);
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;color:#fff;
      flex-shrink:0;
      box-shadow:0 0 16px rgba(124,106,255,0.4);
    }
    .brand-name{
      font-size:16px;font-weight:700;letter-spacing:-0.02em;
      background:var(--ag);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
    }
    .brand-url{
      font-size:10px;color:var(--text3);
      font-family:var(--mono);
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    }

    .nav{padding:12px 10px;flex:1;overflow-y:auto;}
    .nav-item{
      display:flex;align-items:center;gap:9px;
      padding:7px 10px;border-radius:8px;
      color:var(--text2);text-decoration:none;
      font-size:13px;font-weight:500;
      transition:all 0.18s cubic-bezier(.4,0,.2,1);
      cursor:pointer;position:relative;
    }
    .nav-item .ni{font-size:14px;opacity:0.7;width:18px;text-align:center;}
    .nav-item:hover{background:rgba(124,106,255,0.08);color:var(--text);}
    .nav-item.active{
      background:rgba(124,106,255,0.14);
      color:var(--a2);
    }
    .nav-item.active::before{
      content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
      width:3px;height:60%;background:var(--ag);border-radius:0 2px 2px 0;
    }
    .nav-item.active .ni{opacity:1;}

    .sidebar-footer{
      padding:14px 16px;
      border-top:1px solid var(--border);
      font-family:var(--mono);font-size:10px;color:var(--text3);
    }
    .sidebar-footer div{margin-bottom:3px;}
    .sidebar-footer span{color:var(--text2);}

    /* ─── MAIN ───────────────────────────────────────── */
    .main{
      flex:1;overflow-y:auto;
      padding:40px 48px;
      position:relative;z-index:1;
    }

    /* ─── HERO HEADER ────────────────────────────────── */
    .hero{
      margin-bottom:48px;
      animation: fadeUp 0.6s ease both;
    }
    .hero-eyebrow{
      font-size:11px;font-weight:600;letter-spacing:0.12em;
      text-transform:uppercase;color:var(--a2);
      margin-bottom:10px;
      display:flex;align-items:center;gap:8px;
    }
    .hero-eyebrow::before{
      content:'';width:20px;height:1px;background:var(--a);
    }
    .hero-title{
      font-size:32px;font-weight:700;letter-spacing:-0.03em;
      color:var(--text);line-height:1.1;
      margin-bottom:14px;
    }
    .hero-title span{
      background:var(--ag);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
    }
    .hero-meta{
      display:flex;gap:20px;flex-wrap:wrap;
      font-size:12px;color:var(--text2);
      margin-bottom:28px;
    }
    .hero-meta-item{display:flex;align-items:center;gap:5px;}
    .hero-meta-dot{width:4px;height:4px;background:var(--text3);border-radius:50%;}

    .stat-strip{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(90px,1fr));
      gap:10px;
    }
    .stat-block{
      background:var(--bg2);
      border:1px solid var(--border);
      border-radius:var(--r);
      padding:14px 16px;
      position:relative;overflow:hidden;
      transition:border-color 0.2s,transform 0.2s;
      animation:fadeUp 0.5s ease both;
    }
    .stat-block:hover{border-color:var(--border2);transform:translateY(-2px);}
    .stat-block::after{
      content:'';position:absolute;inset:0;
      background:var(--ag);opacity:0;
      transition:opacity 0.2s;
      border-radius:inherit;
    }
    .stat-block:hover::after{opacity:0.04;}
    .sb-num{
      font-size:28px;font-weight:700;letter-spacing:-0.04em;
      background:var(--ag);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
      display:block;line-height:1;margin-bottom:4px;
    }
    .sb-label{font-size:11px;color:var(--text2);font-weight:500;}

    /* ─── SECTIONS ───────────────────────────────────── */
    .section{
      margin-bottom:64px;
      scroll-margin-top:40px;
      animation:fadeUp 0.5s ease both;
    }

    .sec-head{
      display:flex;align-items:center;gap:12px;
      margin-bottom:24px;
    }
    .sec-icon{
      width:34px;height:34px;border-radius:10px;
      background:var(--a3);border:1px solid rgba(124,106,255,0.2);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;flex-shrink:0;
    }
    .sec-title{
      font-size:17px;font-weight:650;letter-spacing:-0.02em;
      color:var(--text);
    }
    .sec-line{
      flex:1;height:1px;
      background:linear-gradient(90deg,var(--border2),transparent);
    }

    /* ─── CARDS / BLOCKS ─────────────────────────────── */
    .card-block{
      background:var(--bg2);
      border:1px solid var(--border);
      border-radius:var(--r);
      padding:20px;
    }
    .block-label{
      font-size:10px;font-weight:600;
      letter-spacing:0.1em;text-transform:uppercase;
      color:var(--text3);margin-bottom:14px;
    }
    .block-label.mt{margin-top:20px;}
    .mt{margin-top:16px;}

    /* ─── COLORS ─────────────────────────────────────── */
    .palette-hero{
      height:56px;border-radius:var(--r);
      overflow:hidden;display:flex;
      margin-bottom:24px;
      border:1px solid var(--border);
      box-shadow:var(--glow);
    }
    .ph-chip{flex:1;min-width:6px;transition:flex 0.3s;}
    .ph-chip:hover{flex:3;}

    .color-groups{display:flex;flex-direction:column;gap:20px;}
    .color-group{}
    .group-label{
      font-size:10px;font-weight:600;letter-spacing:0.1em;
      text-transform:uppercase;color:var(--text3);
      display:flex;align-items:center;gap:8px;margin-bottom:12px;
    }
    .group-count{
      color:var(--a2);
      background:var(--a3);
      border-radius:20px;padding:1px 7px;
      font-size:9px;font-weight:700;
    }

    .swatches{display:flex;flex-wrap:wrap;gap:8px;}
    .swatch{
      width:88px;border-radius:10px;
      overflow:hidden;
      border:1px solid var(--border);
      cursor:default;
      transition:transform 0.2s,box-shadow 0.2s;
    }
    .swatch:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,0.4);}
    .swatch-face{
      height:60px;padding:6px 8px;
      display:flex;flex-direction:column;justify-content:space-between;
    }
    .swatch-hex{font-family:var(--mono);font-size:9px;font-weight:600;}
    .swatch-count{font-family:var(--mono);font-size:9px;}
    .swatch-label{
      padding:5px 8px;
      background:var(--bg1);
      font-family:var(--mono);font-size:9px;
      color:var(--text2);
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    }

    /* ─── TYPOGRAPHY ─────────────────────────────────── */
    .typ-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
    @media(max-width:900px){.typ-grid{grid-template-columns:1fr;}}

    .font-row{
      display:flex;align-items:center;justify-content:space-between;
      padding:10px 14px;
      background:var(--bg3);
      border:1px solid var(--border);border-radius:8px;
      margin-bottom:6px;
      transition:border-color 0.2s;
    }
    .font-row:hover{border-color:var(--border2);}
    .font-tag{font-family:var(--mono);font-size:11px;color:var(--a2);font-weight:500;}
    .font-preview{font-size:17px;color:var(--text);opacity:0.65;}

    .size-ladder{display:flex;flex-direction:column;gap:2px;}
    .size-rung{
      display:flex;align-items:baseline;gap:12px;
      padding:4px 8px;border-radius:6px;
      transition:background 0.15s;
    }
    .size-rung:hover{background:var(--bg3);}
    .size-tag{
      font-family:var(--mono);font-size:10px;
      color:var(--text2);min-width:48px;
    }
    .size-glyph{color:var(--text);line-height:1;font-weight:500;}

    .pills-row{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
      gap:16px;
    }
    .pill-group{}
    .pill-label{
      font-size:10px;font-weight:600;letter-spacing:0.1em;
      text-transform:uppercase;color:var(--text3);
      display:block;margin-bottom:10px;
    }
    .pills{display:flex;flex-wrap:wrap;gap:6px;}
    .pill{
      padding:4px 12px;
      background:var(--bg2);
      border:1px solid var(--border);
      border-radius:20px;
      font-size:11px;font-family:var(--mono);
      color:var(--text2);
      transition:all 0.15s;
      cursor:default;
    }
    .pill:hover{border-color:var(--a);color:var(--a2);}
    .pill-kf{border-color:rgba(34,211,238,0.3);color:var(--cyan);}

    /* ─── SPACING ────────────────────────────────────── */
    .spacing-vis{margin-bottom:20px;}
    .sp-bars{display:flex;flex-direction:column;gap:4px;}
    .sp-row{
      display:flex;align-items:center;gap:12px;
      padding:4px 0;
    }
    .sp-tag{
      font-family:var(--mono);font-size:10px;
      color:var(--text2);min-width:48px;text-align:right;
    }
    .sp-track{
      flex:1;max-width:300px;
      height:6px;background:var(--bg2);
      border-radius:99px;overflow:hidden;
    }
    .sp-fill{
      height:100%;
      width:var(--w,0px);
      background:var(--ag);
      border-radius:99px;
      transform:scaleX(0);
      transform-origin:left;
      transition:transform 0.8s cubic-bezier(.4,0,.2,1);
    }
    .sp-fill.visible{transform:scaleX(1);}

    /* ─── BORDERS ────────────────────────────────────── */
    .borders-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    @media(max-width:800px){.borders-grid{grid-template-columns:1fr;}}
    .radius-row{display:flex;flex-wrap:wrap;gap:16px;}
    .radius-chip{display:flex;flex-direction:column;align-items:center;gap:8px;}
    .radius-box{
      width:44px;height:44px;
      background:var(--a3);
      border:2px solid var(--a);
      transition:transform 0.2s;
    }
    .radius-chip:hover .radius-box{transform:scale(1.1);}
    .radius-val{font-family:var(--mono);font-size:9px;color:var(--text2);}
    .bw-row{
      display:flex;align-items:center;gap:10px;
      margin-bottom:8px;
    }
    .bw-line{
      flex:1;max-width:80px;
      height:var(--bw,1px);
      background:linear-gradient(90deg,var(--a),var(--cyan));
      border-radius:99px;
    }
    .bw-val{font-family:var(--mono);font-size:11px;color:var(--text2);}

    /* ─── SHADOWS ────────────────────────────────────── */
    .shadows-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    @media(max-width:800px){.shadows-grid{grid-template-columns:1fr;}}
    .shadow-item{
      display:flex;align-items:center;gap:14px;
      margin-bottom:14px;
    }
    .shadow-ball{
      width:40px;height:40px;flex-shrink:0;
      border-radius:10px;
      background:var(--bg2);
    }
    .tshadow-demo{
      font-size:18px;font-weight:700;
      color:var(--text);flex-shrink:0;
    }
    .shadow-val{
      font-family:var(--mono);font-size:10px;
      color:var(--text2);
      background:var(--bg3);
      border:1px solid var(--border);
      padding:5px 9px;border-radius:6px;
      word-break:break-all;
      line-height:1.5;
    }

    /* ─── LAYOUT ─────────────────────────────────────── */
    .layout-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    @media(max-width:800px){.layout-grid{grid-template-columns:1fr;}}
    .bp-row{
      display:flex;align-items:center;gap:10px;
      padding:6px 0;border-bottom:1px solid var(--border);
    }
    .bp-pill{
      font-size:9px;font-weight:600;font-family:var(--mono);
      padding:2px 8px;border-radius:20px;
      flex-shrink:0;
    }
    .bp-minwidth{background:rgba(34,197,94,0.15);color:#4ade80;}
    .bp-maxwidth{background:rgba(239,68,68,0.15);color:#f87171;}
    .bp-other{background:rgba(34,211,238,0.15);color:var(--cyan);}
    .bp-val{font-family:var(--mono);font-size:12px;color:var(--text);}
    .bp-bar{
      margin-left:auto;height:3px;
      width:var(--bpw,40px);
      background:var(--ag);border-radius:99px;opacity:0.5;
    }

    .stat-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
    .stat-tile{
      background:var(--bg3);
      border:1px solid var(--border);border-radius:8px;
      padding:12px;text-align:center;
    }
    .st-val{
      display:block;
      font-size:22px;font-weight:700;letter-spacing:-0.03em;
      background:var(--ag);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
      line-height:1;margin-bottom:3px;
    }
    .st-key{font-size:10px;color:var(--text2);}

    /* ─── COMPONENTS ─────────────────────────────────── */
    .comp-section{margin-bottom:24px;}
    .comp-grid{
      display:grid;
      grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
      gap:10px;
    }
    .comp-card{
      background:var(--bg2);
      border:1px solid var(--border);
      border-radius:var(--r);
      overflow:hidden;
      transition:border-color 0.2s,transform 0.2s;
    }
    .comp-card:hover{border-color:var(--border2);transform:translateY(-2px);}
    .comp-head{
      padding:9px 12px;
      border-bottom:1px solid var(--border);
      display:flex;flex-wrap:wrap;gap:5px;align-items:center;
    }
    .comp-tag{font-family:var(--mono);font-size:11px;color:var(--a2);}
    .chip{
      font-size:9px;font-weight:600;
      padding:2px 7px;border-radius:20px;
    }
    .chip-role{background:rgba(124,106,255,0.2);color:var(--a2);}
    .chip-class{
      font-family:var(--mono);
      background:var(--bg3);color:var(--text2);
      max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    }
    .comp-stage{
      padding:16px;
      background:#07070e;
      display:flex;align-items:center;justify-content:center;
      min-height:60px;
      border-bottom:1px solid var(--border);
    }
    .ptable{width:100%;border-collapse:collapse;font-size:10px;}
    .ptable tr:hover{background:var(--bg3);}
    .pk{
      padding:4px 12px;color:var(--text2);
      font-family:var(--mono);font-size:9px;
      width:44%;border-bottom:1px solid var(--border);
    }
    .pv{
      padding:4px 12px;color:var(--text);
      font-family:var(--mono);font-size:9px;
      border-bottom:1px solid var(--border);word-break:break-all;
    }

    /* ─── ANIMATIONS ─────────────────────────────────── */
    .anim-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    @media(max-width:800px){.anim-grid{grid-template-columns:1fr;}}
    .anim-code{
      display:block;
      font-family:var(--mono);font-size:10px;color:var(--cyan);
      background:rgba(34,211,238,0.05);
      border:1px solid rgba(34,211,238,0.12);
      padding:6px 10px;border-radius:6px;margin-bottom:5px;
      word-break:break-all;line-height:1.5;
    }

    /* ─── LIBRARIES ──────────────────────────────────── */
    .libs-grid{
      display:grid;
      grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
      gap:10px;
    }
    .lib-card{
      background:var(--bg2);
      border:1px solid var(--border);
      border-radius:var(--r);
      padding:14px 16px;
      display:flex;flex-direction:column;gap:8px;
      transition:border-color 0.2s,transform 0.2s;
    }
    .lib-card:hover{border-color:var(--border2);transform:translateY(-2px);}
    .lib-body{display:flex;align-items:center;justify-content:space-between;}
    .lib-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
    .lib-name{font-size:13px;font-weight:600;color:var(--text);}
    .lib-conf{font-size:10px;font-weight:600;font-family:var(--mono);}
    .lib-ev{font-size:10px;color:var(--text2);line-height:1.5;}

    /* ─── ICONS ──────────────────────────────────────── */
    .icons-row{display:flex;flex-wrap:wrap;gap:12px;}
    .icon-card{
      background:var(--bg2);
      border:1px solid var(--border);
      border-radius:var(--r);
      padding:16px 20px;
      min-width:130px;
      transition:border-color 0.2s,transform 0.2s;
    }
    .icon-card:hover{border-color:var(--border2);transform:translateY(-2px);}
    .icon-count{
      font-size:32px;font-weight:700;letter-spacing:-0.04em;
      background:var(--ag);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
      line-height:1;margin-bottom:4px;
    }
    .icon-type{font-family:var(--mono);font-size:11px;color:var(--text2);font-weight:500;}
    .icon-lib{font-size:10px;color:var(--a2);margin-top:2px;}

    /* ─── EMPTY STATE ────────────────────────────────── */
    .empty-state{
      display:flex;align-items:center;gap:8px;
      color:var(--text3);font-size:12px;
      padding:12px 0;
    }
    .empty-icon{font-size:18px;opacity:0.4;}

    /* ─── REVEAL ANIMATION ───────────────────────────── */
    .reveal{
      opacity:0;
      transform:translateY(12px);
      transition:opacity 0.5s ease,transform 0.5s ease;
    }
    .reveal.visible{opacity:1;transform:translateY(0);}

    /* ─── GLOBAL KEYFRAMES ───────────────────────────── */
    @keyframes fadeUp{
      from{opacity:0;transform:translateY(16px);}
      to{opacity:1;transform:translateY(0);}
    }
    @keyframes pulse{
      0%,100%{opacity:1;}50%{opacity:0.4;}
    }
    @keyframes scanline{
      0%{transform:translateY(-100%);}
      100%{transform:translateY(100vh);}
    }

    /* ─── SCROLLBAR ──────────────────────────────────── */
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}

    /* ─── MOBILE ─────────────────────────────────────── */
    @media(max-width:768px){
      .sidebar{display:none;}
      .main{padding:20px;}
      .hero-title{font-size:22px;}
    }
  </style>
</head>
<body>

  <!-- scanline effect -->
  <div style="position:fixed;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(124,106,255,0.4),transparent);z-index:999;animation:scanline 8s linear infinite;pointer-events:none;"></div>

  <aside class="sidebar">
    <div class="brand">
      <div class="brand-logo">
        <div class="brand-icon">fs</div>
        <span class="brand-name">figsniff</span>
      </div>
      <div class="brand-url">${result.url}</div>
    </div>
    <nav class="nav">
      ${navItems.map(([id, icon, label]) =>
        `<a class="nav-item" href="#${id}"><span class="ni">${icon}</span>${label}</a>`
      ).join("\n      ")}
    </nav>
    <div class="sidebar-footer">
      <div><span>${result.meta.stylesheetCount}</span> stylesheets</div>
      <div><span>${result.meta.ruleCount.toLocaleString()}</span> CSS rules</div>
      <div><span>${result.meta.elementCount.toLocaleString()}</span> elements</div>
      <div><span>${Math.round(result.durationMs / 1000)}s</span> scan time</div>
    </div>
  </aside>

  <main class="main">
    <header class="hero">
      <div class="hero-eyebrow">design system extracted</div>
      <h1 class="hero-title"><span>${result.title || "Untitled"}</span></h1>
      <div class="hero-meta">
        <span class="hero-meta-item">${result.url}</span>
        <span class="hero-meta-item"><div class="hero-meta-dot"></div>${new Date(result.scannedAt).toLocaleDateString("en", { year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit" })}</span>
        <span class="hero-meta-item"><div class="hero-meta-dot"></div>${result.durationMs}ms</span>
      </div>
      <div class="stat-strip">
        ${heroStats.map(([n, l], i) => `
          <div class="stat-block" style="animation-delay:${i * 0.06}s">
            <span class="sb-num">${n}</span>
            <span class="sb-label">${l}</span>
          </div>`).join("")}
      </div>
    </header>

    ${sectionWrap("colors",     "🎨", "Colors",               colorsBody)}
    ${sectionWrap("typography", "✏️", "Typography",           typBody)}
    ${sectionWrap("spacing",    "📏", "Spacing",              spacingBody)}
    ${sectionWrap("borders",    "⬡",  "Borders",             bordersBody)}
    ${sectionWrap("shadows",    "☁",  "Shadows",             shadowsBody)}
    ${sectionWrap("layout",     "⊞",  "Layout",              layoutBody)}
    ${sectionWrap("components", "◈",  "Components",          compsBody)}
    ${sectionWrap("animations", "◎",  "Animations",          animBody)}
    ${sectionWrap("libraries",  "◇",  "Libraries & Frameworks", libsBody)}
    ${sectionWrap("icons",      "◉",  "Icons",               iconsBody)}
  </main>

  <script>
    // ── Reveal on scroll ──────────────────────────────
    const reveals = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 40);
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach(el => revealObs.observe(el));

    // ── Spacing bar animate ───────────────────────────
    const spFills = document.querySelectorAll('.sp-fill');
    const spObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          spObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    spFills.forEach(el => spObs.observe(el));

    // ── Active nav ────────────────────────────────────
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-item');
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navItems.forEach(n => n.classList.remove('active'));
          const a = document.querySelector('.nav-item[href="#' + e.target.id + '"]');
          if (a) a.classList.add('active');
        }
      });
    }, { threshold: 0.25, rootMargin: '-80px 0px -60% 0px' });
    sections.forEach(s => navObs.observe(s));

    // ── Section stagger on load ───────────────────────
    document.querySelectorAll('.section').forEach((s, i) => {
      (s as HTMLElement).style.animationDelay = (i * 0.07) + 's';
    });

    // ── Stat counter animation ────────────────────────
    document.querySelectorAll('.sb-num').forEach(el => {
      const target = parseInt(el.textContent || '0', 10);
      if (isNaN(target) || target === 0) return;
      let current = 0;
      const step = Math.max(1, Math.floor(target / 20));
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toString();
        if (current >= target) clearInterval(timer);
      }, 40);
    });

    // ── Palette chip hover expand ─────────────────────
    document.querySelectorAll('.ph-chip').forEach(chip => {
      chip.addEventListener('mouseenter', () => {
        document.querySelectorAll('.ph-chip').forEach(c => (c as HTMLElement).style.flex = '1');
        (chip as HTMLElement).style.flex = '4';
      });
      chip.addEventListener('mouseleave', () => {
        document.querySelectorAll('.ph-chip').forEach(c => (c as HTMLElement).style.flex = '1');
      });
    });
  </script>
</body>
</html>`;
}
