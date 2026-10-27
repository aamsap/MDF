/**
 * MDF Studio - Main Application Orchestrator
 * Manages state, reactive rendering, settings, storage, and export orchestration
 */

(function (window) {
  'use strict';

  class MDFStudioApp {
    constructor() {
      this.parser = new window.MarkdownParser();
      this.state = this.loadState();
      this.exporter = new window.PDFExporter(this.state);

      this.dom = {
        titleInput: document.getElementById('doc-title-input'),
        markdownInput: document.getElementById('markdown-input'),
        paperDoc: document.getElementById('paper-doc'),
        documentContent: document.getElementById('document-content'),
        documentHeader: document.getElementById('document-header'),
        documentFooter: document.getElementById('document-footer'),
        headerLeft: document.getElementById('header-left'),
        headerRight: document.getElementById('header-right'),
        footerLeft: document.getElementById('footer-left'),
        footerRight: document.getElementById('footer-right'),
        coverPageContainer: document.getElementById('cover-page-container'),
        settingsPanel: document.getElementById('settings-panel'),
        exportDropdown: document.getElementById('export-dropdown')
      };

      this.ui = new window.UIControls(this);
      this.initEvents();
      this.applyStateToUI();
      this.render();
    }

    /**
     * Default state & localStorage hydration
     */
    loadState() {
      const defaultState = {
        title: 'Comprehensive Feature Showcase',
        content: window.DOCUMENT_TEMPLATES?.showcase?.content || '# Untitled Document\n\nStart typing markdown here...',
        theme: 'modern',
        paperSize: 'a4',
        orientation: 'portrait',
        margins: 'normal',
        baseFontSize: '11pt',
        lineHeight: '1.65',
        fontFamily: 'Inter',
        textAlign: 'left',
        includeHeader: true,
        headerLeft: 'Comprehensive Feature Showcase',
        headerRight: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
        includeFooter: true,
        footerLeft: 'MDF Studio Generated',
        footerRight: 'Page 1',
        includeCoverPage: false,
        coverTitle: 'Project Documentation',
        coverSubtitle: 'Technical Overview and System Architecture',
        coverAuthor: 'Engineering Team',
        coverDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        coverStyle: 'modern',
        viewMode: 'split'
      };

      try {
        const saved = localStorage.getItem('mdf_studio_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultState, ...parsed };
        }
      } catch (e) {
        console.warn('Could not load saved state from localStorage:', e);
      }

      return defaultState;
    }

    saveState() {
      try {
        localStorage.setItem('mdf_studio_state', JSON.stringify(this.state));
      } catch (e) {
        console.warn('Could not save state to localStorage:', e);
      }
    }

    /**
     * Apply internal state to form inputs and visual toggles
     */
    applyStateToUI() {
      if (this.dom.titleInput) this.dom.titleInput.value = this.state.title;
      if (this.dom.markdownInput) this.dom.markdownInput.value = this.state.content;

      // Theme cards
      document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-theme') === this.state.theme);
      });

      // Settings dropdowns & switches
      this.setSelectValue('setting-paper-size', this.state.paperSize);
      this.setSelectValue('setting-orientation', this.state.orientation);
      this.setSelectValue('setting-margins', this.state.margins);
      this.setSelectValue('setting-font-family', this.state.fontFamily);
      this.setSelectValue('setting-text-align', this.state.textAlign);

      this.setInputValue('setting-font-size', parseInt(this.state.baseFontSize, 10) || 11);
      this.setTextValue('font-size-val', this.state.baseFontSize);

      this.setInputValue('setting-line-height', parseFloat(this.state.lineHeight) || 1.65);
      this.setTextValue('line-height-val', this.state.lineHeight);

      this.setCheckboxValue('setting-include-header', this.state.includeHeader);
      this.setInputValue('setting-header-left', this.state.headerLeft);
      this.setInputValue('setting-header-right', this.state.headerRight);

      this.setCheckboxValue('setting-include-footer', this.state.includeFooter);
      this.setInputValue('setting-footer-left', this.state.footerLeft);
      this.setInputValue('setting-footer-right', this.state.footerRight);

      this.setCheckboxValue('setting-include-cover', this.state.includeCoverPage);
      this.setInputValue('setting-cover-title', this.state.coverTitle);
      this.setInputValue('setting-cover-subtitle', this.state.coverSubtitle);
      this.setInputValue('setting-cover-author', this.state.coverAuthor);

      // Paper dataset attributes
      this.updatePaperAttributes();
    }

    setSelectValue(id, val) {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    }
    setInputValue(id, val) {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    }
    setTextValue(id, val) {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.textContent = val;
    }
    setCheckboxValue(id, val) {
      const el = document.getElementById(id);
      if (el) el.checked = !!val;
    }

    /**
     * Wire up UI interactions
     */
    initEvents() {
      // Document title change
      if (this.dom.titleInput) {
        this.dom.titleInput.addEventListener('input', (e) => {
          this.state.title = e.target.value;
          this.state.headerLeft = e.target.value;
          this.setInputValue('setting-header-left', e.target.value);
          this.updateHeadersFooters();
          this.saveState();
        });
      }

      // Markdown input typing
      if (this.dom.markdownInput) {
        let debounceTimer;
        this.dom.markdownInput.addEventListener('input', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.state.content = this.dom.markdownInput.value;
            this.render();
            this.saveState();
          }, 150);
        });
      }

      // View mode buttons (Split, Editor, Preview)
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-mode');
          this.setViewMode(mode);
        });
      });

      // Settings toggle
      const settingsToggleBtn = document.getElementById('settings-toggle-btn');
      const closePanelBtn = document.getElementById('close-panel-btn');
      if (settingsToggleBtn) {
        settingsToggleBtn.addEventListener('click', () => {
          this.dom.settingsPanel?.classList.toggle('closed');
          settingsToggleBtn.classList.toggle('active');
        });
      }
      if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
          this.dom.settingsPanel?.classList.add('closed');
          settingsToggleBtn?.classList.remove('active');
        });
      }

      // Export trigger dropdown
      const exportDropdownTrigger = document.getElementById('export-dropdown-trigger');
      if (exportDropdownTrigger && this.dom.exportDropdown) {
        exportDropdownTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dom.exportDropdown.classList.toggle('show');
        });

        window.addEventListener('click', (e) => {
          if (!this.dom.exportDropdown.contains(e.target)) {
            this.dom.exportDropdown.classList.remove('show');
          }
        });
      }

      // Export primary button -> Vector print directly
      const primaryExportBtn = document.getElementById('primary-export-btn');
      if (primaryExportBtn) {
        primaryExportBtn.addEventListener('click', () => {
          this.exportVectorPrint();
        });
      }

      // Export dropdown actions
      document.querySelectorAll('.export-action').forEach(item => {
        item.addEventListener('click', (e) => {
          const action = item.getAttribute('data-export');
          this.dom.exportDropdown?.classList.remove('show');
          this.handleExportAction(action);
        });
      });

      // Template trigger button & modal
      const templatesBtn = document.getElementById('templates-btn');
      if (templatesBtn) {
        templatesBtn.addEventListener('click', () => this.openTemplateModal());
      }

      // Import button (.md file upload)
      const importBtn = document.getElementById('import-file-btn');
      const fileInput = document.getElementById('hidden-file-input');
      if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          this.dom.markdownInput.value = text;
          this.state.content = text;
          const title = file.name.replace(/\.[^/.]+$/, '');
          this.setDocumentTitle(title);
          this.render();
          this.saveState();
          this.ui.showToast(`Imported ${file.name}`, 'success');
        });
      }

      // Wire Settings Controls
      this.initSettingsPanelEvents();
    }

    /**
     * Wire up Form Inputs inside Settings Drawer
     */
    initSettingsPanelEvents() {
      // Theme selection
      document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          const theme = card.getAttribute('data-theme');
          this.setTheme(theme);
        });
      });

      // Paper Size
      document.getElementById('setting-paper-size')?.addEventListener('change', (e) => {
        this.state.paperSize = e.target.value;
        this.updatePaperAttributes();
        this.saveState();
      });

      // Orientation
      document.getElementById('setting-orientation')?.addEventListener('change', (e) => {
        this.state.orientation = e.target.value;
        this.updatePaperAttributes();
        this.saveState();
      });

      // Margins
      document.getElementById('setting-margins')?.addEventListener('change', (e) => {
        this.state.margins = e.target.value;
        this.updatePaperAttributes();
        this.saveState();
      });

      // Font Family
      document.getElementById('setting-font-family')?.addEventListener('change', (e) => {
        this.state.fontFamily = e.target.value;
        this.updatePaperAttributes();
        this.saveState();
      });

      // Text Alignment
      document.getElementById('setting-text-align')?.addEventListener('change', (e) => {
        this.state.textAlign = e.target.value;
        if (this.dom.documentContent) {
          this.dom.documentContent.style.textAlign = e.target.value;
        }
        this.saveState();
      });

      // Font size slider
      const fontSizeSlider = document.getElementById('setting-font-size');
      fontSizeSlider?.addEventListener('input', (e) => {
        this.state.baseFontSize = `${e.target.value}pt`;
        this.setTextValue('font-size-val', `${e.target.value}pt`);
        if (this.dom.documentContent) {
          this.dom.documentContent.style.fontSize = this.state.baseFontSize;
        }
        this.saveState();
      });

      // Line height slider
      const lineHeightSlider = document.getElementById('setting-line-height');
      lineHeightSlider?.addEventListener('input', (e) => {
        this.state.lineHeight = e.target.value;
        this.setTextValue('line-height-val', e.target.value);
        if (this.dom.documentContent) {
          this.dom.documentContent.style.lineHeight = e.target.value;
        }
        this.saveState();
      });

      // Header switches & text
      document.getElementById('setting-include-header')?.addEventListener('change', (e) => {
        this.state.includeHeader = e.target.checked;
        this.updateHeadersFooters();
        this.saveState();
      });
      document.getElementById('setting-header-left')?.addEventListener('input', (e) => {
        this.state.headerLeft = e.target.value;
        this.updateHeadersFooters();
        this.saveState();
      });
      document.getElementById('setting-header-right')?.addEventListener('input', (e) => {
        this.state.headerRight = e.target.value;
        this.updateHeadersFooters();
        this.saveState();
      });

      // Footer switches & text
      document.getElementById('setting-include-footer')?.addEventListener('change', (e) => {
        this.state.includeFooter = e.target.checked;
        this.updateHeadersFooters();
        this.saveState();
      });
      document.getElementById('setting-footer-left')?.addEventListener('input', (e) => {
        this.state.footerLeft = e.target.value;
        this.updateHeadersFooters();
        this.saveState();
      });
      document.getElementById('setting-footer-right')?.addEventListener('input', (e) => {
        this.state.footerRight = e.target.value;
        this.updateHeadersFooters();
        this.saveState();
      });

      // Cover Page switches & fields
      document.getElementById('setting-include-cover')?.addEventListener('change', (e) => {
        this.state.includeCoverPage = e.target.checked;
        const coverFields = document.getElementById('cover-fields-group');
        if (coverFields) coverFields.style.display = e.target.checked ? 'flex' : 'none';
        this.renderCoverPage();
        this.saveState();
      });
      document.getElementById('setting-cover-title')?.addEventListener('input', (e) => {
        this.state.coverTitle = e.target.value;
        this.renderCoverPage();
        this.saveState();
      });
      document.getElementById('setting-cover-subtitle')?.addEventListener('input', (e) => {
        this.state.coverSubtitle = e.target.value;
        this.renderCoverPage();
        this.saveState();
      });
      document.getElementById('setting-cover-author')?.addEventListener('input', (e) => {
        this.state.coverAuthor = e.target.value;
        this.renderCoverPage();
        this.saveState();
      });
    }

    /**
     * Switch view between Split, Editor only, Preview only
     */
    setViewMode(mode) {
      this.state.viewMode = mode;
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
      });

      const editorPane = document.getElementById('editor-pane');
      const previewPane = document.getElementById('preview-pane');
      const resizer = document.getElementById('pane-resizer');

      if (!editorPane || !previewPane || !resizer) return;

      if (mode === 'editor') {
        editorPane.style.display = 'flex';
        editorPane.style.flex = '1 1 100%';
        previewPane.style.display = 'none';
        resizer.style.display = 'none';
      } else if (mode === 'preview') {
        editorPane.style.display = 'none';
        previewPane.style.display = 'flex';
        previewPane.style.flex = '1 1 100%';
        resizer.style.display = 'none';
      } else {
        editorPane.style.display = 'flex';
        editorPane.style.flex = '1 1 50%';
        previewPane.style.display = 'flex';
        previewPane.style.flex = '1 1 50%';
        resizer.style.display = 'block';
      }
    }

    setTheme(themeName) {
      this.state.theme = themeName;
      if (this.dom.paperDoc) {
        // Remove all previous theme classes
        this.dom.paperDoc.className = 'paper-document';
        this.dom.paperDoc.classList.add(`theme-${themeName}`);
      }

      // Update theme badge in preview toolbar
      const badge = document.getElementById('theme-indicator-text');
      if (badge) {
        const themeLabels = {
          modern: 'Modern Tech',
          academic: 'Academic Paper',
          executive: 'Executive Slate',
          editorial: 'Editorial Book',
          minimalist: 'Minimalist Swiss',
          nordic: 'Nordic Frost',
          cyberpunk: 'Cyber Dark',
          botanical: 'Warm Botanical',
          retro: 'Retro Typewriter',
          legal: 'Legal Brief',
          creative: 'Creative Studio'
        };
        badge.textContent = themeLabels[themeName] || themeName;
      }

      this.saveState();
      this.ui.showToast(`Applied ${themeName} theme`, 'info');
    }

    updatePaperAttributes() {
      if (!this.dom.paperDoc) return;

      this.dom.paperDoc.setAttribute('data-paper-size', this.state.paperSize);
      this.dom.paperDoc.setAttribute('data-orientation', this.state.orientation);
      this.dom.paperDoc.setAttribute('data-margins', this.state.margins);

      if (this.dom.documentContent) {
        this.dom.documentContent.style.fontSize = this.state.baseFontSize;
        this.dom.documentContent.style.lineHeight = this.state.lineHeight;
        this.dom.documentContent.style.fontFamily = this.state.fontFamily;
        this.dom.documentContent.style.textAlign = this.state.textAlign;
      }
    }

    updateHeadersFooters() {
      if (this.dom.documentHeader) {
        this.dom.documentHeader.style.display = this.state.includeHeader ? 'flex' : 'none';
      }
      if (this.dom.documentFooter) {
        this.dom.documentFooter.style.display = this.state.includeFooter ? 'flex' : 'none';
      }

      if (this.dom.headerLeft) this.dom.headerLeft.textContent = this.state.headerLeft || '';
      if (this.dom.headerRight) this.dom.headerRight.textContent = this.state.headerRight || '';
      if (this.dom.footerLeft) this.dom.footerLeft.textContent = this.state.footerLeft || '';
      if (this.dom.footerRight) this.dom.footerRight.textContent = this.state.footerRight || '';
    }

    renderCoverPage() {
      if (!this.dom.coverPageContainer) return;

      if (!this.state.includeCoverPage) {
        this.dom.coverPageContainer.innerHTML = '';
        this.dom.coverPageContainer.style.display = 'none';
        return;
      }

      this.dom.coverPageContainer.style.display = 'block';
      this.dom.coverPageContainer.innerHTML = `
        <div class="cover-page style-${this.state.coverStyle || 'modern'}">
          <span class="cover-tag">DOCUMENT SPECIFICATION</span>
          <h1 class="cover-title">${escapeXml(this.state.coverTitle || 'Untitled')}</h1>
          <p class="cover-subtitle">${escapeXml(this.state.coverSubtitle || '')}</p>
          <div class="cover-meta">
            <div><strong>Author:</strong> ${escapeXml(this.state.coverAuthor || 'Author')}</div>
            <div><strong>Date:</strong> ${escapeXml(this.state.coverDate || '')}</div>
          </div>
        </div>
      `;
    }

    setDocumentTitle(title) {
      this.state.title = title;
      if (this.dom.titleInput) this.dom.titleInput.value = title;
      this.state.headerLeft = title;
      this.setInputValue('setting-header-left', title);
      this.updateHeadersFooters();
    }

    onMarkdownChange() {
      this.state.content = this.dom.markdownInput?.value || '';
      this.render();
      this.saveState();
    }

    /**
     * Primary Render Pipeline
     */
    async render() {
      if (!this.dom.documentContent) return;

      const markdown = this.dom.markdownInput?.value || '';
      
      // Parse markdown to HTML
      const html = await this.parser.parse(markdown, { includeToc: false });
      this.dom.documentContent.innerHTML = html;

      // Update paper attributes, header/footer, cover page
      this.updatePaperAttributes();
      this.updateHeadersFooters();
      this.renderCoverPage();

      // Render Mermaid SVGs inside document
      await this.parser.renderMermaidInElement(this.dom.documentContent);

      // Update word counts, char counts, reading time, estimated pages
      this.ui.updateStats(markdown);
    }

    /**
     * Export Actions
     */
    exportVectorPrint() {
      this.exporter.state = this.state;
      this.ui.showToast('Preparing Vector PDF...', 'info');
      this.exporter.exportVectorPrint();
    }

    async downloadDirectPDF() {
      this.exporter.state = this.state;
      this.ui.showToast('Generating PDF file for download...', 'info');
      try {
        await this.exporter.downloadDirectPDF(this.dom.paperDoc, (status) => {
          this.ui.showToast(status, 'info');
        });
        this.ui.showToast('PDF Downloaded successfully!', 'success');
      } catch (err) {
        this.ui.showToast('Failed to generate direct PDF: ' + err.message, 'error');
      }
    }

    exportStandaloneHTML() {
      this.exporter.state = this.state;
      const html = this.dom.documentContent.innerHTML;
      this.exporter.exportStandaloneHTML(html, this.state.theme);
      this.ui.showToast('HTML Exported successfully!', 'success');
    }

    async copyHtml() {
      const html = this.dom.documentContent.innerHTML;
      const success = await this.exporter.copyHtmlToClipboard(html);
      if (success) {
        this.ui.showToast('HTML copied to clipboard!', 'success');
      } else {
        this.ui.showToast('Failed to copy HTML', 'error');
      }
    }

    handleExportAction(action) {
      switch (action) {
        case 'vector-print':
          this.exportVectorPrint();
          break;
        case 'direct-pdf':
          this.downloadDirectPDF();
          break;
        case 'export-html':
          this.exportStandaloneHTML();
          break;
        case 'copy-html':
          this.copyHtml();
          break;
        case 'shortcuts':
          this.openShortcutsModal();
          break;
      }
    }

    /**
     * Template Picker Modal
     */
    openTemplateModal() {
      const modal = document.getElementById('template-modal');
      const listEl = document.getElementById('template-list');
      if (!modal || !listEl) return;

      const templates = window.DOCUMENT_TEMPLATES || {};
      let html = '';

      Object.values(templates).forEach(tpl => {
        html += `
          <div class="template-card" data-template-id="${tpl.id}">
            <div>
              <div style="font-weight: 600; font-size: 13.5px; color: #ffffff;">${tpl.name}</div>
              <div style="font-size: 11.5px; color: #94a3b8; margin-top: 3px;">${tpl.description}</div>
            </div>
            <button class="btn btn-secondary" style="font-size: 12px; padding: 5px 12px;">Load</button>
          </div>
        `;
      });

      listEl.innerHTML = html;

      listEl.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-template-id');
          this.loadTemplate(id);
          modal.classList.remove('open');
        });
      });

      modal.classList.add('open');
    }

    loadTemplate(templateId) {
      const tpl = window.DOCUMENT_TEMPLATES?.[templateId];
      if (!tpl) return;

      this.dom.markdownInput.value = tpl.content;
      this.state.content = tpl.content;
      this.setDocumentTitle(tpl.name.replace(/^[^\w]+/, ''));
      if (tpl.theme) this.setTheme(tpl.theme);
      if (tpl.paperSize) {
        this.state.paperSize = tpl.paperSize;
        this.setSelectValue('setting-paper-size', tpl.paperSize);
      }
      this.render();
      this.saveState();
      this.ui.showToast(`Loaded "${tpl.name}" template`, 'success');
    }

    openShortcutsModal() {
      const modal = document.getElementById('shortcuts-modal');
      if (modal) modal.classList.add('open');
    }
  }

  function escapeXml(unsafe) {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  // Bootstrap when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new MDFStudioApp();

    // Close modals
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
        }
      });
    });
  });

})(window);
