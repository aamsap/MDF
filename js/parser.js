/**
 * MDF Studio - Markdown Parser Pipeline
 * Integrates Marked, KaTeX, Prism.js, Mermaid, and GitHub Callouts
 */

(function (window) {
  'use strict';

  // Fallback if marked is loaded on window
  const marked = window.marked;

  class MarkdownParser {
    constructor() {
      this.initMermaid();
      this.initMarked();
    }

    initMermaid() {
      if (window.mermaid) {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif'
        });
      }
    }

    initMarked() {
      if (!marked) {
        console.error('Marked library not found!');
        return;
      }

      // Configure marked renderer
      const renderer = new marked.Renderer();

      // Custom Heading with Anchor IDs for Table of Contents
      renderer.heading = function (text, level, raw) {
        // Handle newer marked signature vs older
        const headingText = typeof text === 'object' ? text.text : text;
        const headingLevel = typeof text === 'object' ? text.depth : level;
        const headingRaw = typeof text === 'object' ? text.raw : (raw || headingText);

        const cleanId = headingRaw
          .toLowerCase()
          .replace(/<[^>]*>/g, '')
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');

        return `<h${headingLevel} id="${cleanId}">${headingText}</h${headingLevel}>`;
      };

      // Custom Code Block highlighting via Prism
      renderer.code = function (codeText, infostring) {
        let code = typeof codeText === 'object' ? codeText.text : codeText;
        let lang = typeof codeText === 'object' ? codeText.lang : infostring;
        lang = (lang || '').trim().toLowerCase();

        // Check if this is a Mermaid diagram
        if (lang === 'mermaid') {
          return `<div class="mermaid">${escapeHtml(code)}</div>`;
        }

        // Check if this is a display math block
        if (lang === 'math' || lang === 'latex' || lang === 'katex') {
          return renderDisplayMath(code);
        }

        let highlighted = escapeHtml(code);
        let langClass = 'language-none';

        if (window.Prism) {
          const prismLang = window.Prism.languages[lang];
          if (prismLang) {
            try {
              highlighted = window.Prism.highlight(code, prismLang, lang);
              langClass = `language-${lang}`;
            } catch (e) {
              console.warn('Prism highlight failed for:', lang, e);
            }
          }
        }

        return `<pre class="${langClass}"><code class="${langClass}">${highlighted}</code></pre>`;
      };

      // Configure marked options
      marked.setOptions({
        renderer: renderer,
        gfm: true,
        breaks: false,
        pedantic: false
      });
    }

    /**
     * Parse raw markdown string to enriched HTML
     */
    async parse(markdownText, options = {}) {
      if (!markdownText) return '';

      // 1. Process custom page breaks
      let processed = markdownText.replace(/^---page-break---$/gm, '<div class="page-break"></div>');
      processed = processed.replace(/^\\newpage$/gm, '<div class="page-break"></div>');

      // 2. Protect and render Math blocks before markdown parser
      // Replace $$ math $$ with unique placeholders
      const mathDisplayBlocks = [];
      processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
        const placeholder = `%%MATH_DISPLAY_${mathDisplayBlocks.length}%%`;
        mathDisplayBlocks.push(formula.trim());
        return placeholder;
      });

      // Replace inline $math$ (avoid currency like $5 or $10.00)
      const mathInlineBlocks = [];
      processed = processed.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, formula) => {
        // Ensure formula isn't just whitespace or empty
        if (!formula.trim()) return match;
        const placeholder = `%%MATH_INLINE_${mathInlineBlocks.length}%%`;
        mathInlineBlocks.push(formula.trim());
        return `${prefix}${placeholder}`;
      });

      // 3. Run marked parser
      let html = '';
      if (typeof marked.parse === 'function') {
        html = marked.parse(processed);
      } else {
        html = marked(processed);
      }

      // 4. Restore and render Math blocks
      html = html.replace(/%%MATH_DISPLAY_(\d+)%%/g, (match, index) => {
        const formula = mathDisplayBlocks[parseInt(index, 10)];
        return renderDisplayMath(formula);
      });

      html = html.replace(/%%MATH_INLINE_(\d+)%%/g, (match, index) => {
        const formula = mathInlineBlocks[parseInt(index, 10)];
        return renderInlineMath(formula);
      });

      // 5. Enhance Callouts / GitHub Alerts
      html = transformCallouts(html);

      // 6. Generate Table of Contents if requested or if [TOC] is present
      const hasTocTag = /\[TOC\]/i.test(markdownText) || options.includeToc;
      if (hasTocTag) {
        const tocHtml = generateTocHtml(html);
        if (/\[TOC\]/i.test(html)) {
          html = html.replace(/<p>\[TOC\]<\/p>|\[TOC\]/gi, tocHtml);
        } else if (options.includeToc) {
          html = tocHtml + html;
        }
      }

      return html;
    }

    /**
     * Render Mermaid diagrams in a DOM container
     */
    async renderMermaidInElement(container) {
      if (!window.mermaid || !container) return;

      const diagrams = container.querySelectorAll('.mermaid');
      if (!diagrams.length) return;

      // Unique id for rendering
      let idCounter = 0;
      for (const el of diagrams) {
        // Skip if already rendered
        if (el.getAttribute('data-processed')) continue;
        
        const code = el.textContent || '';
        const id = `mermaid-svg-${Date.now()}-${idCounter++}`;
        
        try {
          const { svg } = await window.mermaid.render(id, code);
          el.innerHTML = svg;
          el.setAttribute('data-processed', 'true');
        } catch (err) {
          console.warn('Mermaid rendering error:', err);
          el.innerHTML = `<div class="callout callout-warning"><strong>Diagram Error:</strong> ${escapeHtml(err.message || 'Syntax error')}</div>`;
          el.setAttribute('data-processed', 'error');
        }
      }
    }
  }

  // --- Helper Functions ---

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderInlineMath(formula) {
    if (window.katex) {
      try {
        return window.katex.renderToString(formula, { displayMode: false, throwOnError: false });
      } catch (e) {
        return `<span class="math-error">$${escapeHtml(formula)}$</span>`;
      }
    }
    return `$${escapeHtml(formula)}$`;
  }

  function renderDisplayMath(formula) {
    if (window.katex) {
      try {
        const rendered = window.katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return `<div class="math-block">${rendered}</div>`;
      } catch (e) {
        return `<div class="math-block math-error">$$${escapeHtml(formula)}$$</div>`;
      }
    }
    return `<div class="math-block">$$${escapeHtml(formula)}$$</div>`;
  }

  /**
   * Convert GitHub Alert syntax in blockquotes
   * e.g. > [!NOTE] or > [!WARNING]
   */
  function transformCallouts(html) {
    const calloutTypes = {
      'note': { title: 'Note', icon: 'ℹ️' },
      'tip': { title: 'Tip', icon: '💡' },
      'important': { title: 'Important', icon: '📌' },
      'warning': { title: 'Warning', icon: '⚠️' },
      'caution': { title: 'Caution', icon: '🛑' }
    };

    return html.replace(/<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)<\/blockquote>/gi, (match, type, content) => {
      const lowerType = type.toLowerCase();
      const meta = calloutTypes[lowerType] || { title: type, icon: '📌' };

      // Clean up leading linebreaks or spacing in content
      const cleanContent = content.trim();

      return `
        <div class="callout callout-${lowerType}">
          <div class="callout-header">
            <span>${meta.icon}</span>
            <span>${meta.title}</span>
          </div>
          <div class="callout-body">
            <p>${cleanContent}</p>
          </div>
        </div>
      `;
    });
  }

  /**
   * Generate Table of Contents from H1, H2, H3 headings
   */
  function generateTocHtml(html) {
    const headingRegex = /<h([1-3])\s+id="([^"]+)">([\s\S]+?)<\/h\1>/gi;
    let match;
    const items = [];

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1], 10);
      const id = match[2];
      const text = match[3].replace(/<[^>]*>/g, ''); // strip any nested tags
      items.push({ level, id, text });
    }

    if (items.length === 0) return '';

    let toc = `<div class="toc-container">
      <div class="toc-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        Table of Contents
      </div>
      <ul class="toc-list">`;

    items.forEach(item => {
      toc += `
        <li class="toc-item level-${item.level}">
          <a href="#${item.id}">${item.text}</a>
          <span class="toc-dots"></span>
        </li>
      `;
    });

    toc += `</ul></div>`;
    return toc;
  }

  // Export to window
  window.MarkdownParser = MarkdownParser;

})(window);
