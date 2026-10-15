/**
 * Professional Markdown-to-PDF Themes
 * High-typography, print-optimized styles for documentation, research, and executive reports.
 */

export const MARKDOWN_THEMES = {
  github: {
    name: "GitHub Modern",
    description: "Standard developer look with rounded tables, callouts, and clean borders",
    css: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.6;
        color: #1f2328;
        background: #ffffff;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #1f2328;
        font-weight: 600;
        margin-top: 18px;
        margin-bottom: 8px;
        page-break-after: avoid;
      }
      h1 { font-size: 20pt; border-bottom: 1px solid #d0d7de; padding-bottom: 6px; }
      h2 { font-size: 14pt; border-bottom: 1px solid #d0d7de; padding-bottom: 4px; }
      h3 { font-size: 12pt; }
      h4 { font-size: 10.5pt; }
      p, ul, ol, blockquote, table, pre { margin-bottom: 10px; }
      a { color: #0969da; text-decoration: none; }
      blockquote {
        border-left: 4px solid #d0d7de;
        color: #656d76;
        padding: 4px 14px;
        margin: 10px 0;
        background: #f6f8fa;
        border-radius: 0 4px 4px 0;
      }
      code {
        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        font-size: 8.8pt;
        background-color: rgba(175, 184, 193, 0.2);
        padding: 2px 5px;
        border-radius: 4px;
      }
      pre code {
        background-color: transparent;
        padding: 0;
      }
      .code-block-wrapper {
        background: #f6f8fa;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        margin: 12px 0;
        overflow: hidden;
        page-break-inside: avoid;
      }
      .code-block-header {
        background: #eaeef2;
        padding: 4px 10px;
        font-size: 8pt;
        font-family: monospace;
        color: #57606a;
        font-weight: 600;
        text-transform: uppercase;
        border-bottom: 1px solid #d0d7de;
      }
      pre {
        padding: 10px 14px;
        overflow-x: auto;
        font-family: "JetBrains Mono", monospace;
        font-size: 8.8pt;
        line-height: 1.45;
        margin: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 9pt;
        page-break-inside: avoid;
      }
      th, td {
        padding: 7px 10px;
        border: 1px solid #d0d7de;
      }
      th {
        background: #f6f8fa;
        font-weight: 600;
        text-align: left;
      }
      tr:nth-child(even) td {
        background: #fcfdfe;
      }
      hr {
        height: 2px;
        background: #d0d7de;
        border: none;
        margin: 18px 0;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `
  },

  academic: {
    name: "Academic Research (IEEE / arXiv)",
    description: "Serif typography, formal math numbering, justified text, and classic paper layout",
    css: `
      body {
        font-family: "Latin Modern Roman", "Computer Modern", Georgia, "Times New Roman", serif;
        font-size: 10.5pt;
        line-height: 1.65;
        color: #111827;
        background: #ffffff;
        text-align: justify;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #000000;
        font-weight: 700;
        margin-top: 20px;
        margin-bottom: 8px;
        page-break-after: avoid;
      }
      h1 { font-size: 18pt; text-align: center; margin-bottom: 14px; }
      h2 { font-size: 13pt; border-bottom: 1px solid #000000; padding-bottom: 2px; text-transform: uppercase; letter-spacing: 0.04em; }
      h3 { font-size: 11pt; }
      p { margin-bottom: 8px; text-indent: 1.5em; }
      p:first-of-type, h1 + p, h2 + p, h3 + p, .no-indent { text-indent: 0; }
      blockquote {
        font-style: italic;
        margin: 12px 24px;
        padding-left: 12px;
        border-left: 2px solid #374151;
        color: #374151;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 9pt;
        page-break-inside: avoid;
        border-top: 2px solid #000000;
        border-bottom: 2px solid #000000;
      }
      th {
        border-bottom: 1px solid #000000;
        padding: 6px 8px;
        font-weight: 600;
        text-align: left;
      }
      td {
        padding: 6px 8px;
        border: none;
        border-bottom: 1px solid #e5e7eb;
      }
      .code-block-wrapper {
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        margin: 12px 0;
        border-radius: 4px;
      }
      pre {
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 8.5pt;
        padding: 10px 12px;
        margin: 0;
      }
      .katex-display {
        margin: 14px 0 !important;
        text-align: center;
      }
    `
  },

  executive: {
    name: "Executive Tech Spec",
    description: "Deep navy headers, teal accents, modern product specification format",
    css: `
      body {
        font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        font-size: 10pt;
        line-height: 1.55;
        color: #1e293b;
        background: #ffffff;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #0f172a;
        font-weight: 700;
        margin-top: 18px;
        margin-bottom: 8px;
        page-break-after: avoid;
      }
      h1 { font-size: 22pt; color: #1e3a8a; border-bottom: 3px solid #0d9488; padding-bottom: 6px; }
      h2 { font-size: 14pt; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; }
      h3 { font-size: 11.5pt; color: #0d9488; }
      p, ul, ol { margin-bottom: 8px; }
      blockquote {
        background: #f0fdf4;
        border-left: 4px solid #10b981;
        padding: 8px 14px;
        border-radius: 0 6px 6px 0;
        color: #065f46;
        margin: 10px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 9pt;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        border-radius: 6px;
        overflow: hidden;
      }
      th {
        background: #1e293b;
        color: #ffffff;
        font-weight: 600;
        padding: 8px 10px;
        text-align: left;
      }
      td {
        padding: 7px 10px;
        border-bottom: 1px solid #e2e8f0;
      }
      tr:nth-child(even) td {
        background: #f8fafc;
      }
      .code-block-wrapper {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #0f172a;
        color: #f8fafc;
        margin: 12px 0;
      }
      .code-block-header {
        background: #1e293b;
        color: #94a3b8;
        padding: 4px 10px;
        font-size: 8pt;
        font-family: monospace;
        border-bottom: 1px solid #334155;
      }
      pre {
        padding: 10px 14px;
        margin: 0;
        color: #f1f5f9;
        font-size: 8.8pt;
        font-family: "JetBrains Mono", monospace;
      }
      code {
        background: #f1f5f9;
        color: #0f172a;
        padding: 2px 5px;
        border-radius: 4px;
        font-size: 8.8pt;
        font-family: "JetBrains Mono", monospace;
      }
      pre code {
        background: transparent;
        color: inherit;
        padding: 0;
      }
    `
  },

  minimalist: {
    name: "Minimalist Elegant",
    description: "Generous whitespace, refined contrast, and clean layout",
    css: `
      body {
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 10pt;
        line-height: 1.7;
        color: #27272a;
        background: #ffffff;
      }
      h1, h2, h3 {
        color: #09090b;
        font-weight: 600;
        letter-spacing: -0.02em;
        margin-top: 22px;
        margin-bottom: 8px;
        page-break-after: avoid;
      }
      h1 { font-size: 20pt; }
      h2 { font-size: 14pt; }
      h3 { font-size: 11pt; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 9pt;
      }
      th {
        font-weight: 600;
        padding: 8px 12px;
        text-align: left;
        border-bottom: 2px solid #27272a;
      }
      td {
        padding: 8px 12px;
        border-bottom: 1px solid #e4e4e7;
      }
      .code-block-wrapper {
        border-left: 3px solid #18181b;
        background: #fafafa;
        padding: 10px 14px;
        margin: 12px 0;
      }
      pre {
        margin: 0;
        font-family: "JetBrains Mono", monospace;
        font-size: 8.8pt;
      }
    `
  }
};
