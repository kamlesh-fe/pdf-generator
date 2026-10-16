import { marked } from 'marked';
import katex from 'katex';
import mermaid from 'mermaid';
import * as yaml from 'js-yaml';
import Prism from './prismSetup.js';
import { MARKDOWN_THEMES } from './markdownThemes.js';

// Initialize Mermaid once
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif'
  });
} catch (e) {
  console.warn('Mermaid initialization warning:', e);
}

/**
 * GitHub Alert SVG Icons and Theme Configuration
 */
const ALERT_CONFIG = {
  note: {
    title: 'Note',
    color: '#0969da',
    bg: '#ddf4ff',
    border: '#54aeff',
    icon: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>`
  },
  tip: {
    title: 'Tip',
    color: '#1a7f37',
    bg: '#dafbe1',
    border: '#4ac26b',
    icon: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.21c-.04-.283-.19-.57-.442-.934a6.732 6.732 0 0 0-.676-.853l-.213-.252C3.076 7.55 2.5 6.666 2.5 5.25 2.5 2.37 4.887 0 8 0s5.5 2.37 5.5 5.25c0 1.416-.576 2.3-1.17 2.996l-.214.252c-.22.261-.468.55-.674.853-.252.364-.402.651-.442.934a.75.75 0 0 1-1.484-.21c.084-.594.337-1.079.621-1.49.203-.292.45-.584.673-.848l.214-.253c.56-.679.984-1.32.984-2.304 0-2.06-1.637-3.75-4-3.75ZM6 11.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z"></path></svg>`
  },
  important: {
    title: 'Important',
    color: '#8250df',
    bg: '#fbefff',
    border: '#c297ff',
    icon: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>`
  },
  warning: {
    title: 'Warning',
    color: '#9a6700',
    bg: '#fff8c5',
    border: '#d4a72c',
    icon: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>`
  },
  caution: {
    title: 'Caution',
    color: '#cf222e',
    bg: '#ffebe9',
    border: '#ff8182',
    icon: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M4.47.047a.75.75 0 0 1 1.06 0l10.424 10.423a.75.75 0 0 1 0 1.06L11.53 15.953a.75.75 0 0 1-1.06 0L.046 5.529a.75.75 0 0 1 0-1.06Zm.53 1.59L1.59 5.06l9.35 9.35 3.47-3.47Zm4.75 4.113v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>`
  }
};

/**
 * Competitor-Level Markdown to Print-Ready HTML Compiler
 */
export async function compileMarkdown(markdownRaw, options = {}) {
  const {
    theme = 'github',
    pageSize = 'a4',
    orientation = 'portrait',
    scale = 1
  } = options;

  let content = markdownRaw || '';

  // 1. Extract and Parse YAML Frontmatter
  let frontmatter = null;
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (fmMatch) {
    try {
      frontmatter = yaml.load(fmMatch[1]);
    } catch (e) {
      console.warn('Frontmatter parsing error:', e);
      // Resilient line-by-line fallback for titles with unquoted colons
      try {
        frontmatter = {};
        fmMatch[1].split(/\r?\n/).forEach(line => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            const k = line.substring(0, idx).trim();
            const v = line.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (k) frontmatter[k] = v;
          }
        });
      } catch (e2) {}
    }
    content = content.slice(fmMatch[0].length);
  }

  // 2. Protect and Extract KaTeX Math Equations
  const mathBlocks = [];
  const mathInlines = [];

  // Display math: $$ ... $$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (m, math) => {
    const idx = mathBlocks.length;
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false
      });
      mathBlocks.push(`<div class="katex-display-wrapper">${rendered}</div>`);
    } catch (e) {
      mathBlocks.push(`<pre class="katex-error">${math}</pre>`);
    }
    return `@@@MATH_BLOCK_${idx}@@@`;
  });

  // Inline math: $ ... $ (resilient to currency signs and spaces)
  content = content.replace(/(?<!\\)\$([^\s\$](?:[^$]*?[^\s\$])?)\$(?!\d)/g, (m, math) => {
    const idx = mathInlines.length;
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false
      });
      mathInlines.push(rendered);
    } catch (e) {
      mathInlines.push(math);
    }
    return `@@@MATH_INLINE_${idx}@@@`;
  });

  // 3. GitHub Alerts / Callout conversion
  content = content.replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)/gim, (m, type, rawBody) => {
    const alertKey = type.toLowerCase();
    const cfg = ALERT_CONFIG[alertKey] || ALERT_CONFIG.note;
    const bodyText = rawBody.replace(/^>\s?/gm, '').trim();
    return `<div class="markdown-alert markdown-alert-${alertKey}">\n<div class="alert-header">${cfg.icon} <span>${cfg.title}</span></div>\n<div class="alert-content">\n\n${bodyText}\n\n</div>\n</div>\n\n`;
  });

  // 4. Page Break Directive conversion
  content = content.replace(/(?:<!--\s*pagebreak\s*-->|\\pagebreak|===pagebreak===)/gi, '\n\n<div class="page-break"></div>\n\n');

  // 5. Automatic Table of Contents [TOC]
  if (/\[\[?TOC\]?\]/i.test(content)) {
    const tocList = generateTOC(content);
    content = content.replace(/\[\[?TOC\]?\]/gi, tocList);
  }

  // Protect all code blocks from inline syntax replacements (e.g. '==' in code turning into <mark>)
  const codePlaceholders = [];
  content = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const idx = codePlaceholders.length;
    codePlaceholders.push(match);
    return `@@@CODE_BLOCK_PROTECTED_${idx}@@@`;
  });

  // 6. Inline Formatting Enhancements (Mark, Sub, Sup)
  content = content.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
  content = content.replace(/(?<![\\~])~([^~\s\n]+)~(?!~)/g, '<sub>$1</sub>');
  content = content.replace(/(?<![\\\^])\^([^\^\s\n]+)\^(?!\^)/g, '<sup>$1</sup>');

  // Restore protected code blocks
  content = content.replace(/@@@CODE_BLOCK_PROTECTED_(\d+)@@@/g, (m, idx) => {
    return codePlaceholders[Number(idx)];
  });

  // 7. Footnotes Processing
  const footnotes = [];
  content = content.replace(/(?:^|\n)\[\^([a-zA-Z0-9_-]+)\]:\s*([^\n]+(?:\n+(?: {4}|\t)[^\n]+)*)/g, (m, id, text) => {
    footnotes.push({ id: id.trim(), text: text.trim() });
    return '';
  });
  content = content.replace(/\[\^([a-zA-Z0-9_-]+)\]/g, (m, id) => {
    return `<sup><a href="#fn-${id}" id="fnref-${id}" class="footnote-ref">[${id}]</a></sup>`;
  });

  // 8. Configure Marked with Code Highlighting, Image Renderer & Mermaid extraction
  const mermaidBlocks = [];
  const renderer = new marked.Renderer();

  // Enhanced Image Renderer with Sizing, Alignment, Caption & Error Fallback
  renderer.image = function(arg1, arg2, arg3) {
    let href = '';
    let title = '';
    let text = '';

    if (typeof arg1 === 'object' && arg1 !== null) {
      href = arg1.href || '';
      title = arg1.title || '';
      text = arg1.text || '';
    } else {
      href = arg1 || '';
      title = arg2 || '';
      text = arg3 || '';
    }

    let cleanHref = (href || '').trim();
    let altText = (text || '').trim();
    let imgTitle = (title || '').trim();

    let customStyle = '';
    let alignClass = 'align-center';

    // Support sizing & alignment syntax in alt: ![alt|500x300](url) or ![alt|width=300](url) or ![alt|center](url)
    if (altText.includes('|')) {
      const parts = altText.split('|');
      altText = parts[0].trim();
      const meta = parts.slice(1).join(' ').trim().toLowerCase();

      if (meta.includes('left')) alignClass = 'align-left';
      else if (meta.includes('right')) alignClass = 'align-right';
      else if (meta.includes('center')) alignClass = 'align-center';

      const dimMatch = meta.match(/(\d+)x(\d+)/);
      const widthMatch = meta.match(/(?:width=|w=)?(\d+(?:%|px)?)/);
      if (dimMatch) {
        customStyle = `width: ${dimMatch[1]}px; height: ${dimMatch[2]}px;`;
      } else if (widthMatch) {
        const w = widthMatch[1].endsWith('%') || widthMatch[1].endsWith('px') ? widthMatch[1] : `${widthMatch[1]}px`;
        customStyle = `width: ${w};`;
      }
    }

    const caption = imgTitle || (altText && !/^image(\.\w+)?$/i.test(altText) ? altText : '');

    return `
      <figure class="markdown-image-wrapper ${alignClass}">
        <img src="${escapeHtml(cleanHref)}" alt="${escapeHtml(altText)}" ${imgTitle ? `title="${escapeHtml(imgTitle)}"` : ''} class="markdown-image" style="${customStyle}" loading="lazy" onerror="this.onerror=null;this.classList.add('img-error');this.alt='[Image: ' + (this.alt || 'Unavailable') + ']';" />
        ${caption ? `<figcaption class="image-caption">${escapeHtml(caption)}</figcaption>` : ''}
      </figure>
    `;
  };

  renderer.code = function(arg1, arg2) {
    let text = '';
    let lang = '';
    if (typeof arg1 === 'object' && arg1 !== null) {
      text = arg1.text || '';
      lang = arg1.lang || '';
    } else {
      text = arg1 || '';
      lang = arg2 || '';
    }
    const rawLang = (lang || '').trim();
    const language = rawLang.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    // Check for Mermaid diagram
    if (language === 'mermaid') {
      const idx = mermaidBlocks.length;
      mermaidBlocks.push(text.trim());
      return `@@@MERMAID_BLOCK_${idx}@@@`;
    }

    // Prism Code Syntax Highlighting with Language Aliases
    let highlighted = escapeHtml(text);
    const aliasMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'cs': 'csharp',
      'c++': 'cpp',
      'sh': 'bash',
      'shell': 'bash',
      'zsh': 'bash',
      'yml': 'yaml',
      'dockerfile': 'docker',
      'kt': 'kotlin'
    };
    const resolvedLang = aliasMap[language] || language;

    if (Prism.languages[resolvedLang]) {
      try {
        highlighted = Prism.highlight(text, Prism.languages[resolvedLang], resolvedLang);
      } catch (e) {}
    } else if (resolvedLang === 'html' || resolvedLang === 'xml' || resolvedLang === 'svg') {
      try {
        highlighted = Prism.highlight(text, Prism.languages.markup, 'markup');
      } catch (e) {}
    }

    const displayLang = resolvedLang || 'code';
    return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">${displayLang}</span></div><pre><code class="language-${displayLang}">${highlighted}</code></pre></div>`;
  };

  // Checkbox Task Lists
  renderer.checkbox = function(arg) {
    const checked = typeof arg === 'object' && arg !== null ? !!arg.checked : !!arg;
    return `<input type="checkbox" ${checked ? 'checked' : ''} disabled class="task-checkbox"> `;
  };

  // Heading Anchors with Slug IDs for TOC Navigation
  renderer.heading = function(arg1, arg2) {
    let text = '';
    let depth = 1;
    if (typeof arg1 === 'object' && arg1 !== null) {
      text = arg1.text || '';
      depth = arg1.depth || 1;
    } else {
      text = arg1 || '';
      depth = arg2 || 1;
    }
    const cleanText = text.replace(/<[^>]+>/g, '').replace(/[*_`]/g, '');
    const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: true,
    renderer
  });

  let htmlBody = await marked.parse(content);

  // Append Footnotes Section if any
  if (footnotes.length > 0) {
    let fnHtml = '<section class="footnotes"><hr class="footnotes-sep"><ol class="footnotes-list">';
    for (const fn of footnotes) {
      fnHtml += `<li id="fn-${fn.id}"><p>${fn.text} <a href="#fnref-${fn.id}" class="footnote-backref" title="Back to reference">&#8617;</a></p></li>`;
    }
    fnHtml += '</ol></section>';
    htmlBody += fnHtml;
  }

  // 7. Render Mermaid Diagrams Asynchronously
  for (let i = 0; i < mermaidBlocks.length; i++) {
    const mermaidCode = mermaidBlocks[i];
    let renderedSvg = '';
    const diagId = `mermaid_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;

    if (typeof document === 'undefined') {
      renderedSvg = `<pre class="mermaid">${escapeHtml(mermaidCode)}</pre>`;
    } else {
      let renderContainer = document.getElementById('mermaid-render-container');
      if (!renderContainer) {
        renderContainer = document.createElement('div');
        renderContainer.id = 'mermaid-render-container';
        renderContainer.setAttribute('aria-hidden', 'true');
        renderContainer.style.cssText = 'position: absolute; left: 0; top: 0; width: 1400px; min-height: 1000px; opacity: 0; pointer-events: none; z-index: -9999;';
        document.body.appendChild(renderContainer);
      }
      try {
        const result = await mermaid.render(diagId, mermaidCode, renderContainer);
        renderedSvg = result?.svg || '';
      } catch (err) {
        console.warn('Mermaid render error:', err);
        renderedSvg = `<div class="mermaid-error"><p><strong>Diagram Error:</strong> ${escapeHtml(err.message || 'Syntax error')}</p><pre>${escapeHtml(mermaidCode)}</pre></div>`;
      } finally {
        if (renderContainer) renderContainer.innerHTML = '';
        const svgEl = document.getElementById(diagId);
        if (svgEl) svgEl.remove();
        const wrapperEl = document.getElementById(`d${diagId}`);
        if (wrapperEl) wrapperEl.remove();
      }

      if (renderedSvg && renderedSvg.includes('<svg')) {
        // Strip hardcoded inline max-width, height, and width attributes that break print page boundaries
        renderedSvg = renderedSvg.replace(/<svg\b([^>]*?)>/i, (m, attrs) => {
          let clean = attrs
            .replace(/\sheight="[^"]*"/gi, '')
            .replace(/\sstyle="[^"]*"/gi, '');
          if (!clean.includes('preserveAspectRatio')) {
            clean += ' preserveAspectRatio="xMidYMid meet"';
          }
          return `<svg ${clean}>`;
        });
      }
    }

    // Use function replacer to prevent special $ patterns from corrupting SVG markup
    htmlBody = htmlBody.replace(`@@@MERMAID_BLOCK_${i}@@@`, () => `<div class="mermaid-diagram-wrapper">${renderedSvg}</div>`);
  }

  // 8. Restore KaTeX Math Placeholders (Use function replacers to protect math symbols)
  mathBlocks.forEach((block, idx) => {
    htmlBody = htmlBody.replace(`@@@MATH_BLOCK_${idx}@@@`, () => block);
  });
  mathInlines.forEach((inline, idx) => {
    htmlBody = htmlBody.replace(`@@@MATH_INLINE_${idx}@@@`, () => inline);
  });

  // 9. Build Frontmatter Title Header
  let frontmatterHtml = '';
  let docTitle = 'document';
  if (frontmatter && typeof frontmatter === 'object') {
    docTitle = frontmatter.title || docTitle;
    frontmatterHtml = `
      <header class="document-frontmatter">
        ${frontmatter.title ? `<h1 class="fm-title">${escapeHtml(frontmatter.title)}</h1>` : ''}
        ${frontmatter.subtitle ? `<div class="fm-subtitle">${escapeHtml(frontmatter.subtitle)}</div>` : ''}
        <div class="fm-meta-row">
          ${frontmatter.author ? `<div class="fm-meta-item"><strong>Author:</strong> ${escapeHtml(frontmatter.author)}</div>` : ''}
          ${frontmatter.date ? `<div class="fm-meta-item"><strong>Date:</strong> ${escapeHtml(String(frontmatter.date))}</div>` : ''}
          ${frontmatter.version ? `<div class="fm-meta-item"><strong>Version:</strong> ${escapeHtml(String(frontmatter.version))}</div>` : ''}
        </div>
      </header>
    `;
  }

  // 10. Assemble Complete Print-Ready Document
  const themeObj = MARKDOWN_THEMES[theme] || MARKDOWN_THEMES.github;

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    /* Print Layout Metrics */
    @page {
      size: ${pageSize} ${orientation};
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
    }
    body {
      padding: 20px;
      zoom: ${scale};
    }
    @media print {
      body {
        padding: 0 !important;
      }
    }

    /* Selected Theme CSS */
    ${themeObj.css}

    /* Common Essential Print & Markdown Utilities */
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      height: 0;
      margin: 0;
      padding: 0;
      border: none;
    }
    @media screen {
      .page-break {
        display: block;
        height: 20px;
        margin: 24px 0;
        border-top: 2px dashed #94a3b8;
        position: relative;
      }
      .page-break::after {
        content: "✂ Page Break (PDF splits here)";
        position: absolute;
        top: -11px;
        left: 50%;
        transform: translateX(-50%);
        background: #f1f5f9;
        color: #64748b;
        font-size: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 2px 10px;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        letter-spacing: 0.03em;
      }
    }

    thead {
      display: table-header-group;
    }
    tr {
      break-inside: auto;
      page-break-inside: auto;
    }

    /* Frontmatter Header */
    .document-frontmatter {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .fm-title {
      font-size: 22pt !important;
      font-weight: 700 !important;
      margin: 0 0 6px 0 !important;
      border-bottom: none !important;
      padding: 0 !important;
      line-height: 1.25 !important;
    }
    .fm-subtitle {
      font-size: 12.5pt;
      color: #64748b;
      margin-bottom: 12px;
    }
    .fm-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 9pt;
      color: #475569;
    }

    /* Table of Contents */
    .toc-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 18px;
      margin: 16px 0 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .toc-title {
      font-size: 11pt;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
    }
    .toc-list {
      list-style-type: none;
      padding-left: 0;
      margin: 0;
    }
    .toc-list li { margin: 4px 0; font-size: 9.5pt; }
    .toc-list li.toc-h2 { padding-left: 16px; }
    .toc-list li.toc-h3 { padding-left: 32px; font-size: 9pt; }
    .toc-list a { color: #2563eb; text-decoration: none; }

    /* GitHub Alert Callouts */
    .markdown-alert {
      padding: 10px 14px;
      margin: 12px 0;
      border-left: 4px solid #d0d7de;
      border-radius: 0 6px 6px 0;
      break-inside: avoid;
      page-break-inside: avoid;
      font-size: 9.5pt;
    }
    .alert-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .markdown-alert-note { background: #ddf4ff; border-left-color: #0969da; color: #0969da; }
    .markdown-alert-tip { background: #dafbe1; border-left-color: #1a7f37; color: #1a7f37; }
    .markdown-alert-important { background: #fbefff; border-left-color: #8250df; color: #8250df; }
    .markdown-alert-warning { background: #fff8c5; border-left-color: #9a6700; color: #9a6700; }
    .markdown-alert-caution { background: #ffebe9; border-left-color: #cf222e; color: #cf222e; }
    .alert-content { color: #1f2328; }

    /* Checkbox Task Lists */
    .task-checkbox {
      vertical-align: middle;
      margin-right: 6px;
      accent-color: #2563eb;
    }

    /* Code Blocks Splitting & Line Wrapping */
    .code-block-wrapper {
      break-inside: auto !important;
      page-break-inside: auto !important;
      margin: 10px 0 12px 0;
      overflow: visible;
    }
    .code-block-header {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    pre,
    pre code,
    code {
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }
    pre {
      break-inside: auto !important;
      page-break-inside: auto !important;
      overflow: visible;
      line-height: 1.4;
      orphans: 3;
      widows: 3;
    }

    /* Mermaid Diagrams */
    .mermaid-diagram-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 12px 0 16px 0;
      break-inside: avoid;
      page-break-inside: avoid;
      overflow: visible;
      width: 100%;
    }
    .mermaid-diagram-wrapper svg {
      display: block;
      max-width: 100% !important;
      max-height: 200mm !important;
      width: auto !important;
      height: auto !important;
      object-fit: contain;
    }
    @media screen {
      .mermaid-diagram-wrapper svg {
        max-height: 650px !important;
      }
    }
    @media print {
      .mermaid-diagram-wrapper {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        overflow: visible !important;
      }
      .mermaid-diagram-wrapper svg {
        max-width: 100% !important;
        max-height: 195mm !important;
        width: auto !important;
        height: auto !important;
      }
    }
    .mermaid-error {
      background: #fef2f2;
      border: 1px solid #f87171;
      padding: 10px;
      border-radius: 6px;
      color: #991b1b;
      margin: 12px 0;
    }

    /* KaTeX Math */
    .katex-display-wrapper {
      margin: 12px 0;
      display: flex;
      justify-content: center;
      overflow: visible;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .katex {
      font-size: 1.05em;
    }

    /* Global Scrollbar Suppression */
    pre,
    code,
    .code-block-wrapper,
    .mermaid-diagram-wrapper,
    .katex-display-wrapper {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    pre::-webkit-scrollbar,
    code::-webkit-scrollbar,
    .code-block-wrapper::-webkit-scrollbar,
    .mermaid-diagram-wrapper::-webkit-scrollbar,
    .katex-display-wrapper::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    @media print {
      pre,
      code,
      .code-block-wrapper,
      .mermaid-diagram-wrapper,
      .katex-display-wrapper,
      main.markdown-body {
        overflow: visible !important;
        overflow-x: visible !important;
        overflow-y: visible !important;
      }
      .code-block-wrapper {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      pre {
        break-inside: auto !important;
        page-break-inside: auto !important;
        white-space: pre-wrap !important;
        word-break: break-word !important;
      }
      h1, h2, h3, h4, h5, h6 {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
    }

    /* Markdown Images & Figures */
    .markdown-image-wrapper {
      margin: 16px 0;
      page-break-inside: avoid;
    }
    .markdown-image-wrapper.align-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .markdown-image-wrapper.align-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
    .markdown-image-wrapper.align-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }
    .markdown-image,
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      object-fit: contain;
    }
    .markdown-image.img-error {
      display: inline-block;
      padding: 12px 18px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      color: #64748b;
      font-size: 9pt;
      font-family: monospace;
      min-width: 200px;
    }
    .image-caption {
      margin-top: 6px;
      font-size: 8.5pt;
      color: #64748b;
      font-style: italic;
      line-height: 1.4;
    }

    /* Footnotes */
    .footnote-ref {
      font-size: 0.75em;
      vertical-align: super;
      text-decoration: none;
      color: #2563eb;
      font-weight: 600;
      padding: 0 2px;
    }
    .footnotes {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5pt;
      color: #64748b;
      page-break-inside: avoid;
    }
    .footnotes-sep {
      display: none;
    }
    .footnotes-list {
      padding-left: 20px;
      margin: 0;
    }
    .footnotes-list li {
      margin-bottom: 6px;
    }
    .footnote-backref {
      text-decoration: none;
      color: #2563eb;
      margin-left: 4px;
    }

    /* Inline Elements: Mark, Kbd, Sub, Sup */
    mark {
      background-color: #fef08a;
      color: #1f2937;
      padding: 1px 4px;
      border-radius: 3px;
    }
    kbd {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      border-radius: 4px;
      box-shadow: 0 1px 1px rgba(0,0,0,0.05);
      color: #334155;
      display: inline-block;
      font-family: "JetBrains Mono", monospace;
      font-size: 0.82em;
      line-height: 1;
      padding: 2px 5px;
      white-space: nowrap;
    }
    sub, sup {
      font-size: 75%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }
    sup { top: -0.5em; }
    sub { bottom: -0.25em; }

    /* Syntax Highlighting Tokens (Vibrant IDE Colors in Preview & PDF) */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #6e7781;
      font-style: italic;
    }
    .token.punctuation {
      color: #24292f;
    }
    .token.property,
    .token.tag,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #0550ae;
    }
    .token.boolean,
    .token.number {
      color: #0550ae;
    }
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #0a3069;
    }
    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string {
      color: #cf222e;
    }
    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #cf222e;
      font-weight: 600;
    }
    .token.function,
    .token.class-name {
      color: #8250df;
      font-weight: 600;
    }
    .token.regex,
    .token.important,
    .token.variable {
      color: #953800;
    }
  </style>
</head>
<body>
  ${frontmatterHtml}
  <main class="markdown-body">
    ${htmlBody}
  </main>
</body>
</html>`;

  return fullHtml;
}

/**
 * Generate Hierarchical Table of Contents from headings
 */
function generateTOC(markdownText) {
  const headings = [];
  const lines = markdownText.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim().replace(/[*_`]/g, '');
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ level, title, id });
    }
  }

  if (headings.length === 0) return '';

  let tocHtml = '<nav class="toc-container"><div class="toc-title">Table of Contents</div><ul class="toc-list">';
  for (const h of headings) {
    tocHtml += `<li class="toc-h${h.level}"><a href="#${h.id}">${escapeHtml(h.title)}</a></li>`;
  }
  tocHtml += '</ul></nav>';
  return tocHtml;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
