import { generatePdfFromIframe, getPaperPixelDimensions } from './pdfEngine.js';
import { TEMPLATES, MARKDOWN_TEMPLATES } from './templates.js';
import { compileMarkdown } from './markdownEngine.js';
import { MARKDOWN_THEMES } from './markdownThemes.js';
import { toPng } from 'html-to-image';
import Prism from 'prismjs';
globalThis.Prism = Prism;
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-yaml.js';
import beautify from 'js-beautify';

const htmlBeautify = beautify.html || beautify.html_beautify || beautify;

// State
let currentMode = 'html'; // 'html' | 'markdown'
let currentMdTheme = 'github';
let compiledHtmlCache = '';
let updateCounter = 0;
let currentZoom = 1.0;
let debounceTimer = null;
let autoSaveTimer = null;
let isFilenameUserModified = false;
let showPageGuides = true;

// DOM Elements
const appMain = document.getElementById('app-main');
const htmlEditor = document.getElementById('html-editor');
const highlightLayer = document.getElementById('highlight-layer');
const highlightCode = document.getElementById('highlight-code');
const lineNumbers = document.getElementById('line-numbers');
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

// Mode Switcher Elements
const modeBtnHtml = document.getElementById('mode-btn-html');
const modeBtnMd = document.getElementById('mode-btn-md');
const appTitle = document.getElementById('app-title');
const appPill = document.getElementById('app-pill');
const mdThemeWrapper = document.getElementById('md-theme-wrapper');
const mdThemeSelect = document.getElementById('md-theme-select');
const mdToolbar = document.getElementById('md-toolbar');
const editorPaneTitle = document.getElementById('editor-pane-title');
const dropMessageText = document.getElementById('drop-message-text');

// View switcher buttons
const viewSplitBtn = document.getElementById('view-split');
const viewEditorBtn = document.getElementById('view-editor');
const viewPreviewBtn = document.getElementById('view-preview');

// Storage keys
const STORAGE_KEY_HTML = 'html_pdf_generator_saved_code';
const STORAGE_KEY_MD = 'html_pdf_generator_saved_md';
const STORAGE_KEY_MODE = 'html_pdf_generator_saved_mode';
const STORAGE_KEY_FILENAME = 'html_pdf_generator_saved_filename';
const STORAGE_KEY_MD_THEME = 'html_pdf_generator_saved_md_theme';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // 1. Check saved mode and theme
  const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
  if (savedMode === 'markdown' || savedMode === 'html') {
    currentMode = savedMode;
  }
  const savedTheme = localStorage.getItem(STORAGE_KEY_MD_THEME);
  if (savedTheme && MARKDOWN_THEMES[savedTheme]) {
    currentMdTheme = savedTheme;
    if (mdThemeSelect) mdThemeSelect.value = savedTheme;
  }

  // 2. Populate template dropdown for active mode
  populateTemplateSelect();

  // 3. Load cached code or initial template
  const storageKey = currentMode === 'markdown' ? STORAGE_KEY_MD : STORAGE_KEY_HTML;
  const savedContent = localStorage.getItem(storageKey);
  const savedFilename = localStorage.getItem(STORAGE_KEY_FILENAME);

  if (savedContent && savedContent.trim().length > 20) {
    htmlEditor.value = savedContent;
    if (savedFilename) {
      filenameInput.value = savedFilename;
      isFilenameUserModified = true;
    }
    templateSelect.value = '';
    showToast(`Restored previous work (${currentMode.toUpperCase()} Mode)`, 'info');
  } else {
    if (currentMode === 'markdown') {
      loadMarkdownTemplate('tech_guide');
    } else {
      loadTemplate('invoice');
    }
  }

  // 4. Synchronize UI chrome for active mode
  applyModeUI(currentMode);

  // 5. Setup event listeners
  setupEventListeners();

  // 6. Initial layout calculation and auto-fit to width
  updateEditorStats();
  updatePaperLayout();
  updateSyntaxHighlight();
  updatePreview();
  setTimeout(fitToWidth, 150);
});

