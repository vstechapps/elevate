import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "src","components", "theme.css");
const outputDir = path.join(root, "docs");
const outputCss = path.join(outputDir, "elevate.css");
const outputMinCss = path.join(outputDir, "elevate.min.css");
const imported = new Set();

async function inlineImports(filePath) {
  const absolutePath = path.resolve(filePath);

  if (imported.has(absolutePath)) {
    return "";
  }

  imported.add(absolutePath);

  const css = await readFile(absolutePath, "utf8");
  const importPattern = /@import\s+(?:url\()?["']([^"')]+)["']\)?\s*;/g;
  let output = "";
  let cursor = 0;

  for (const match of css.matchAll(importPattern)) {
    output += css.slice(cursor, match.index);
    output += await inlineImports(path.resolve(path.dirname(absolutePath), match[1]));
    cursor = match.index + match[0].length;
  }

  output += css.slice(cursor);
  return `\n/* ${path.relative(root, absolutePath).replaceAll("\\", "/")} */\n${output.trim()}\n`;
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\s*!important/g, "!important")
    .trim();
}

const banner = "/* Elevate Theme | https://vstechapps.github.io/elevate */\n";
const bundled = `${banner}${(await inlineImports(entry)).trim()}\n`;
const minified = `${banner}${minifyCss(bundled)}\n`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputCss, bundled);
await writeFile(outputMinCss, minified);

console.log(`Built ${path.relative(root, outputCss)} (${bundled.length.toLocaleString()} bytes)`);
console.log(`Built ${path.relative(root, outputMinCss)} (${minified.length.toLocaleString()} bytes)`);
