import { defineConfig } from 'vite';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Standard paper dimensions in inches for Chromium CDP printToPDF
 */
const PAPER_DIMENSIONS_INCHES = {
  a4: { portrait: [8.27, 11.69], landscape: [11.69, 8.27] },
  letter: { portrait: [8.5, 11.0], landscape: [11.0, 8.5] },
  legal: { portrait: [8.5, 14.0], landscape: [14.0, 8.5] }
};

/**
 * Automatically find an installed Chromium-based browser (Edge, Chrome, Brave, Chromium)
 * Supports Windows (32/64-bit, user AppData), macOS, and Linux.
 */
function findBrowserExecutable() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  if (process.env.EDGE_BIN && fs.existsSync(process.env.EDGE_BIN)) return process.env.EDGE_BIN;

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (isWin) {
    const candidates = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  } else if (isMac) {
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  } else {
    // Linux / BSD
    const candidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
      '/snap/bin/chromium'
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

/**
 * Terminate a process and all of its spawned child processes cleanly
 */
function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', pid.toString(), '/T', '/F']);
    } catch (e) {}
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch (e) {
      try { process.kill(pid, 'SIGKILL'); } catch (e2) {}
    }
  }
}

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
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Method not allowed');
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        if (!rawBody || !rawBody.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Request body is empty' }));
        }

        const {
          html,
          filename = 'document.pdf',
          pageSize = 'a4',
          orientation = 'portrait',
          scale = 1
        } = JSON.parse(rawBody);

        if (!html || !html.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'HTML content cannot be empty' }));
        }

        const pdfBuffer = await renderHtmlToPdf(html, { pageSize, orientation, scale });

        // Encode Content-Disposition with RFC 5987 to support international/UTF-8 filenames
        const asciiSafe = (filename || 'document.pdf')
          .replace(/[^\x20-\x7E]/g, '_')
          .replace(/["\\]/g, '_');
        const rfc5987 = encodeURIComponent(filename || 'document.pdf')
          .replace(/['()]/g, escape)
          .replace(/\*/g, '%2A');

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${asciiSafe}"; filename*=UTF-8''${rfc5987}`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
      } catch (err) {
        console.error('PDF Generation API error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'PDF Generation Failed' }));
      }
    });
  });
}

async function renderHtmlToPdf(html, options = {}) {
  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    throw new Error('No compatible Chromium browser found (Edge, Chrome, Brave, Chromium).');
  }

  const tempDir = path.join(os.tmpdir(), 'pdf_gen_temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tempHtmlPath = path.join(tempDir, `render_${id}.html`);
  fs.writeFileSync(tempHtmlPath, html, 'utf8');

  const port = 9300 + Math.floor(Math.random() * 500);
  const profileDir = path.join(tempDir, `profile_${id}`);

  const browser = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  let isKilled = false;
  const cleanup = () => {
    if (isKilled) return;
    isKilled = true;
    killProcessTree(browser.pid);
    setTimeout(() => {
      try {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
        if (fs.existsSync(profileDir)) fs.rmSync(profileDir, { recursive: true, force: true });
      } catch (e) {}
    }, 400);
  };

  try {
    // 1. Actively poll for browser remote debugging port readiness
    let target = null;
    const maxRetries = 35; // 3.5s maximum wait
    for (let i = 0; i < maxRetries; i++) {
      try {
        const listRes = await fetch(`http://127.0.0.1:${port}/json`);
        if (listRes.ok) {
          const pages = await listRes.json();
          target = pages.find(p => p.type === 'page') || pages[0];
          if (target?.webSocketDebuggerUrl) break;
        }
      } catch (e) {
        // Browser still initializing
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (!target?.webSocketDebuggerUrl) {
      throw new Error('Failed to connect to browser rendering engine');
    }

    const wsUrl = target.webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);

    const pdfBase64 = await new Promise((resolve, reject) => {
      let reqId = 1;
      const timeoutTimer = setTimeout(() => {
        reject(new Error('PDF generation timed out after 20 seconds'));
      }, 20000);

      function send(method, params = {}) {
        const msgId = reqId++;
        return new Promise((res, rej) => {
          const handler = (evt) => {
            try {
              const resp = JSON.parse(evt.data);
              if (resp.id === msgId) {
                ws.removeEventListener('message', handler);
                if (resp.error) rej(new Error(resp.error.message || 'CDP Error'));
                else res(resp.result);
              }
            } catch (err) {
              rej(err);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      }

      ws.onopen = async () => {
        try {
          await send('Page.enable');
          await send('Runtime.enable');

          const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
          await send('Page.navigate', { url: fileUrl });

          // Wait for DOM load and all fonts / images to resolve
          await send('Runtime.evaluate', {
            expression: `
              new Promise((resolve) => {
                const checkReady = () => {
                  const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
                  const images = Array.from(document.images);
                  const imgPromises = images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(r => { img.onload = r; img.onerror = r; });
                  });
                  Promise.all([fontReady, ...imgPromises]).then(() => resolve(true));
                };

                if (document.readyState === 'complete') {
                  checkReady();
                } else {
                  window.addEventListener('load', checkReady, { once: true });
                }
                setTimeout(resolve, 3500); // safety cap for slow network assets
              })
            `,
            awaitPromise: true,
            returnByValue: true
          });

          // Layout paint stabilization pause
          await new Promise(r => setTimeout(r, 150));

          // Calculate explicit paper dimensions
          const sizeKey = (options.pageSize || 'a4').toLowerCase();
          const orientKey = (options.orientation || 'portrait').toLowerCase();
          const dims = PAPER_DIMENSIONS_INCHES[sizeKey]?.[orientKey] || PAPER_DIMENSIONS_INCHES.a4.portrait;
          const [paperWidth, paperHeight] = dims;

          const printResult = await send('Page.printToPDF', {
            printBackground: true,
            preferCSSPageSize: true, // Honors CSS @page size & margins if specified
            paperWidth: paperWidth,
            paperHeight: paperHeight,
            landscape: orientKey === 'landscape',
            scale: Math.min(2, Math.max(0.1, Number(options.scale || 1))),
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0
          });

          clearTimeout(timeoutTimer);
          const pdfData = printResult?.data;
          if (pdfData) {
            resolve(pdfData);
          } else {
            reject(new Error('PDF engine returned empty data'));
          }
        } catch (e) {
          clearTimeout(timeoutTimer);
          reject(e);
        }
      };

      ws.onerror = (e) => {
        clearTimeout(timeoutTimer);
        reject(e);
      };
    });

    return Buffer.from(pdfBase64, 'base64');
  } finally {
    cleanup();
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