/**
 * Populate sample templates dropdown dynamically based on active mode
 */
function populateTemplateSelect() {
  templateSelect.innerHTML = '<option value="" disabled>-- Load Sample --</option>';
  if (currentMode === 'markdown') {
    Object.keys(MARKDOWN_TEMPLATES).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `Sample: ${MARKDOWN_TEMPLATES[key].name}`;
      templateSelect.appendChild(opt);
    });
  } else {
    Object.keys(TEMPLATES).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `Sample: ${TEMPLATES[key].name}`;
      templateSelect.appendChild(opt);
    });
  }
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  // Format Mode Toggle Buttons
  if (modeBtnHtml) modeBtnHtml.addEventListener('click', () => switchFormatMode('html'));
  if (modeBtnMd) modeBtnMd.addEventListener('click', () => switchFormatMode('markdown'));

  // Markdown Theme Dropdown
  if (mdThemeSelect) {
    mdThemeSelect.addEventListener('change', (e) => {
      currentMdTheme = e.target.value;
      localStorage.setItem(STORAGE_KEY_MD_THEME, currentMdTheme);
      updatePreview();
      showToast(`Applied theme: ${MARKDOWN_THEMES[currentMdTheme]?.name || currentMdTheme}`, 'info');
    });
  }

  // Markdown Formatting Toolbar Actions
  if (mdToolbar) {
    mdToolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.md-tool-btn');
      if (btn && btn.dataset.action) {
        handleMarkdownToolAction(btn.dataset.action);
      }
    });
  }

  // Live Editor input with debouncing, syntax highlight, format auto-detection, and auto-save
  htmlEditor.addEventListener('input', () => {
    const val = htmlEditor.value;
    // Auto-switch mode if user starts a new document with distinct format syntax
    if (currentMode === 'html' && val.length >= 3 && val.length <= 80) {
      if (val.startsWith('# ') || val.startsWith('---') || val.startsWith('> [!')) {
        switchFormatMode('markdown', true);
        return;
      }
    } else if (currentMode === 'markdown' && val.length >= 8 && val.length <= 80) {
      if (/^<!DOCTYPE/i.test(val.trim()) || /^<html/i.test(val.trim())) {
        switchFormatMode('html', true);
        return;
      }
    }

    updateSyntaxHighlight();
    updateEditorStats();
    markSavingState();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 150);

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveToLocalStorage, 600);
  });

  // Paste handler with automatic format detection
  htmlEditor.addEventListener('paste', () => {
    setTimeout(() => {
      const content = htmlEditor.value;
      const detected = detectDocumentFormat(content);
      if (detected && detected !== currentMode) {
        switchFormatMode(detected, true);
        showToast(`Auto-detected ${detected === 'markdown' ? 'Markdown' : 'HTML'} format`, 'info');
      }
    }, 50);
  });

  // Synchronize scroll position across highlight layer and line numbers
  htmlEditor.addEventListener('scroll', syncEditorScroll);

  // Editor Tab indentation & Markdown hotkeys
  htmlEditor.addEventListener('keydown', handleEditorKeydown);

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
    if (!key) return;
    if (currentMode === 'markdown') {
      loadMarkdownTemplate(key);
    } else {
      loadTemplate(key);
    }
  });

  // File Upload
  fileInput.addEventListener('change', handleFileUpload);

  // Clear button
  if (clearBtn) clearBtn.addEventListener('click', clearEditor);

  // Copy code button
  copyBtn.addEventListener('click', copyCode);

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
    if (currentMode === 'markdown') {
      localStorage.setItem(STORAGE_KEY_MD, content);
    } else {
      localStorage.setItem(STORAGE_KEY_HTML, content);
    }
    localStorage.setItem(STORAGE_KEY_MODE, currentMode);
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
 * Check if the given text matches any built-in sample template
 */
