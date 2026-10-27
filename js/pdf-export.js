/**
 * MDF Studio - PDF Export & Print Engine
 * Vector Print via @media print & Direct Client-side PDF Generation via html2pdf
 */

(function (window) {
  'use strict';

  class PDFExporter {
    constructor(state) {
      this.state = state;
    }

    /**
     * Primary Export: High-Resolution Vector PDF via Browser Print
     * Generates true vector text, scalable graphics, and exact margins
     */
    exportVectorPrint() {
      const { title, paperSize, orientation, margins, customMargins } = this.state;

      // Update page title so the browser print dialog defaults to document title
      const originalTitle = document.title;
      const safeFilename = (title || 'document').trim().replace(/[/\\?%*:|"<>]/g, '-');
      document.title = safeFilename;

      // Create or update dynamic @page CSS
      let printStyleEl = document.getElementById('dynamic-print-style');
      if (!printStyleEl) {
        printStyleEl = document.createElement('style');
        printStyleEl.id = 'dynamic-print-style';
        document.head.appendChild(printStyleEl);
      }

      // Calculate margin values for @page rule
      let marginTop = '20mm';
      let marginBottom = '20mm';
      let marginLeft = '20mm';
      let marginRight = '20mm';

      if (margins === 'compact') {
        marginTop = marginBottom = '12mm';
        marginLeft = marginRight = '14mm';
      } else if (margins === 'spacious') {
        marginTop = marginBottom = marginLeft = marginRight = '28mm';
      } else if (margins === 'custom' && customMargins) {
        marginTop = customMargins.top || '20mm';
        marginBottom = customMargins.bottom || '20mm';
        marginLeft = customMargins.left || '20mm';
        marginRight = customMargins.right || '20mm';
      }

      // Sizing syntax for @page
      const pageSizeRule = `${paperSize.toUpperCase()} ${orientation}`;

      printStyleEl.innerHTML = `
        @media print {
          @page {
            size: ${pageSizeRule};
            margin: 0;
          }
          .document-content {
            padding-top: ${marginTop} !important;
            padding-bottom: ${marginBottom} !important;
            padding-left: ${marginLeft} !important;
            padding-right: ${marginRight} !important;
          }
        }
      `;

      // Trigger browser print
      window.print();

      // Restore document title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }

    /**
     * Secondary Export: Direct 1-Click PDF Download via html2pdf.js
     */
    async downloadDirectPDF(targetElement, onProgress) {
      if (!window.html2pdf) {
        alert('PDF generator library is loading, please try again in a moment.');
        return;
      }

      const { title, paperSize, orientation, margins } = this.state;
      const safeFilename = (title || 'document').trim().replace(/[/\\?%*:|"<>]/g, '-') + '.pdf';

      let marginMm = 15;
      if (margins === 'compact') marginMm = 10;
      if (margins === 'spacious') marginMm = 24;

      const opt = {
        margin: [marginMm, marginMm, marginMm, marginMm],
        filename: safeFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: paperSize,
          orientation: orientation
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      try {
        if (typeof onProgress === 'function') onProgress('Generating PDF...');
        await window.html2pdf().set(opt).from(targetElement).save();
        if (typeof onProgress === 'function') onProgress('Completed');
        return true;
      } catch (err) {
        console.error('html2pdf generation error:', err);
        throw err;
      }
    }

    /**
     * Export Standalone Styled HTML document
     */
    exportStandaloneHTML(renderedHtml, currentTheme) {
      const { title } = this.state;
      const safeFilename = (title || 'document').trim().replace(/[/\\?%*:|"<>]/g, '-') + '.html';

      const standalone = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(title || 'Document')}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css">
  <link rel="stylesheet" href="css/themes/${currentTheme}.css">
  <link rel="stylesheet" href="css/preview.css">
  <style>
    body {
      background: #f8fafc;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .paper-document {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px 50px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
  </style>
</head>
<body class="theme-${currentTheme}">
  <div class="paper-document">
    <div class="document-content">
      ${renderedHtml}
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([standalone], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    /**
     * Copy formatted HTML to clipboard
     */
    async copyHtmlToClipboard(html) {
      try {
        await navigator.clipboard.writeText(html);
        return true;
      } catch (err) {
        console.error('Failed to copy HTML to clipboard:', err);
        return false;
      }
    }
  }

  function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  window.PDFExporter = PDFExporter;

})(window);
