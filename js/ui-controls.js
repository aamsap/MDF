/**
 * MDF Studio - UI Controls & Interactivity
 * Toolbar formatting, resizer, drag-and-drop, image embedding, sync scroll, toasts
 */

(function (window) {
  'use strict';

  class UIControls {
    constructor(app) {
      this.app = app;
      this.initSplitResizer();
      this.initToolbar();
      this.initDropzoneAndPaste();
      this.initLineNumbers();
      this.initSyncScroll();
      this.initZoomControls();
      this.initKeyboardShortcuts();
    }

    /**
     * Draggable Split Resizer between Editor and Preview
     */
    initSplitResizer() {
      const resizer = document.getElementById('pane-resizer');
      const editorPane = document.getElementById('editor-pane');
      const appMain = document.getElementById('app-main');

      if (!resizer || !editorPane || !appMain) return;

      let isDragging = false;

      resizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        resizer.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const mainRect = appMain.getBoundingClientRect();
        const pointerX = e.clientX - mainRect.left;
        const totalWidth = mainRect.width;

        // Clamp between 20% and 80%
        const minW = totalWidth * 0.2;
        const maxW = totalWidth * 0.8;
        const clampedW = Math.max(minW, Math.min(maxW, pointerX));

        const percentage = (clampedW / totalWidth) * 100;
        editorPane.style.flex = `0 0 ${percentage}%`;
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          resizer.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }

    /**
     * Toolbar Formatting Helpers
     */
    initToolbar() {
      const toolbar = document.getElementById('editor-toolbar');
      const textarea = document.getElementById('markdown-input');
      if (!toolbar || !textarea) return;

      toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.tool-btn');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        if (!action) return;

        this.applyFormatAction(action, textarea);
      });
    }

    applyFormatAction(action, textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selected = text.substring(start, end);

      let replacement = '';
      let cursorOffset = 0;

      switch (action) {
        case 'h1':
          replacement = `\n# ${selected || 'Heading 1'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'h2':
          replacement = `\n## ${selected || 'Heading 2'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'h3':
          replacement = `\n### ${selected || 'Heading 3'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'bold':
          replacement = `**${selected || 'bold text'}**`;
          cursorOffset = selected ? replacement.length : 2;
          break;
        case 'italic':
          replacement = `*${selected || 'italic text'}*`;
          cursorOffset = selected ? replacement.length : 1;
          break;
        case 'strike':
          replacement = `~~${selected || 'strikethrough'}~~`;
          cursorOffset = selected ? replacement.length : 2;
          break;
        case 'quote':
          replacement = `\n> ${selected || 'Quote text'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'code':
          replacement = selected.includes('\n') 
            ? `\n\`\`\`javascript\n${selected || '// code here'}\n\`\`\`\n`
            : `\`${selected || 'code'}\``;
          cursorOffset = replacement.length;
          break;
        case 'code-block':
          replacement = `\n\`\`\`javascript\n${selected || '// Enter code here'}\n\`\`\`\n`;
          cursorOffset = replacement.length;
          break;
        case 'ul':
          replacement = `\n- ${selected || 'List item'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'ol':
          replacement = `\n1. ${selected || 'Numbered item'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'task':
          replacement = `\n- [ ] ${selected || 'Task item'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'table':
          replacement = `\n| Column 1 | Column 2 | Column 3 |\n| :--- | :---: | ---: |\n| Data A | Data B | Data C |\n| Data D | Data E | Data F |\n`;
          cursorOffset = replacement.length;
          break;
        case 'math':
          replacement = selected.includes('\n')
            ? `\n$$\n${selected || 'E = mc^2'}\n$$\n`
            : `$${selected || 'f(x) = x^2'}$`;
          cursorOffset = replacement.length;
          break;
        case 'mermaid':
          replacement = `\n\`\`\`mermaid\ngraph TD\n    A[Start] --> B{Decide}\n    B -->|Yes| C[Success]\n    B -->|No| D[Retry]\n\`\`\`\n`;
          cursorOffset = replacement.length;
          break;
        case 'callout':
          replacement = `\n> [!NOTE]\n> ${selected || 'Important context or note here.'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'page-break':
          replacement = `\n---page-break---\n`;
          cursorOffset = replacement.length;
          break;
        case 'link':
          replacement = `[${selected || 'Link text'}](https://example.com)`;
          cursorOffset = replacement.length;
          break;
        case 'image':
          replacement = `![${selected || 'Image alt'}](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800)`;
          cursorOffset = replacement.length;
          break;
        default:
          return;
      }

      textarea.value = text.substring(0, start) + replacement + text.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);

      // Trigger app update
      this.app.onMarkdownChange();
    }

    /**
     * File Drag & Drop + Image Auto-Embedding as Base64
     */
    initDropzoneAndPaste() {
      const editorPane = document.getElementById('editor-pane');
      const dropOverlay = document.getElementById('dropzone-overlay');
      const textarea = document.getElementById('markdown-input');

      if (!editorPane || !textarea) return;

      // Drag over / enter / leave
      ['dragenter', 'dragover'].forEach(name => {
        editorPane.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (dropOverlay) dropOverlay.classList.add('active');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        editorPane.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (dropOverlay) dropOverlay.classList.remove('active');
        });
      });

      // Drop handler
      editorPane.addEventListener('drop', async (e) => {
        const files = e.dataTransfer.files;
        if (!files || !files.length) return;

        const file = files[0];
        if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.markdown')) {
          const text = await file.text();
          textarea.value = text;
          // Set document title from file name
          const title = file.name.replace(/\.[^/.]+$/, '');
          this.app.setDocumentTitle(title);
          this.app.onMarkdownChange();
          this.showToast(`Imported ${file.name}`, 'success');
        } else if (file.type.startsWith('image/')) {
          await this.embedImageFile(file, textarea);
        } else {
          this.showToast('Please drop a Markdown (.md) or Image file.', 'warning');
        }
      });

      // Paste handler for images
      textarea.addEventListener('paste', async (e) => {
        const clipboardItems = e.clipboardData?.items;
        if (!clipboardItems) return;

        for (const item of clipboardItems) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              await this.embedImageFile(file, textarea);
            }
            break;
          }
        }
      });
    }

    /**
     * Read an image file as Base64 and insert directly into editor
     */
    async embedImageFile(file, textarea) {
      this.showToast('Embedding image into document...', 'success');
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'embedded-image';
        const imgMarkdown = `\n![${cleanName}](${base64Data})\n`;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + imgMarkdown + textarea.value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + imgMarkdown.length, start + imgMarkdown.length);
        this.app.onMarkdownChange();
        this.showToast('Image embedded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }

    /**
     * Line numbers column synchronizer
     */
    initLineNumbers() {
      const textarea = document.getElementById('markdown-input');
      const lineNumbersEl = document.getElementById('line-numbers');
      if (!textarea || !lineNumbersEl) return;

      const updateLines = () => {
        const lineCount = (textarea.value.match(/\n/g) || []).length + 1;
        let linesHtml = '';
        for (let i = 1; i <= lineCount; i++) {
          linesHtml += `<div>${i}</div>`;
        }
        lineNumbersEl.innerHTML = linesHtml;
      };

      textarea.addEventListener('input', updateLines);
      textarea.addEventListener('scroll', () => {
        lineNumbersEl.scrollTop = textarea.scrollTop;
      });

      updateLines();
    }

    /**
     * Synchronized Scrolling between Editor and Preview
     */
    initSyncScroll() {
      const textarea = document.getElementById('markdown-input');
      const previewStage = document.getElementById('preview-stage');
      const syncToggle = document.getElementById('sync-scroll-toggle');

      if (!textarea || !previewStage) return;

      let isSyncActive = true;
      let isScrollingEditor = false;
      let isScrollingPreview = false;

      if (syncToggle) {
        syncToggle.addEventListener('click', () => {
          isSyncActive = !isSyncActive;
          syncToggle.classList.toggle('active', isSyncActive);
          this.showToast(isSyncActive ? 'Sync Scroll Enabled' : 'Sync Scroll Disabled', 'info');
        });
      }

      textarea.addEventListener('scroll', () => {
        if (!isSyncActive || isScrollingEditor) return;
        isScrollingPreview = true;
        const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
        previewStage.scrollTop = scrollPercentage * (previewStage.scrollHeight - previewStage.clientHeight);
        setTimeout(() => { isScrollingPreview = false; }, 50);
      });

      previewStage.addEventListener('scroll', () => {
        if (!isSyncActive || isScrollingPreview) return;
        isScrollingEditor = true;
        const scrollPercentage = previewStage.scrollTop / (previewStage.scrollHeight - previewStage.clientHeight);
        textarea.scrollTop = scrollPercentage * (textarea.scrollHeight - textarea.clientHeight);
        setTimeout(() => { isScrollingEditor = false; }, 50);
      });
    }

    /**
     * Preview Zoom Controls
     */
    initZoomControls() {
      const previewScaler = document.getElementById('preview-scaler');
      const previewStage = document.getElementById('preview-stage');
      const paperDoc = document.getElementById('paper-doc');
      const zoomInBtn = document.getElementById('zoom-in-btn');
      const zoomOutBtn = document.getElementById('zoom-out-btn');
      const zoomResetBtn = document.getElementById('zoom-reset-btn');
      const zoomValEl = document.getElementById('zoom-value');

      if (!previewScaler || !zoomValEl) return;

      let scale = 1.0;

      const updateScale = (newScale) => {
        scale = Math.max(0.4, Math.min(2.0, parseFloat(newScale.toFixed(2))));
        previewScaler.style.transform = `scale(${scale})`;
        zoomValEl.textContent = `${Math.round(scale * 100)}%`;
      };

      const fitToWidth = () => {
        if (!previewStage || !paperDoc) return;
        const availableW = previewStage.clientWidth - 60;
        const paperW = paperDoc.offsetWidth || 794;
        const idealScale = Math.min(1.0, Math.max(0.4, availableW / paperW));
        updateScale(idealScale);
      };

      if (zoomInBtn) zoomInBtn.addEventListener('click', () => updateScale(scale + 0.1));
      if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => updateScale(scale - 0.1));
      if (zoomResetBtn) zoomResetBtn.addEventListener('click', fitToWidth);

      // Auto fit on load and window resize if width is small
      window.addEventListener('resize', () => {
        if (scale < 1.0) fitToWidth();
      });

      // Initial fit check after small delay
      setTimeout(fitToWidth, 300);
    }

    /**
     * Global Keyboard Shortcuts
     */
    initKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdKey = isMac ? e.metaKey : e.ctrlKey;

        // Ctrl+P / Cmd+P -> Export Vector PDF
        if (cmdKey && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          this.app.exportVectorPrint();
        }

        // Ctrl+S / Cmd+S -> Quick Save / Download PDF
        if (cmdKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          this.app.downloadDirectPDF();
        }

        // Ctrl+B / Cmd+B -> Bold
        if (cmdKey && e.key.toLowerCase() === 'b') {
          const textarea = document.getElementById('markdown-input');
          if (document.activeElement === textarea) {
            e.preventDefault();
            this.applyFormatAction('bold', textarea);
          }
        }

        // Ctrl+I / Cmd+I -> Italic
        if (cmdKey && e.key.toLowerCase() === 'i') {
          const textarea = document.getElementById('markdown-input');
          if (document.activeElement === textarea) {
            e.preventDefault();
            this.applyFormatAction('italic', textarea);
          }
        }

        // Ctrl+/ / Cmd+/ -> Show shortcuts cheat sheet
        if (cmdKey && e.key === '/') {
          e.preventDefault();
          this.app.openShortcutsModal();
        }
      });
    }

    /**
     * Calculate and display document statistics
     */
    updateStats(markdownText) {
      const statsPill = document.getElementById('doc-stats');
      if (!statsPill) return;

      const text = markdownText || '';
      const words = (text.match(/\b\w+\b/g) || []).length;
      const chars = text.length;
      const readTime = Math.ceil(words / 200); // 200 wpm
      
      // Estimated printed pages based on paper content height
      const paperDoc = document.getElementById('paper-doc');
      let estimatedPages = 1;
      if (paperDoc) {
        const docHeight = paperDoc.offsetHeight;
        // ~1050px per A4 page
        estimatedPages = Math.max(1, Math.ceil(docHeight / 1050));
      }

      statsPill.innerHTML = `
        <span><strong>${words.toLocaleString()}</strong> words</span>
        <span>•</span>
        <span><strong>${chars.toLocaleString()}</strong> chars</span>
        <span>•</span>
        <span><strong>~${readTime}</strong> min read</span>
        <span>•</span>
        <span><strong>${estimatedPages}</strong> ${estimatedPages === 1 ? 'page' : 'pages'}</span>
      `;
    }

    /**
     * Toast notification toaster
     */
    showToast(message, type = 'info') {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      let icon = 'ℹ️';
      if (type === 'success') icon = '✅';
      if (type === 'warning') icon = '⚠️';
      if (type === 'error') icon = '❌';

      toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
      }, 3000);
    }
  }

  window.UIControls = UIControls;

})(window);
