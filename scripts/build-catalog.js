#!/usr/bin/env node
"use strict";

// No npm packages required. This runs on GitHub Actions, not in visitors' browsers.
const fs = require("node:fs");
const path = require("node:path");

const EXCLUDED = new Set(["assets", "scripts", "tests", "node_modules", "vendor", "dist", "build", "docs"]);
const MANAGED_START = "<!-- embedded:managed:start -->";
const MANAGED_END = "<!-- embedded:managed:end -->";
const GENERATED_MARKER = ".embedded-build-output";
const GENERATED_CATALOG = "assets/catalog.generated.js";

function decodeEntities(text) {
  const named = {amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " "};
  return String(text).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (full, code) => {
    if (!code.startsWith("#")) return named[code.toLowerCase()];
    const value = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)
      ? String.fromCodePoint(value) : "\ufffd";
  });
}

function attributes(tag) {
  const result = Object.create(null);
  const pattern = /([^\s=<>"'`/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>"'`=]+))/g;
  for (const match of tag.matchAll(pattern)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4]);
  }
  return result;
}

function metadata(html) {
  // Never execute uploaded HTML. Only read title and meta tags from the head.
  const head = (html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] || html.split(/<body\b/i)[0])
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const meta = Object.create(null);
  for (const match of head.matchAll(/<meta\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)) {
    const attrs = attributes(match[0]);
    if (attrs.name && typeof attrs.content === "string") meta[attrs.name.toLowerCase()] = attrs.content.trim();
  }
  const title = decodeEntities(head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] || "")
    .replace(/\s+/g, " ").trim().replace(/\s*[|｜]\s*嵌入式学习站\s*$/, "");
  return {meta, title};
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
}

function urlPath(value) { return value.split("/").map(encodeURIComponent).join("/"); }
function finiteOrder(value, fallback = 1000) {
  return value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : fallback;
}
function compare(a, b) { return a.order - b.order || a.path.localeCompare(b.path, "zh-CN", {numeric: true}); }
function safeDirectory(name) { return !name.startsWith(".") && !name.startsWith("_") && !EXCLUDED.has(name); }

function lessonFiles(dir, prefix = "") {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`不支持符号链接：${path.join(dir, entry.name)}`);
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) return [];
    const relative = prefix + entry.name;
    if (entry.isDirectory()) return EXCLUDED.has(entry.name) ? [] : lessonFiles(path.join(dir, entry.name), relative + "/");
    // Only the category's top-level index is its menu; nested index.html may be a lesson.
    return /\.html?$/i.test(entry.name) && !(prefix === "" && /^index\.html?$/i.test(entry.name)) ? [relative] : [];
  });
}

function scanCatalog(root) {
  const categories = [];
  for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
    if (!entry.isDirectory() || !safeDirectory(entry.name)) continue;
    const dir = path.join(root, entry.name);
    const configFile = path.join(dir, "category.json");
    let config = {};
    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, "utf8"));
      if (!config || Array.isArray(config) || typeof config !== "object") throw new Error(`分类配置格式错误：${configFile}`);
    }
    const files = lessonFiles(dir);
    const indexFile = path.join(dir, "index.html");
    const hasIndex = fs.existsSync(indexFile);
    if (!files.length && !hasIndex && !fs.existsSync(configFile)) continue;
    const indexMeta = hasIndex ? metadata(fs.readFileSync(indexFile, "utf8")) : {meta: {}, title: ""};
    const category = {
      id: entry.name,
      path: `${entry.name}/index.html`,
      url: urlPath(`${entry.name}/index.html`),
      title: String(config.title || indexMeta.title || entry.name),
      desc: String(config.description || indexMeta.meta.description || ""),
      icon: String(config.icon || "◇"),
      order: finiteOrder(config.order),
      lessons: []
    };
    for (const relative of files) {
      const {meta, title} = metadata(fs.readFileSync(path.join(dir, relative), "utf8"));
      if (meta["lesson-hidden"] === "true") continue;
      const rawPath = `${entry.name}/${relative}`;
      category.lessons.push({
        path: rawPath,
        url: urlPath(rawPath),
        title: meta["lesson-title"] || title || path.posix.basename(relative).replace(/\.html?$/i, ""),
        desc: meta["lesson-description"] || meta.description || "点击打开课程，或下载单个 HTML 文件。",
        order: finiteOrder(meta["lesson-order"])
      });
    }
    category.lessons.sort(compare);
    categories.push(category);
  }
  categories.sort(compare);
  categories.forEach((c, i) => { c.no = String(i + 1).padStart(2, "0"); });
  return {version: 1, categories};
}