function isDefaultSampleContent(text) {
  if (!text) return true;
  const normalized = text.trim();
  for (const key of Object.keys(TEMPLATES)) {
    if (TEMPLATES[key].html && TEMPLATES[key].html.trim() === normalized) return true;
  }
  for (const key of Object.keys(MARKDOWN_TEMPLATES)) {
    if (MARKDOWN_TEMPLATES[key].markdown && MARKDOWN_TEMPLATES[key].markdown.trim() === normalized) return true;
  }
  return false;
}

/**
 * Intelligent Document Format Detector (Markdown vs HTML)
 */
function detectDocumentFormat(text) {
  if (!text || text.trim().length < 8) return null;
  const trimmed = text.trim();

  // Distinct HTML markers
  const hasHtmlDoctype = /^<!DOCTYPE\s+html/i.test(trimmed);
  const hasHtmlTag = /<html[\s>]/i.test(trimmed);
  const hasCommonHtmlStructure = /<(head|body|style|div|section|table|main)[\s>]/i.test(trimmed);

  if (hasHtmlDoctype || (hasHtmlTag && hasCommonHtmlStructure)) {
    return 'html';
  }

  // Distinct Markdown markers
  const hasYamlFrontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(trimmed);
  const hasMarkdownHeadings = /(?:^|\n)#{1,6}\s+[\w\d]/m.test(trimmed);
  const hasGithubAlerts = /(?:^|\n)>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/im.test(trimmed);
  const hasMermaidFences = /(?:^|\n)```(?:mermaid|js|javascript|ts|typescript|python|bash|css|json)/m.test(trimmed);
  const hasTaskLists = /(?:^|\n)-\s+\[[ xX]\]\s+/m.test(trimmed);
  const hasKatexBlocks = /\$\$[\s\S]+?\$\$/.test(trimmed);

  const markdownScore = (hasYamlFrontmatter ? 3 : 0) +
    (hasMarkdownHeadings ? 2 : 0) +
    (hasGithubAlerts ? 2 : 0) +
    (hasMermaidFences ? 2 : 0) +
    (hasTaskLists ? 2 : 0) +
    (hasKatexBlocks ? 2 : 0);

  if (markdownScore >= 2 && !hasHtmlDoctype) {
    return 'markdown';
  }

  return null;
}

/**
 * Switch Document Format Mode (HTML vs Markdown)
 */
function switchFormatMode(newMode, preserveContent = false) {
  if (currentMode === newMode && !preserveContent) return;
  currentMode = newMode;
  localStorage.setItem(STORAGE_KEY_MODE, newMode);

  applyModeUI(newMode);
  populateTemplateSelect();

  const currentVal = htmlEditor.value.trim();
  const hasCustomUserContent = currentVal.length > 0 && !isDefaultSampleContent(currentVal);

  let templateLoaded = false;
  if (preserveContent || hasCustomUserContent) {
    // Preserve custom user content! Never overwrite custom work
    templateSelect.value = '';
  } else {
    // Only load template or cached draft if editor has no custom content
    const storageKey = newMode === 'markdown' ? STORAGE_KEY_MD : STORAGE_KEY_HTML;
    const cached = localStorage.getItem(storageKey);
    if (cached && cached.trim().length > 20 && !isDefaultSampleContent(cached.trim())) {
      htmlEditor.value = cached;
      templateSelect.value = '';
    } else {
      if (newMode === 'markdown') {
        loadMarkdownTemplate('tech_guide');
        templateLoaded = true;
      } else {
        loadTemplate('invoice');
        templateLoaded = true;
      }
    }
  }

  updateEditorStats();
  updatePaperLayout();
  updateSyntaxHighlight();
  if (!templateLoaded) {
    updatePreview();
  }
  showToast(`Switched to ${newMode === 'markdown' ? 'Markdown' : 'HTML'} Mode`, 'info');
}

/**
 * Apply Mode UI Chrome
 */
function applyModeUI(mode) {
  if (modeBtnHtml) {
    modeBtnHtml.classList.toggle('active', mode === 'html');
    modeBtnHtml.setAttribute('aria-selected', mode === 'html');
  }
  if (modeBtnMd) {
    modeBtnMd.classList.toggle('active', mode === 'markdown');
    modeBtnMd.setAttribute('aria-selected', mode === 'markdown');
  }

  if (appTitle) {
    appTitle.textContent = mode === 'markdown' ? 'Markdown to PDF' : 'HTML to PDF';
  }
  if (appPill) {
    appPill.textContent = mode === 'markdown' ? 'Markdown Pro' : 'Studio Pro';
  }

  if (mdThemeWrapper) {
    mdThemeWrapper.style.display = mode === 'markdown' ? 'flex' : 'none';
  }
  if (mdToolbar) {
    mdToolbar.style.display = mode === 'markdown' ? 'flex' : 'none';
  }

  if (editorPaneTitle) {
    editorPaneTitle.textContent = mode === 'markdown' ? 'Markdown Document' : 'HTML Source';
  }
  if (htmlEditor) {
    htmlEditor.placeholder = mode === 'markdown'
      ? 'Write or paste your Markdown here... (GFM, LaTeX Math, Mermaid Diagrams, and Alerts supported)'
      : 'Write or paste your HTML code here... (CSS & fonts are supported)';
  }
  if (dropMessageText) {
    dropMessageText.textContent = mode === 'markdown' ? 'Drop Markdown file to load' : 'Drop HTML file to load';
  }
}

/**
 * Format / Beautify Code in Editor
 */
function formatEditorCode() {
  const code = htmlEditor.value;
  if (!code.trim()) {
    showToast("Editor is empty", 'info');
    return;
  }

  if (currentMode === 'markdown') {
    // Clean, typography-safe Markdown formatting
    const lines = code.split(/\r?\n/);
    const cleaned = lines.map(line => line.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n');
    htmlEditor.value = cleaned;
    showToast("Markdown document cleaned & formatted", 'success');
  } else {
    const formatted = htmlBeautify(code, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 1,
      preserve_newlines: true,
      indent_inner_html: true,
      extra_liners: ['head', 'body', '/html'],
      wrap_line_length: 0,
      unformatted: ['b', 'em', 'span', 'strong', 'i']
    });
    htmlEditor.value = formatted;
    showToast("HTML code beautified & formatted", 'success');
  }

  updateSyntaxHighlight();
  updateEditorStats();
  updatePreview();
  saveToLocalStorage();
}

/**
 * Real-Time Syntax Highlighting using Prism
 */
function updateSyntaxHighlight() {
  if (!highlightCode || !htmlEditor) return;

  let codeText = htmlEditor.value;
  if (codeText.endsWith('\n')) {
    codeText += ' ';
  }

  try {
    if (currentMode === 'markdown') {
      highlightCode.className = 'language-markdown';
      highlightCode.innerHTML = Prism.highlight(codeText, Prism.languages.markdown || Prism.languages.markup, 'markdown');
    } else {
      highlightCode.className = 'language-html';
      highlightCode.innerHTML = Prism.highlight(codeText, Prism.languages.markup, 'markup');
    }
  } catch (e) {
    highlightCode.textContent = codeText;
  }

  updateLineNumbers();
  syncEditorScroll();
}

/**
 * Update Line Numbers Gutter
 */
function updateLineNumbers() {
  if (!lineNumbers || !htmlEditor) return;
  const linesCount = (htmlEditor.value.match(/\n/g) || []).length + 1;
  let nums = '';
  for (let i = 1; i <= linesCount; i++) {
    nums += i + '\n';
  }
  lineNumbers.textContent = nums;
}

/**
 * Synchronize scroll position across layers
 */
function syncEditorScroll() {
  if (highlightLayer) {
    highlightLayer.scrollTop = htmlEditor.scrollTop;
    highlightLayer.scrollLeft = htmlEditor.scrollLeft;
  }
  if (lineNumbers) {
    lineNumbers.scrollTop = htmlEditor.scrollTop;
  }
}

/**
 * Load HTML template
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
  updateSyntaxHighlight();
  updatePreview();
  saveToLocalStorage();
  showToast(`Loaded "${tpl.name}" template`, 'info');
}

/**
 * Load Markdown template
 */
function loadMarkdownTemplate(key) {
  const tpl = MARKDOWN_TEMPLATES[key];
  if (!tpl) return;

  htmlEditor.value = tpl.markdown;
  if (tpl.filename) {
    filenameInput.value = tpl.filename;
    isFilenameUserModified = false;
  }
  if (tpl.theme && mdThemeSelect) {
    mdThemeSelect.value = tpl.theme;
    currentMdTheme = tpl.theme;
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
  updateSyntaxHighlight();
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
    filenameInput.value = currentMode === 'markdown' ? 'document_spec.pdf' : 'document.pdf';
    isFilenameUserModified = false;
    updateEditorStats();
    updateSyntaxHighlight();
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
 * Handle Tab indentation and Markdown shortcuts in editor
 */
function handleEditorKeydown(e) {
  // Tab Indentation
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
    return;
  }

  // Markdown Mode Hotkeys: Ctrl+B (Bold), Ctrl+I (Italic)
  if (currentMode === 'markdown' && (e.ctrlKey || e.metaKey)) {
    if (e.key.toLowerCase() === 'b') {
      e.preventDefault();
      handleMarkdownToolAction('bold');
    } else if (e.key.toLowerCase() === 'i') {
      e.preventDefault();
      handleMarkdownToolAction('italic');
    }
  }
}

/**
 * Handle Markdown Quick Action Toolbar
 */
function handleMarkdownToolAction(action) {
  const textarea = htmlEditor;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);

  let replacement = '';
  let cursorOffset = 0;

  switch (action) {
    case 'bold':
      replacement = `**${selected || 'bold text'}**`;
      cursorOffset = selected ? replacement.length : 2;
      break;
    case 'italic':
      replacement = `*${selected || 'italic text'}*`;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case 'heading':
      replacement = `\n## ${selected || 'Section Heading'}\n`;
      cursorOffset = replacement.length;
      break;
    case 'heading3':
      replacement = `\n### ${selected || 'Sub-section Heading'}\n`;
      cursorOffset = replacement.length;
      break;
    case 'link':
      replacement = `[${selected || 'link description'}](https://example.com)`;
      cursorOffset = replacement.length;
      break;
    case 'quote':
      replacement = `\n> ${selected || 'Highlighted quote or callout text.'}\n`;
      cursorOffset = replacement.length;
      break;
    case 'code':
      if (selected.includes('\n')) {
        replacement = `\n\`\`\`javascript\n${selected}\n\`\`\`\n`;
      } else {
        replacement = `\`${selected || 'code'}\``;
      }
      cursorOffset = replacement.length;
      break;
    case 'table':
      replacement = `\n| Header 1 | Header 2 | Header 3 |\n| :--- | :--- | :--- |\n| Row 1 Data | Sample Info | Active |\n| Row 2 Data | Sample Info | Verified |\n`;
      cursorOffset = replacement.length;
      break;
    case 'task':
      replacement = `\n- [ ] ${selected || 'New task item'}\n`;
      cursorOffset = replacement.length;
      break;
    case 'math':
      if (selected) {
        replacement = `$$ ${selected} $$`;
      } else {
        replacement = `\n$$\n\\mathcal{L}_{\\text{total}} = \\frac{1}{N} \\sum_{i=1}^N \\left( y_i - \\hat{y}_i \\right)^2\n$$\n`;
      }
      cursorOffset = replacement.length;
      break;
    case 'diagram':
      replacement = `\n\`\`\`mermaid\nflowchart TD\n    A[Start Request] --> B{Validated?}\n    B -- Yes --> C[Process Transaction]\n    B -- No --> D[Return 400 Bad Request]\n    C --> End[200 OK Response]\n\`\`\`\n`;
      cursorOffset = replacement.length;
      break;
    case 'alert':
      replacement = `\n> [!NOTE]\n> ${selected || 'Key background context or system guidance note.'}\n`;
      cursorOffset = replacement.length;
      break;
    case 'pagebreak':
      replacement = `\n\n<!-- pagebreak -->\n\n`;
      cursorOffset = replacement.length;
      break;
    case 'toc':
      replacement = `\n[TOC]\n\n`;
      cursorOffset = replacement.length;
      break;
  }

  if (replacement) {
    if (typeof textarea.setRangeText === 'function') {
      textarea.setRangeText(replacement, start, end, 'end');
    } else {
      textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
    }
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
  }
}

