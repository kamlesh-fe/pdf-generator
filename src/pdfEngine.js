import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Standard paper dimensions in millimeters
 */
const PAPER_SIZES_MM = {
  a4: { portrait: [210, 297], landscape: [297, 210] },
  letter: { portrait: [215.9, 279.4], landscape: [279.4, 215.9] },
  legal: { portrait: [215.9, 355.6], landscape: [355.6, 215.9] }
};

/**
 * Standard 96 DPI pixel widths for each format
 */
export function getPaperPixelDimensions(size = 'a4', orientation = 'portrait') {
  const sizeKey = (size || 'a4').toLowerCase();
  const orientKey = (orientation || 'portrait').toLowerCase();
  const [widthMm, heightMm] = PAPER_SIZES_MM[sizeKey]?.[orientKey] || PAPER_SIZES_MM.a4.portrait;
  const mmToPx = 96 / 25.4; // ~3.7795 px per mm
  return {
    widthPx: Math.round(widthMm * mmToPx),
    heightPx: Math.round(heightMm * mmToPx),
    widthMm,
    heightMm
  };
}

/**
 * High-Fidelity Client-Side Fallback Exporter
 * Uses html-to-image + discrete canvas slicing per page in jsPDF
 * Prevents image bleed, margin overflow, and memory/file bloat.
 */
export async function generatePdfFromIframe(iframe, options = {}) {
  const {
    filename = 'document.pdf',
    pageSize = 'a4',
    orientation = 'portrait',
    marginMm = 0,
    pixelRatio = 2
  } = options;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !doc.body) {
    throw new Error('Preview document body not accessible');
  }

  // 1. Wait for all images inside iframe to fully resolve
  const images = Array.from(doc.images || []);
  await Promise.all(images.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 2500);
    });
  }));

  // 2. Wait for web fonts inside iframe to load
  if (doc.fonts?.ready) {
    try {
      await doc.fonts.ready;
    } catch (e) {
      console.warn('Font loading check skipped:', e);
    }
  }

  // 3. Inject exact print color adjustment style if not already present
  let printStyle = doc.getElementById('print-color-adjust-style');
  if (!printStyle) {
    printStyle = doc.createElement('style');
    printStyle.id = 'print-color-adjust-style';
    printStyle.textContent = `
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;
    doc.head.appendChild(printStyle);
  }

  const { widthMm, heightMm, widthPx } = getPaperPixelDimensions(pageSize, orientation);
  const targetElement = doc.body;

  const scrollWidth = Math.max(doc.documentElement.scrollWidth, targetElement.scrollWidth, widthPx);
  const scrollHeight = Math.max(doc.documentElement.scrollHeight, targetElement.scrollHeight);

  // 4. Generate high-resolution PNG using html-to-image
  const dataUrl = await toPng(targetElement, {
    pixelRatio: pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
    width: scrollWidth,
    height: scrollHeight,
    style: {
      margin: '0',
      transform: 'none',
      width: `${scrollWidth}px`
    }
  });

  // 5. Load image to compute exact source pixel dimensions
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const imgWidthPx = img.naturalWidth;
  const imgHeightPx = img.naturalHeight;

  // 6. Build PDF document using jsPDF with discrete sliced pages
  const pdf = new jsPDF({
    unit: 'mm',
    format: [widthMm, heightMm],
    orientation: orientation
  });

  const printableWidthMm = Math.max(10, widthMm - (marginMm * 2));
  const printableHeightMm = Math.max(10, heightMm - (marginMm * 2));

  // Determine how many source image pixels correspond to one printable page height
  const pxPerMm = imgWidthPx / printableWidthMm;
  const pageHeightInSourcePx = Math.floor(printableHeightMm * pxPerMm);
  const totalPages = Math.max(1, Math.ceil(imgHeightPx / pageHeightInSourcePx));

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      pdf.addPage([widthMm, heightMm], orientation);
    }

    const sy = i * pageHeightInSourcePx;
    const sh = Math.min(pageHeightInSourcePx, imgHeightPx - sy);
    const sliceHeightMm = (sh / imgWidthPx) * printableWidthMm;

    // Create a cleanly isolated canvas slice for this page
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWidthPx;
    sliceCanvas.height = sh;
    const ctx = sliceCanvas.getContext('2d');

    // Fill white background to avoid transparent artifacts
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

    // Draw only this page's portion from the source image
    ctx.drawImage(img, 0, sy, imgWidthPx, sh, 0, 0, imgWidthPx, sh);

    const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(
      sliceDataUrl,
      'JPEG',
      marginMm,
      marginMm,
      printableWidthMm,
      sliceHeightMm,
      undefined,
      'FAST'
    );
  }

  // 7. Save the generated PDF
  pdf.save(filename);
  return true;
}
