import { defineConfig } from 'vite';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Chromium Skia PDF Generator Plugin
 * Uses the system's Edge/Chrome browser to produce 100% exact, vector Skia PDFs
 * with native @page CSS margins, repeating table headers, and zero spacing/gaping issues.
 */
function pdfGeneratorPlugin() {
  return {
    name: 'pdf-generator-api',
    configureServer(server) {
      setupApiEndpoint(server.middlewares);
    },
    configurePreviewServer(server) {
      setupApiEndpoint(server.middlewares);
    }
  };
}

function setupApiEndpoint(middlewares) {
  middlewares.use('/api/generate-pdf', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      return res.end('Method not allowed');
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { html, filename = 'document.pdf', pageSize = 'a4', orientation = 'portrait' } = JSON.parse(body);

        const pdfBuffer = await renderHtmlToPdf(html, { pageSize, orientation });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
      } catch (err) {
        console.error('PDF Generation API error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });
}

async function renderHtmlToPdf(html, options = {}) {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const tempDir = path.join(os.tmpdir(), 'pdf_gen_temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tempHtmlPath = path.join(tempDir, `render_${id}.html`);
  fs.writeFileSync(tempHtmlPath, html, 'utf8');

  const port = 9300 + Math.floor(Math.random() * 500);
  const profileDir = path.join(tempDir, `profile_${id}`);

  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 800));

    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const pages = await listRes.json();
    const target = pages.find(p => p.type === 'page') || pages[0];
    if (!target?.webSocketDebuggerUrl) throw new Error('Could not connect to browser rendering engine');
    const wsUrl = target.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);

    const pdfBase64 = await new Promise((resolve, reject) => {
      let reqId = 1;
      function send(method, params = {}) {
        const msgId = reqId++;
        return new Promise((res) => {
          const handler = (evt) => {
            const resp = JSON.parse(evt.data);
            if (resp.id === msgId) {
              ws.removeEventListener('message', handler);
              res(resp.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      }

      ws.onopen = async () => {
        try {
          await send('Page.enable');
          const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
          await send('Page.navigate', { url: fileUrl });
          // Wait for rendering and fonts
          await new Promise(r => setTimeout(r, 1200));

          const printResult = await send('Page.printToPDF', {
            printBackground: true,
            preferCSSPageSize: true, // Honors CSS @page size & margins!
            landscape: options.orientation === 'landscape'
          });

          console.log('[PDF ENGINE] printResult keys:', Object.keys(printResult || {}));
          const pdfData = printResult?.data || printResult?.result?.data;
          if (pdfData) {
            resolve(pdfData);
          } else {
            console.error('[PDF ENGINE] Unexpected response:', printResult);
            reject(new Error('PDF engine returned empty data'));
          }
        } catch (e) {
          reject(e);
        }
      };

      ws.onerror = reject;
    });

    return Buffer.from(pdfBase64, 'base64');
  } finally {
    edge.kill();
    try {
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
      if (fs.existsSync(profileDir)) fs.rmSync(profileDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

export default defineConfig({
  plugins: [pdfGeneratorPlugin()],
  server: {
    port: 5173,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
