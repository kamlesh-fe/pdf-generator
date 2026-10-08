import { generatePdfFromIframe, getPaperPixelDimensions } from './pdfEngine.js';
import { TEMPLATES } from './templates.js';
import { toPng } from 'html-to-image';

// State
let currentZoom = 1.0;
let debounceTimer = null;
let autoSaveTimer = null;
let isFilenameUserModified = false;
let showPageGuides = true;

// DOM Elements
const appMain = document.getElementById('app-main');
const htmlEditor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const paperSheet = document.getElementById('paper-sheet');
const paperContainer = document.getElementById('paper-container');
const templateSelect = document.getElementById('template-select');
const fileInput = document.getElementById('file-input');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const formatBtn = document.getElementById('format-btn');
const pageSizeSelect = document.getElementById('page-size');
const pageOrientationSelect = document.getElementById('page-orientation');
const pageScaleSelect = document.getElementById('page-scale');
const filenameInput = document.getElementById('filename-input');
const downloadBtn = document.getElementById('download-btn');
const downloadText = document.getElementById('download-text');
const previewTabBtn = document.getElementById('preview-tab-btn');
const exportPngBtn = document.getElementById('export-png-btn');
const printBtn = document.getElementById('print-btn');
const editorStats = document.getElementById('editor-stats');
const pageBadge = document.getElementById('page-badge');
const pageCountBadge = document.getElementById('page-count-badge');
const toggleGuidesBtn = document.getElementById('toggle-guides-btn');
const pageGuidesOverlay = document.getElementById('page-guides-overlay');
const autosaveStatus = document.getElementById('autosave-status');
const autosaveText = document.getElementById('autosave-text');
const zoomValue = document.getElementById('zoom-value');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');
const editorDropzone = document.getElementById('editor-dropzone');
const previewViewport = document.getElementById('preview-viewport');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');

// View switcher buttons
const viewSplitBtn = document.getElementById('view-split');
const viewEditorBtn = document.getElementById('view-editor');
const viewPreviewBtn = document.getElementById('view-preview');

// Storage keys
const STORAGE_KEY_HTML = 'html_pdf_generator_saved_code';
const STORAGE_KEY_FILENAME = 'html_pdf_generator_saved_filename';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // 1. Populate sample templates dropdown
  initTemplateSelect();

  // 2. Load cached code or initial template
  const savedHtml = localStorage.getItem(STORAGE_KEY_HTML);
  const savedFilename = localStorage.getItem(STORAGE_KEY_FILENAME);

  if (savedHtml && savedHtml.trim().length > 20) {
    htmlEditor.value = savedHtml;
    if (savedFilename) {
      filenameInput.value = savedFilename;
      isFilenameUserModified = true;
    }
    templateSelect.value = '';
    showToast("Restored your previous work from local storage", 'info');
  } else {
    loadTemplate('invoice');
  }

  // 3. Setup event listeners
  setupEventListeners();

  // 4. Initial layout calculation and auto-fit to width
  updateEditorStats();
  updatePaperLayout();
  updatePreview();
  setTimeout(fitToWidth, 150);
});

/**
 * Initialize template dropdown
 */
