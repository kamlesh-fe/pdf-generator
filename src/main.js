import { generatePdfFromIframe, getPaperPixelDimensions } from './pdfEngine.js';
import { TEMPLATES } from './templates.js';

// State
let currentZoom = 1.0;
let debounceTimer = null;

// DOM Elements
const htmlEditor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const paperSheet = document.getElementById('paper-sheet');
const paperContainer = document.getElementById('paper-container');
const templateSelect = document.getElementById('template-select');
const fileInput = document.getElementById('file-input');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const pageSizeSelect = document.getElementById('page-size');
const pageOrientationSelect = document.getElementById('page-orientation');
const filenameInput = document.getElementById('filename-input');
const downloadBtn = document.getElementById('download-btn');
const downloadText = document.getElementById('download-text');
const printBtn = document.getElementById('print-btn');
const editorStats = document.getElementById('editor-stats');
const pageBadge = document.getElementById('page-badge');
const zoomValue = document.getElementById('zoom-value');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');
const editorDropzone = document.getElementById('editor-dropzone');
const previewViewport = document.getElementById('preview-viewport');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // 1. Populate sample templates dropdown
  initTemplateSelect();

  // 2. Load initial template (Invoice)
  loadTemplate('invoice');

  // 3. Setup event listeners
  setupEventListeners();

  // 4. Initial layout calculation and auto-fit to width
  updateEditorStats();
  updatePaperLayout();
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
    if (key === 'invoice') opt.selected = true;
    templateSelect.appendChild(opt);
  });
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  // Live Editor input with debouncing
  htmlEditor.addEventListener('input', () => {
    updateEditorStats();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 200);
  });

  // Editor Tab indentation
  htmlEditor.addEventListener('keydown', handleEditorIndent);

  // Template change
  templateSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    if (key) loadTemplate(key);
  });

  // File Upload
  fileInput.addEventListener('change', handleFileUpload);

  // Clear button
  clearBtn.addEventListener('click', clearEditor);

  // Copy HTML button
  copyBtn.addEventListener('click', copyHTML);

  // Page Format & Orientation change
  pageSizeSelect.addEventListener('change', () => {
    updatePaperLayout();
    fitToWidth();
  });

  pageOrientationSelect.addEventListener('change', () => {
    updatePaperLayout();
    fitToWidth();
  });

  // Zoom controls
  zoomInBtn.addEventListener('click', () => changeZoom(0.1));
  zoomOutBtn.addEventListener('click', () => changeZoom(-0.1));
  zoomResetBtn.addEventListener('click', fitToWidth);

  // Auto-fit on window resize
  window.addEventListener('resize', fitToWidth);

  // Download PDF
  downloadBtn.addEventListener('click', handleDownloadPDF);

  // Print Document
  printBtn.addEventListener('click', printDocument);

  // Drag and drop HTML file support
  setupDragAndDrop();
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
  }
  templateSelect.value = key;

  updateEditorStats();
  updatePreview();
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
    updateEditorStats();
    updatePreview();
    showToast("Editor cleared", 'info');
  }
}

/**
 * Update stats (lines, characters)
 */
function updateEditorStats() {
  const content = htmlEditor.value;
  const lines = content ? content.split('\n').length : 0;
  const chars = content.length;
  editorStats.textContent = `${lines} ${lines === 1 ? 'line' : 'lines'} • ${chars.toLocaleString()} chars`;
}

/**
 * Handle Tab indentation in editor
 */
function handleEditorIndent(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;

    if (!e.shiftKey) {
      this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
    } else {
      const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
      if (this.value.substring(lineStart, lineStart + 2) === "  ") {
        this.value = this.value.substring(0, lineStart) + this.value.substring(lineStart + 2);
        this.selectionStart = this.selectionEnd = Math.max(lineStart, start - 2);
      }
    }
    updatePreview();
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

  // Auto-sync filename from <title> if default
  if (content && filenameInput.value === 'document.pdf') {
    const match = content.match(/<title>(.*?)<\/title>/i);
    if (match && match[1]) {
      const cleanTitle = match[1].trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      if (cleanTitle) {
        filenameInput.value = `${cleanTitle}.pdf`;
      }
    }
  }

  // Adjust preview iframe height
  setTimeout(adjustIframeHeight, 80);
}

/**
 * Auto-adjust iframe height to match content
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
    const finalHeight = Math.max(scrollHeight + 20, heightPx);
    previewFrame.style.height = finalHeight + 'px';
  } catch (err) {
    console.warn("Could not calculate preview height", err);
  }
}

/**
 * Update Paper Sheet layout (A4 / Letter, Portrait / Landscape)
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
    templateSelect.value = '';

    updateEditorStats();
    updatePreview();
    showToast(`Loaded: ${file.name}`, 'success');
  };
  reader.onerror = () => {
    showToast("Failed to read file", 'error');
  };
  reader.readAsText(file);
}

function setupDragAndDrop() {
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
 * High-Fidelity Download PDF Action
 */
async function handleDownloadPDF() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste HTML code first", 'error');
    return;
  }

  // Format filename
  let filename = filenameInput.value.trim();
  if (!filename) {
    filename = 'document.pdf';
  } else if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }
  filename = filename.replace(/[/\\?%*:|"<>]/g, '_');

  const pageSize = pageSizeSelect.value;
  const orientation = pageOrientationSelect.value;

  setDownloadLoading(true);

  try {
    showToast("Compiling pixel-perfect PDF...", 'info');

    // 1. Try native Chromium Skia PDF engine first (100% exact @page margins & pagination)
    let downloadedViaApi = false;
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: content,
          filename: filename,
          pageSize: pageSize,
          orientation: orientation
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
      console.warn("API engine unavailable, using client-side renderer:", apiErr);
    }

    // 2. Client-side fallback if server API is not available
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
    console.error("Direct iframe print failed, trying popup window", err);
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