/**
 * Update Preview Iframe (Async compilation in Markdown mode)
 */
async function updatePreview() {
  const thisRun = ++updateCounter;
  const content = htmlEditor.value.trim();
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;

  if (!content) {
    compiledHtmlCache = '';
    doc.open();
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
          p { font-size: 13px; max-width: 340px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <h3>No Document Content</h3>
        <p>${currentMode === 'markdown' ? 'Type or paste Markdown on the left to see the live rendered PDF preview.' : 'Type or paste HTML code in the editor on the left to see the live rendered PDF preview.'}</p>
      </body>
      </html>
    `);
    doc.close();
    return;
  }

  let finalHtml = content;
  if (currentMode === 'markdown') {
    const pageSize = pageSizeSelect.value;
    const orientation = pageOrientationSelect.value;
    const scale = parseFloat(pageScaleSelect?.value || '1');
    try {
      finalHtml = await compileMarkdown(content, {
        theme: currentMdTheme,
        pageSize,
        orientation,
        scale
      });
      // Prevent stale async overwrite
      if (thisRun !== updateCounter) return;
      compiledHtmlCache = finalHtml;
    } catch (e) {
      console.warn("Markdown compile error:", e);
      finalHtml = `<div style="padding: 24px; color: #cf222e; font-family: sans-serif;"><h3>Markdown Render Error</h3><pre>${e.message}</pre></div>`;
    }
  } else {
    compiledHtmlCache = content;
  }

  doc.open();
  doc.write(finalHtml);
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

  // Apply scale to preview iframe for HTML mode (Markdown handles zoom natively in compiled CSS)
  if (currentMode === 'html') {
    applyScaleToPreview();
  }

  // Auto-sync filename from title if user hasn't explicitly typed a custom filename
  if (content && !isFilenameUserModified) {
    let cleanTitle = '';
    if (currentMode === 'markdown') {
      const fmTitle = content.match(/^---\r?\n[\s\S]*?title:\s*([^\r\n]+)/);
      const h1Title = content.match(/^#\s+(.+)$/m);
      cleanTitle = fmTitle ? fmTitle[1].trim() : (h1Title ? h1Title[1].trim() : '');
    } else {
      const match = content.match(/<title>(.*?)<\/title>/i);
      cleanTitle = match ? match[1].trim() : '';
    }
    if (cleanTitle) {
      cleanTitle = cleanTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
      if (cleanTitle) {
        filenameInput.value = `${cleanTitle}.pdf`;
      }
    }
  }

  // Adjust preview iframe height and update page cutoff guides
  setTimeout(adjustIframeHeight, 100);
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
 * Copy code source to clipboard
 */
function copyCode() {
  const content = htmlEditor.value;
  if (!content) {
    showToast("Editor is empty", 'info');
    return;
  }

  navigator.clipboard.writeText(content).then(() => {
    showToast(`${currentMode === 'markdown' ? 'Markdown' : 'HTML'} copied to clipboard!`, 'success');
  }).catch(() => {
    showToast("Failed to copy to clipboard", 'error');
  });
}

/**
 * File upload handler (Supports .html, .htm, .md, .markdown)
 */
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  loadFileContent(file);
  fileInput.value = '';
}

function loadFileContent(file) {
  const isMd = file.name.match(/\.(md|markdown)$/i);
  const isHtml = file.name.match(/\.(html|htm)$/i);

  if (!isMd && !isHtml) {
    showToast("Please upload an .html, .htm, .md, or .markdown file", 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const targetMode = isMd ? 'markdown' : 'html';
    if (currentMode !== targetMode) {
      switchFormatMode(targetMode, true);
    }

    htmlEditor.value = event.target.result;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    filenameInput.value = `${baseName}.pdf`;
    isFilenameUserModified = false;
    templateSelect.value = '';

    updateEditorStats();
    updateSyntaxHighlight();
    updatePreview();
    saveToLocalStorage();
    showToast(`Loaded: ${file.name} (${targetMode.toUpperCase()} Mode)`, 'success');
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
    filename = currentMode === 'markdown' ? 'document_spec.pdf' : 'document.pdf';
  } else if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }
  return filename.replace(/[/\\?%*:|"<>]/g, '_');
}

/**
 * Helper to obtain the active print-ready HTML
 */
async function getActiveHtml() {
  const content = htmlEditor.value.trim();
  if (!content) return '';

  if (currentMode === 'markdown') {
    const pageSize = pageSizeSelect.value;
    const orientation = pageOrientationSelect.value;
    const scale = parseFloat(pageScaleSelect?.value || '1');
    return await compileMarkdown(content, {
      theme: currentMdTheme,
      pageSize,
      orientation,
      scale
    });
  }

  return content;
}

/**
 * High-Fidelity Download PDF Action (Skia Chromium Engine + Client Fallback)
 */
async function handleDownloadPDF() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast(currentMode === 'markdown' ? "Please write or paste Markdown code first" : "Please write or paste HTML code first", 'error');
    return;
  }

  const filename = getOutputFilename();
  const pageSize = pageSizeSelect.value;
  const orientation = pageOrientationSelect.value;
  const scale = parseFloat(pageScaleSelect?.value || '1');

  setDownloadLoading(true);

  try {
    showToast("Compiling pixel-perfect PDF...", 'info');

    const htmlToSend = await getActiveHtml();

    let downloadedViaApi = false;
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlToSend,
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
 * Inspect / Preview Compiled PDF in New Tab (Bypasses popup blocker)
 */
async function handlePreviewInTab() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste document code first", 'error');
    return;
  }

  const filename = getOutputFilename();
  const pageSize = pageSizeSelect.value;
  const orientation = pageOrientationSelect.value;
  const scale = parseFloat(pageScaleSelect?.value || '1');

  showToast("Preparing PDF viewer...", 'info');

  // Open window synchronously during click event to satisfy browser popup security policies
  let newTab = null;
  try {
    newTab = window.open('about:blank', '_blank');
  } catch (e) {}

  try {
    const htmlToSend = await getActiveHtml();
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlToSend,
        filename: filename,
        pageSize: pageSize,
        orientation: orientation,
        scale: scale
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (newTab && !newTab.closed) {
        newTab.location.href = url;
      } else {
        window.open(url, '_blank');
      }
      showToast("Opened PDF preview in new tab", 'success');
      return;
    } else {
      if (newTab && !newTab.closed) newTab.close();
    }
  } catch (e) {
    if (newTab && !newTab.closed) newTab.close();
  }

  // Fallback: print preview
  printDocument();
}

/**
 * Export High-Resolution PNG Image
 */
async function handleExportPNG() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste document code first", 'error');
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
async function printDocument() {
  const content = htmlEditor.value.trim();
  if (!content) {
    showToast("Please write or paste document code first", 'error');
    return;
  }

  showToast("Opening browser print dialog...", 'info');
  try {
    previewFrame.contentWindow.focus();
    previewFrame.contentWindow.print();
  } catch (err) {
    const htmlToSend = await getActiveHtml();
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlToSend);
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