function initTemplateSelect() {
  templateSelect.innerHTML = '<option value="" disabled>-- Load Sample --</option>';
  Object.keys(TEMPLATES).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `Sample: ${TEMPLATES[key].name}`;
    templateSelect.appendChild(opt);
  });
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  // Live Editor input with debouncing and auto-save
  htmlEditor.addEventListener('input', () => {
    updateEditorStats();
    markSavingState();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 150);

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveToLocalStorage, 600);
  });

  // Editor Tab indentation preserving Undo/Redo
  htmlEditor.addEventListener('keydown', handleEditorIndent);

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', handleGlobalKeydown);

  // Track if user manually edits output filename
  filenameInput.addEventListener('input', () => {
    isFilenameUserModified = true;
    localStorage.setItem(STORAGE_KEY_FILENAME, filenameInput.value.trim());
  });

  // Template change
  templateSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    if (key) loadTemplate(key);
  });

  // File Upload
  fileInput.addEventListener('change', handleFileUpload);

  // Clear button
  if (clearBtn) clearBtn.addEventListener('click', clearEditor);

  // Copy HTML button
  copyBtn.addEventListener('click', copyHTML);

  // Format Code button
  if (formatBtn) formatBtn.addEventListener('click', formatEditorCode);

  // Layout View Switcher
  if (viewSplitBtn) viewSplitBtn.addEventListener('click', () => switchViewMode('split'));
  if (viewEditorBtn) viewEditorBtn.addEventListener('click', () => switchViewMode('editor'));
  if (viewPreviewBtn) viewPreviewBtn.addEventListener('click', () => switchViewMode('preview'));

  // Page Format & Orientation change
  pageSizeSelect.addEventListener('change', () => {
    updatePaperLayout();
    requestAnimationFrame(fitToWidth);
  });

  pageOrientationSelect.addEventListener('change', () => {
    updatePaperLayout();
    requestAnimationFrame(fitToWidth);
  });

  // Scale dropdown
  if (pageScaleSelect) {
    pageScaleSelect.addEventListener('change', () => {
      applyScaleToPreview();
      setTimeout(adjustIframeHeight, 100);
    });
  }

  // Toggle Page Break Guides
  if (toggleGuidesBtn) {
    toggleGuidesBtn.addEventListener('click', togglePageGuides);
  }

  // Zoom controls
  zoomInBtn.addEventListener('click', () => changeZoom(0.1));
  zoomOutBtn.addEventListener('click', () => changeZoom(-0.1));
  zoomResetBtn.addEventListener('click', fitToWidth);

  // Auto-fit on window resize
  window.addEventListener('resize', fitToWidth);

  // Actions
  downloadBtn.addEventListener('click', handleDownloadPDF);
  if (previewTabBtn) previewTabBtn.addEventListener('click', handlePreviewInTab);
  if (exportPngBtn) exportPngBtn.addEventListener('click', handleExportPNG);
  printBtn.addEventListener('click', printDocument);

  // Drag and drop HTML file support with global navigation protection
  setupDragAndDrop();
}

/**
 * Handle Global Keyboard Shortcuts
 */
function handleGlobalKeydown(e) {
  // Ctrl+S / Cmd+S: Quick Download PDF
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    handleDownloadPDF();
  }
  // Ctrl+P / Cmd+P: Quick Print
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    printDocument();
  }
  // Shift+Alt+F: Beautify HTML
  if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    formatEditorCode();
  }
  // Alt+1: Split View
  if (e.altKey && e.key === '1') {
    e.preventDefault();
    switchViewMode('split');
  }
  // Alt+2: Code Only View
  if (e.altKey && e.key === '2') {
    e.preventDefault();
    switchViewMode('editor');
  }
  // Alt+3: Preview Only View
  if (e.altKey && e.key === '3') {
    e.preventDefault();
    switchViewMode('preview');
  }
}

/**
 * Switch Layout View Mode (Split / Editor Only / Preview Only)
 */
function switchViewMode(mode) {
  appMain.className = `app-main view-${mode}`;

  if (viewSplitBtn) viewSplitBtn.classList.toggle('active', mode === 'split');
  if (viewEditorBtn) viewEditorBtn.classList.toggle('active', mode === 'editor');
  if (viewPreviewBtn) viewPreviewBtn.classList.toggle('active', mode === 'preview');

  if (mode === 'split' || mode === 'preview') {
    requestAnimationFrame(fitToWidth);
  }
}

/**
 * Auto-Save to LocalStorage
 */
function saveToLocalStorage() {
  const content = htmlEditor.value;
  try {
    localStorage.setItem(STORAGE_KEY_HTML, content);
    if (autosaveStatus) {
      autosaveStatus.className = 'save-indicator';
      if (autosaveText) autosaveText.textContent = 'Saved';
    }
  } catch (e) {
    console.warn("Storage quota exceeded", e);
  }
}

