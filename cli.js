#!/usr/bin/env node

/**
 * MDF CLI - Markdown to PDF Converter
 * Fast, offline, publication-grade Markdown to PDF conversion using Headless Chromium / Edge.
 *
 * Usage:
 *   node cli.js <input.md> [output.pdf] [options]
 *
 * Options:
 *   --theme <name>     Theme: modern (default), academic, executive, editorial, minimalist
 *   --size <paper>     Paper size: a4 (default), letter, legal, a5, a3
 *   --landscape        Use landscape orientation
 *   --margins <type>   Margins: normal (default, 20mm), compact (12mm), spacious (28mm)
 *   --open             Open the generated PDF immediately
 *   --help, -h         Show help message
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// CLI Argument Parsing
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

let inputFile = null;
let outputFile = null;
let theme = 'modern';
let paperSize = 'a4';
let orientation = 'portrait';
let margins = 'normal';
let openAfter = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--theme' && args[i + 1]) {
    theme = args[++i].toLowerCase();
  } else if (arg === '--size' && args[i + 1]) {
    paperSize = args[++i].toLowerCase();
  } else if (arg === '--orientation' && args[i + 1]) {
    orientation = args[++i].toLowerCase();
  } else if (arg === '--landscape') {
    orientation = 'landscape';
  } else if (arg === '--margins' && args[i + 1]) {
    margins = args[++i].toLowerCase();
  } else if (arg === '--open') {
    openAfter = true;
  } else if (!arg.startsWith('-')) {
    if (!inputFile) {
      inputFile = arg;
    } else if (!outputFile) {
      outputFile = arg;
    }
  }
}

if (!inputFile) {
  console.error('\x1b[31mError: Missing input markdown file.\x1b[0m');
  printHelp();
  process.exit(1);
}

const inputAbs = path.resolve(inputFile);
if (!fs.existsSync(inputAbs)) {
  console.error(`\x1b[31mError: File not found: ${inputAbs}\x1b[0m`);
  process.exit(1);
}

if (!outputFile) {
  const parsed = path.parse(inputAbs);
  outputFile = path.join(parsed.dir, `${parsed.name}.pdf`);
}
const outputAbs = path.resolve(outputFile);

function printHelp() {
  console.log(`
\x1b[1m\x1b[34mMDF Studio\x1b[0m - Markdown to PDF Converter CLI

\x1b[1mUsage:\x1b[0m
  node cli.js <input.md> [output.pdf] [options]

\x1b[1mOptions:\x1b[0m
  \x1b[33m--theme <name>\x1b[0m     Design theme: \x1b[32mmodern\x1b[0m (default), \x1b[32macademic\x1b[0m, \x1b[32mexecutive\x1b[0m, \x1b[32meditorial\x1b[0m, \x1b[32mminimalist\x1b[0m, \x1b[32mnordic\x1b[0m, \x1b[32mcyberpunk\x1b[0m, \x1b[32mbotanical\x1b[0m, \x1b[32mretro\x1b[0m, \x1b[32mlegal\x1b[0m, \x1b[32mcreative\x1b[0m
  \x1b[33m--size <paper>\x1b[0m     Paper size: \x1b[32ma4\x1b[0m (default), \x1b[32mletter\x1b[0m, \x1b[32mlegal\x1b[0m, \x1b[32ma5\x1b[0m, \x1b[32ma3\x1b[0m
  \x1b[33m--landscape\x1b[0m        Landscape page orientation
  \x1b[33m--margins <type>\x1b[0m   Margins: \x1b[32mnormal\x1b[0m (default), \x1b[32mcompact\x1b[0m, \x1b[32mspacious\x1b[0m
  \x1b[33m--open\x1b[0m             Open PDF immediately after creation
  \x1b[33m--help, -h\x1b[0m         Show this help guide

\x1b[1mExamples:\x1b[0m
  node cli.js document.md
  node cli.js paper.md research.pdf --theme academic --size a4
  node cli.js report.md proposal.pdf --theme executive --landscape
  node cli.js notes.md --open
`);
}

// Locate Headless Browser
function findBrowser() {
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (isWindows) {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const edgePath64 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
    
    if (fs.existsSync(edgePath)) return edgePath;
    if (fs.existsSync(chromePath)) return chromePath;
    if (fs.existsSync(edgePath64)) return edgePath64;
  } else if (isMac) {
    const chromeMac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const edgeMac = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
    if (fs.existsSync(chromeMac)) return chromeMac;
    if (fs.existsSync(edgeMac)) return edgeMac;
  } else {
    // Linux
    const candidates = ['google-chrome', 'chromium-browser', 'chromium', 'google-chrome-stable'];
    for (const c of candidates) {
      const which = spawnSync('which', [c]);
      if (which.status === 0) return c;
    }
  }

  // Fallback to CHROME_PATH environment variable if set
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  return null;
}

async function convert() {
  const startTime = Date.now();
  console.log(`\x1b[34m[MDF]\x1b[0m Reading \x1b[1m${path.basename(inputAbs)}\x1b[0m...`);

  const browserPath = findBrowser();
  if (!browserPath) {
    console.error('\x1b[31mError: Could not locate Chrome or Edge for headless PDF rendering.\x1b[0m');
    console.error('Please install Google Chrome or Microsoft Edge.');
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(inputAbs, 'utf8');

  // Load marked and KaTeX from vendor
  const appRoot = __dirname;
  const markedPath = path.join(appRoot, 'vendor', 'marked.min.js');
  const katexPath = path.join(appRoot, 'vendor', 'katex.min.js');
  const prismPath = path.join(appRoot, 'vendor', 'prism.min.js');

  const marked = require(markedPath);
  let katex = null;
  try {
    katex = require(katexPath);
  } catch (e) {}

  let Prism = null;
  try {
    Prism = require(prismPath);
  } catch (e) {}

  // Setup renderer
  const renderer = new marked.Renderer();
  renderer.code = function (codeText, infostring) {
    let code = typeof codeText === 'object' ? codeText.text : codeText;
    let lang = typeof codeText === 'object' ? codeText.lang : infostring;
    lang = (lang || '').trim().toLowerCase();

    if (lang === 'mermaid') {
      return `<div class="mermaid">${escapeHtml(code)}</div>`;
    }

    if (lang === 'math' || lang === 'latex') {
      if (katex) {
        try {
          return `<div class="math-block">${katex.renderToString(code, { displayMode: true, throwOnError: false })}</div>`;
        } catch (e) {}
      }
      return `<div class="math-block">$$${escapeHtml(code)}$$</div>`;
    }

    let highlighted = escapeHtml(code);
    let langClass = 'language-none';

    if (Prism && Prism.languages[lang]) {
      try {
        highlighted = Prism.highlight(code, Prism.languages[lang], lang);
        langClass = `language-${lang}`;
      } catch (e) {}
    }

    return `<pre class="${langClass}"><code class="${langClass}">${highlighted}</code></pre>`;
  };

  marked.setOptions({ renderer: renderer, gfm: true });

  // Process custom page break markers
  let processed = markdownContent.replace(/^---page-break---$/gm, '<div class="page-break"></div>');
  processed = processed.replace(/^\\newpage$/gm, '<div class="page-break"></div>');

  // Process KaTeX math formulas
  if (katex) {
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      try {
        return `<div class="math-block">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return match;
      }
    });

    processed = processed.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, formula) => {
      if (!formula.trim()) return match;
      try {
        return `${prefix}${katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })}`;
      } catch (e) {
        return match;
      }
    });
  }

  // Parse HTML
  let parsedHtml = marked.parse(processed);

  // Callouts
  parsedHtml = parsedHtml.replace(/<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)<\/blockquote>/gi, (m, type, content) => {
    const t = type.toLowerCase();
    const icons = { note: 'ℹ️', tip: '💡', important: '📌', warning: '⚠️', caution: '🛑' };
    return `<div class="callout callout-${t}"><div class="callout-header"><span>${icons[t] || '📌'}</span> <span>${type}</span></div><div class="callout-body"><p>${content.trim()}</p></div></div>`;
  });

  // Read CSS files to inline
  const previewCss = fs.readFileSync(path.join(appRoot, 'css', 'preview.css'), 'utf8');
  const themeFile = path.join(appRoot, 'css', 'themes', `${theme}.css`);
  const themeCss = fs.existsSync(themeFile) ? fs.readFileSync(themeFile, 'utf8') : '';
  const katexCss = fs.existsSync(path.join(appRoot, 'vendor', 'katex.min.css')) ? fs.readFileSync(path.join(appRoot, 'vendor', 'katex.min.css'), 'utf8') : '';
  const prismCss = fs.existsSync(path.join(appRoot, 'vendor', 'prism.min.css')) ? fs.readFileSync(path.join(appRoot, 'vendor', 'prism.min.css'), 'utf8') : '';

  // Generate complete self-contained HTML page
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(path.basename(outputAbs, '.pdf'))}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    ${previewCss}
    ${themeCss}
    ${katexCss}
    ${prismCss}

    @page {
      size: ${paperSize.toUpperCase()} ${orientation};
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
</head>
<body class="theme-${theme}">
  <div class="paper-document" data-paper-size="${paperSize}" data-orientation="${orientation}" data-margins="${margins}">
    <div class="document-content">
      ${parsedHtml}
    </div>
  </div>
  <script>
    if (window.mermaid) {
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    }
  </script>
</body>
</html>`;

  // Write temporary HTML file
  const tempHtmlPath = path.join(appRoot, `.mdf_tmp_${Date.now()}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  console.log(`\x1b[34m[MDF]\x1b[0m Rendering with theme \x1b[32m${theme}\x1b[0m (${paperSize.toUpperCase()}, ${orientation})...`);

  // Run Headless Browser to print to PDF
  const htmlUri = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
  const browserArgs = [
    '--headless',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--no-pdf-header-footer',
    '--print-to-pdf=' + outputAbs,
    htmlUri
  ];

  const result = spawnSync(browserPath, browserArgs);

  // Clean up temporary HTML file
  try { fs.unlinkSync(tempHtmlPath); } catch (e) {}

  if (!fs.existsSync(outputAbs)) {
    console.error('\x1b[31mError during PDF generation.\x1b[0m');
    if (result.stderr) console.error(result.stderr.toString());
    process.exit(1);
  }

  const stat = fs.statSync(outputAbs);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const sizeKb = (stat.size / 1024).toFixed(1);

  console.log(`\x1b[32m✔ SUCCESS:\x1b[0m Generated \x1b[1m${outputFile}\x1b[0m (${sizeKb} KB) in ${duration}s`);

  // Open PDF if requested
  if (openAfter) {
    console.log(`\x1b[34m[MDF]\x1b[0m Opening ${outputFile}...`);
    const openCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    spawnSync(openCmd, [outputAbs], { shell: true });
  }
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

convert();