function catalogSource(catalog) {
  const json = JSON.stringify(catalog, null, 2).replace(/[<>&\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return `// 自动生成，请运行 node scripts/build-catalog.js；不要手动编辑。\nwindow.EMBEDDED_CATALOG = ${json};\n`;
}

function managedIndex(category) {
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(category.desc)}"><title>${escapeHtml(category.title)}｜嵌入式学习站</title><link rel="stylesheet" href="../assets/style.css"><script defer src="../assets/site.js"></script></head><body data-page="${escapeHtml(category.id)}" data-root=".."><noscript>请开启 JavaScript。</noscript></body></html>\n`;
}

function isManaged(html) {
  return html.includes(MANAGED_START) || /<script\b[^>]*\bsrc\s*=\s*["'](?:\.\.\/|\.\/)?assets\/site\.js["']/i.test(html);
}

function bundlePage(html, css, js, catalogJs) {
  if (!isManaged(html)) return html; // Independent HTML keeps its own layout and interactions.
  if (!/<\/head\s*>/i.test(html)) throw new Error("站点模板缺少 </head>");
  let clean = html.replace(/<!-- embedded:managed:start -->[\s\S]*?<!-- embedded:managed:end -->\s*/g, "");
  clean = clean.replace(/<link\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi, tag => {
    return /^(?:\.\.\/|\.\/)?assets\/style\.css$/.test(attributes(tag).href || "") ? "" : tag;
  });
  clean = clean.replace(/<script\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/script\s*>/gi, tag => {
    return /^(?:\.\.\/|\.\/)?assets\/(?:site|catalog\.generated)\.js$/.test(attributes(tag.split(">")[0]).src || "") ? "" : tag;
  });
  if (/<\/style/i.test(css)) throw new Error("共享 CSS 中不能包含 </style>");
  const inlineJs = `document.addEventListener("DOMContentLoaded", () => {\n${js}\n});`.replace(/<\/script/gi, "<\\/script");
  const block = `${MANAGED_START}\n<style>\n${css}\n</style>\n<script>\n${catalogJs}\n</script>\n<script>\n${inlineJs}\n</script>\n${MANAGED_END}\n`;
  return clean.replace(/<\/head\s*>/i, () => `${block}</head>`);
}

function publicFile(name) {
  return name === ".nojekyll" || (!name.startsWith(".") && !name.startsWith("_") &&
    name !== "category.json" && !/^(?:readme|license)(?:\..*)?$/i.test(name) &&
    !/^(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|AGENTS\.md)$/.test(name));
}

function buildSite(root, sync = false) {
  root = path.resolve(root);
  const catalog = scanCatalog(root);
  const catalogJs = catalogSource(catalog);
  const css = fs.readFileSync(path.join(root, "assets/style.css"), "utf8");
  const js = fs.readFileSync(path.join(root, "assets/site.js"), "utf8");
  const output = path.join(root, "_site");
  if (fs.existsSync(output)) {
    if (!fs.existsSync(path.join(output, GENERATED_MARKER))) throw new Error("_site 已存在但不是本脚本生成的目录；请先将它移走，防止覆盖你的文件。");
    fs.rmSync(output, {recursive: true}); // Only this exact, marked build output.
  }
  fs.mkdirSync(output);
  fs.writeFileSync(path.join(output, GENERATED_MARKER), "Generated output only.\n");
  const managed = [];
  function copyPublic(dir, relative = "") {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      if (entry.isSymbolicLink()) throw new Error(`不支持符号链接：${entry.name}`);
      if (!publicFile(entry.name)) continue;
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (["scripts", "tests", "node_modules", "vendor", "dist", "build", "docs"].includes(entry.name)) continue;
        fs.mkdirSync(path.join(output, rel), {recursive: true});
        copyPublic(path.join(dir, entry.name), rel);
      } else if (/\.html?$/i.test(entry.name)) {
        const source = fs.readFileSync(path.join(root, rel), "utf8");
        const bundled = bundlePage(source, css, js, catalogJs);
        fs.writeFileSync(path.join(output, rel), bundled);
        if (isManaged(source)) managed.push(rel);
      } else {
        fs.copyFileSync(path.join(root, rel), path.join(output, rel));
      }
    }
  }
  copyPublic(root);
  for (const category of catalog.categories) {
    if (!fs.existsSync(path.join(output, category.path))) {
      fs.mkdirSync(path.dirname(path.join(output, category.path)), {recursive: true});
      fs.writeFileSync(path.join(output, category.path), bundlePage(managedIndex(category), css, js, catalogJs));
      managed.push(category.path);
    }
    for (const lesson of category.lessons) {
      if (!fs.existsSync(path.join(output, lesson.path))) throw new Error(`课程不存在于发布目录：${lesson.path}`);
    }
  }
  fs.writeFileSync(path.join(output, GENERATED_CATALOG), catalogJs);
  if (!fs.existsSync(path.join(output, "index.html"))) throw new Error("缺少首页 index.html");
  if (sync) {
    // Explicit local opt-in. CI only builds _site and never commits back to main.
    for (const file of managed) fs.copyFileSync(path.join(output, file), path.join(root, file));
    fs.writeFileSync(path.join(root, GENERATED_CATALOG), catalogJs);
  }
  return {output, catalog, managed};
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--sync")) throw new Error("用法：node scripts/build-catalog.js [--sync]");
  const {catalog, managed} = buildSite(path.resolve(__dirname, ".."), args.includes("--sync"));
  const count = catalog.categories.reduce((n, c) => n + c.lessons.length, 0);
  console.log(`已生成 _site：${catalog.categories.length} 个分类、${count} 个课程、${managed.length} 个内嵌 CSS/JS 页面。`);
}

module.exports = {metadata, scanCatalog, catalogSource, bundlePage, buildSite, isManaged};