function markSavingState() {
  if (autosaveStatus) {
    autosaveStatus.className = 'save-indicator saving';
    if (autosaveText) autosaveText.textContent = 'Saving...';
  }
}

/**
 * Format / Beautify HTML Code
 */
function formatEditorCode() {
  const code = htmlEditor.value;
  if (!code.trim()) {
    showToast("Editor is empty", 'info');
    return;
  }

  const formatted = beautifyHTML(code);
  htmlEditor.value = formatted;
  updateEditorStats();
  updatePreview();
  saveToLocalStorage();
  showToast("Code formatted & beautified", 'success');
}

function beautifyHTML(html) {
  if (!html) return '';
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  // Normalize lines and preserve content
  const lines = html
    .replace(/>\s*</g, '>\n<')
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, content, close) => {
      return `${open}\n${content.trim()}\n${close}`;
    })
    .split('\n');

  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
  ]);

  let inStyle = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.startsWith('<style')) {
      inStyle = true;
      formatted += tab.repeat(indent) + rawLine + '\n';
      indent++;
      continue;
    }
    if (rawLine.startsWith('</style>')) {
      inStyle = false;
      indent = Math.max(0, indent - 1);
      formatted += tab.repeat(indent) + rawLine + '\n';
      continue;
    }

    if (inStyle) {
      formatted += tab.repeat(indent) + rawLine + '\n';
      continue;
    }

    if (rawLine.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      formatted += tab.repeat(indent) + rawLine + '\n';
    } else if (rawLine.startsWith('<') && !rawLine.startsWith('<!--')) {
      const tagMatch = rawLine.match(/<([a-zA-Z0-9\-]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
      const isSelfClosing = rawLine.endsWith('/>') || voidTags.has(tagName) || rawLine.startsWith('<!');

      formatted += tab.repeat(indent) + rawLine + '\n';
      if (!isSelfClosing && !rawLine.includes(`</${tagName}>`)) {
        indent++;
      }
    } else {
      formatted += tab.repeat(indent) + rawLine + '\n';
    }
  }

  return formatted.trim();
}

/**
 * Load template
 */
function loadTemplate(key) {
  const tpl = TEMPLATES[key];
  if (!tpl) return;

  htmlEditor.value = tpl.html;
  if (tpl.filename) {
    filenameInput.value = tpl.filename;
    isFilenameUserModified = false;
  }

  if (tpl.pageSize && pageSizeSelect) {
    pageSizeSelect.value = tpl.pageSize;
  }
  if (tpl.orientation && pageOrientationSelect) {
    pageOrientationSelect.value = tpl.orientation;
  }

  templateSelect.value = key;

  updateEditorStats();
  updatePaperLayout();
  updatePreview();
  saveToLocalStorage();
  showToast(`Loaded "${tpl.name}" template`, 'info');
}

/**
 * Clear the editor
 */
function clearEditor() {
  if (!htmlEditor.value.trim()) return;

  if (confirm("Are you sure you want to clear the editor?")) {
    htmlEditor.value = '';
    templateSelect.value = '';
    filenameInput.value = 'document.pdf';
    isFilenameUserModified = false;
    updateEditorStats();
    updatePreview();
    saveToLocalStorage();
    showToast("Editor cleared", 'info');
  }
}

/**
 * Update stats (lines, characters, words)
 */
function updateEditorStats() {
  const content = htmlEditor.value;
  const lines = content ? content.split('\n').length : 0;
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  editorStats.textContent = `${lines} ${lines === 1 ? 'line' : 'lines'} • ${chars.toLocaleString()} chars • ${words.toLocaleString()} words`;
}

/**
 * Handle Tab indentation in editor while preserving native Undo / Redo (Ctrl+Z)
 */
function handleEditorIndent(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;

    if (!e.shiftKey) {
      if (typeof this.setRangeText === 'function') {
        this.setRangeText('  ', start, end, 'end');
      } else {
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
      }
    } else {
      const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
      if (this.value.substring(lineStart, lineStart + 2) === '  ') {
        if (typeof this.setRangeText === 'function') {
          this.setRangeText('', lineStart, lineStart + 2, 'preserve');
        } else {
          this.value = this.value.substring(0, lineStart) + this.value.substring(lineStart + 2);
          this.selectionStart = this.selectionEnd = Math.max(lineStart, start - 2);
        }
      }
    }
    this.dispatchEvent(new Event('input'));
  }
}

/**
 * Update Preview Iframe
 */
function updatePreview() {
  const content = htmlEditor.value.trim();
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;

  doc.open();
  if (!content) {
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 70vh;
            color: #94a3b8;
            text-align: center;
            margin: 0;
            padding: 24px;
          }
          h3 { font-size: 18px; color: #64748b; margin-bottom: 8px; }
          p { font-size: 13px; max-width: 320px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <h3>No Document Content</h3>
        <p>Type or paste HTML code in the editor on the left to see the live rendered PDF preview.</p>
      </body>
      </html>
    `);
  } else {
    doc.write(content);
  }
  doc.close();

  // Inject sleek custom scrollbar style into iframe document
  try {
    if (doc.head && !doc.getElementById('custom-preview-scroll-style')) {
      const scrollStyle = doc.createElement('style');
      scrollStyle.id = 'custom-preview-scroll-style';
      scrollStyle.textContent = `
        * { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.45) transparent; }
        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.7); }
      `;
      doc.head.appendChild(scrollStyle);
    }
  } catch (e) {}

  // Apply scale to preview iframe
  applyScaleToPreview();

  // Auto-sync filename from <title> if user hasn't explicitly typed a custom filename
  if (content && !isFilenameUserModified) {
    const match = content.match(/<title>(.*?)<\/title>/i);
    if (match && match[1]) {
      const cleanTitle = match[1].trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      if (cleanTitle) {
        filenameInput.value = `${cleanTitle}.pdf`;
      }
    }
  }

  // Adjust preview iframe height and update page cutoff guides
  setTimeout(adjustIframeHeight, 80);
}

/**
 * Apply scale to preview document body
 */
function applyScaleToPreview() {
  try {
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    if (!doc || !doc.body) return;
    const scale = parseFloat(pageScaleSelect?.value || '1');
    if (scale !== 1) {
      doc.body.style.transform = `scale(${scale})`;
      doc.body.style.transformOrigin = 'top left';
      doc.body.style.width = `${100 / scale}%`;
    } else {
      doc.body.style.transform = 'none';
      doc.body.style.transformOrigin = 'initial';
      doc.body.style.width = 'auto';
    }
  } catch (e) {}
}

/**
 * Auto-adjust iframe height and render visual page break guides
 */
function adjustIframeHeight() {
  try {
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    if (!doc || !doc.body) return;

    const body = doc.body;
    const html = doc.documentElement;
    const scrollHeight = Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );

    const { heightPx } = getPaperPixelDimensions(pageSizeSelect.value, pageOrientationSelect.value);
    const finalHeight = Math.max(scrollHeight + 10, heightPx);
    previewFrame.style.height = `${finalHeight}px`;

    // Calculate total pages
    const totalPages = Math.max(1, Math.ceil(finalHeight / heightPx));
    if (pageCountBadge) {
      pageCountBadge.textContent = totalPages === 1 ? '1 Page' : `${totalPages} Pages`;
    }

    // Render Page Break Guides
    renderPageGuides(finalHeight, heightPx, totalPages);
  } catch (err) {
    console.warn("Could not calculate preview height", err);
  }
}

/**
 * Render visual page break guides across multi-page document
 */
function renderPageGuides(totalHeightPx, pageHeightPx, totalPages) {
  if (!pageGuidesOverlay) return;

  pageGuidesOverlay.innerHTML = '';
  if (totalPages <= 1) return;

  for (let i = 1; i < totalPages; i++) {
    const breakTop = i * pageHeightPx;
    if (breakTop >= totalHeightPx) break;

    const line = document.createElement('div');
    line.className = 'page-break-line';
    line.style.top = `${breakTop}px`;

    const tag = document.createElement('span');
    tag.className = 'page-break-tag';
    tag.textContent = `Page ${i} End • Page ${i + 1} Start (${breakTop}px)`;
    line.appendChild(tag);

    pageGuidesOverlay.appendChild(line);
  }
}

/**
 * Toggle Page Cutoff Guides
 */
function togglePageGuides() {
  showPageGuides = !showPageGuides;
  if (pageGuidesOverlay) {
    pageGuidesOverlay.classList.toggle('hidden', !showPageGuides);
  }
  if (toggleGuidesBtn) {
    toggleGuidesBtn.classList.toggle('active', showPageGuides);
    const span = toggleGuidesBtn.querySelector('span');
    if (span) span.textContent = showPageGuides ? 'Guides: ON' : 'Guides: OFF';
  }
}

/**
 * Update Paper Sheet layout (A4 / Letter / Legal, Portrait / Landscape)
 */
function updatePaperLayout() {
  const size = pageSizeSelect.value;
  const orientation = pageOrientationSelect.value;
  const { widthPx, heightPx } = getPaperPixelDimensions(size, orientation);

  paperSheet.className = `paper-sheet ${size} ${orientation}`;
  paperSheet.style.width = `${widthPx}px`;
  paperSheet.style.minHeight = `${heightPx}px`;

  pageBadge.textContent = `${size.toUpperCase()} ${orientation.charAt(0).toUpperCase() + orientation.slice(1)}`;

  adjustIframeHeight();
}

/**
 * Fit paper sheet cleanly within viewport width without horizontal scrollbars
 */
function fitToWidth() {
  if (!previewViewport || !paperSheet) return;
  const viewportWidth = previewViewport.clientWidth - 48;
  const paperWidth = paperSheet.offsetWidth || 794;
  if (viewportWidth > 0 && paperWidth > 0) {
    let scale = viewportWidth / paperWidth;
    scale = Math.min(1.0, Math.max(0.35, Math.floor(scale * 100) / 100));
    currentZoom = scale;
    applyZoom();
  }
}

/**
 * Zoom controls
 */
function changeZoom(delta) {
  currentZoom = Math.min(Math.max(0.4, currentZoom + delta), 2.0);
  applyZoom();
}

function applyZoom() {
  paperContainer.style.transform = `scale(${currentZoom})`;
  zoomValue.textContent = `${Math.round(currentZoom * 100)}%`;
}

/**
 * Copy HTML source to clipboard
 */
function copyHTML() {
  const content = htmlEditor.value;
  if (!content) {
    showToast("Editor is empty", 'info');
    return;
  }

  navigator.clipboard.writeText(content).then(() => {
    showToast("HTML copied to clipboard!", 'success');
  }).catch(() => {
    showToast("Failed to copy to clipboard", 'error');
  });
}

/**
 * File upload
 */
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  loadFileContent(file);
  fileInput.value = '';
}

function loadFileContent(file) {
  if (!file.name.match(/\.(html|htm)$/i)) {
    showToast("Please upload an .html or .htm file", 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    htmlEditor.value = event.target.result;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    filenameInput.value = `${baseName}.pdf`;
    isFilenameUserModified = false;
    templateSelect.value = '';

    updateEditorStats();
    updatePreview();
    saveToLocalStorage();
    showToast(`Loaded: ${file.name}`, 'success');
  };
  reader.onerror = () => {
    showToast("Failed to read file", 'error');
  };
  reader.readAsText(file);
}

/**
 * Drag and drop support with window-level navigation protection
 */
function setupDragAndDrop() {
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  ['dragenter', 'dragover'].forEach(eventName => {
    editorDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      editorDropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    editorDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      editorDropzone.classList.remove('drag-over');
    });
  });

  editorDropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      loadFileContent(files[0]);
    }
  });
}

/**
 * Get Clean Output Filename
 */
function getOutputFilename() {
  let filename = filenameInput.value.trim().replace(/[\r\n\t]/g, '');
  if (!filename) {
    filename = 'document.pdf';
  } else if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }
  return filename.replace(/[/\\?%*:|"<>]/g, '_');
}

/**
 * High-Fidelity Download PDF Action
 */
async function handleDownloadPDF() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste HTML code first", 'error');
    return;
  }

  const filename = getOutputFilename();
  const pageSize = pageSizeSelect.value;
  const orientation = pageOrientationSelect.value;
  const scale = parseFloat(pageScaleSelect?.value || '1');

  setDownloadLoading(true);

  try {
    showToast("Compiling pixel-perfect PDF...", 'info');

    let downloadedViaApi = false;
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: content,
          filename: filename,
          pageSize: pageSize,
          orientation: orientation,
          scale: scale
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadedViaApi = true;
      }
    } catch (apiErr) {
      console.warn("API engine unavailable, falling back to client-side renderer:", apiErr);
    }

    if (!downloadedViaApi) {
      await generatePdfFromIframe(previewFrame, {
        filename,
        pageSize,
        orientation,
        marginMm: 0,
        pixelRatio: 2
      });
    }

    showToast(`Downloaded: ${filename}`, 'success');
    setDownloadSuccess();
  } catch (err) {
    console.error("PDF Export error:", err);
    showToast(`PDF generation failed: ${err.message || 'Error'}`, 'error');
  } finally {
    setDownloadLoading(false);
  }
}

/**
 * Inspect / Preview Compiled PDF in New Tab
 */
async function handlePreviewInTab() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste HTML code first", 'error');
    return;
  }

  const filename = getOutputFilename();
  const pageSize = pageSizeSelect.value;
  const orientation = pageOrientationSelect.value;
  const scale = parseFloat(pageScaleSelect?.value || '1');

  showToast("Preparing PDF viewer...", 'info');

  try {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: content,
        filename: filename,
        pageSize: pageSize,
        orientation: orientation,
        scale: scale
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      showToast("Opened PDF preview in new tab", 'success');
      return;
    }
  } catch (e) {}

  // Fallback: print preview
  printDocument();
}

/**
 * Export High-Resolution PNG Image
 */
async function handleExportPNG() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste HTML code first", 'error');
    return;
  }

  showToast("Rendering 2x PNG image...", 'info');
  try {
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const targetElement = doc.body;

    const dataUrl = await toPng(targetElement, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    const baseName = getOutputFilename().replace(/\.pdf$/i, '');
    a.download = `${baseName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(`Exported: ${baseName}.png`, 'success');
  } catch (err) {
    console.error("PNG Export error:", err);
    showToast("Failed to export image", 'error');
  }
}

/**
 * Native Vector Print Fallback
 */
function printDocument() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste HTML code first", 'error');
    return;
  }

  showToast("Opening browser print dialog...", 'info');
  try {
    previewFrame.contentWindow.focus();
    previewFrame.contentWindow.print();
  } catch (err) {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(content);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
        printWin.close();
      }, 300);
    }
  }
}

/**
 * Button Loading States
 */
function setDownloadLoading(loading) {
  if (loading) {
    downloadBtn.classList.add('is-loading');
    downloadBtn.disabled = true;
    downloadText.textContent = 'Generating...';
  } else {
    downloadBtn.classList.remove('is-loading');
    downloadBtn.disabled = false;
    downloadText.textContent = 'Download PDF';
  }
}

function setDownloadSuccess() {
  downloadText.textContent = '✓ Saved!';
  setTimeout(() => {
    downloadText.textContent = 'Download PDF';
  }, 2200);
}

/**
 * Toast Notifications
 */
let toastTimeout = null;
function showToast(message, type = 'info') {
  if (!toastEl || !toastMsg) return;

  clearTimeout(toastTimeout);
  toastMsg.textContent = message;
  toastEl.className = `toast toast-${type} show`;

  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}
