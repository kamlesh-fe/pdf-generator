import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Paper dimensions in millimeters
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
  const [widthMm, heightMm] = PAPER_SIZES_MM[size]?.[orientation] || PAPER_SIZES_MM.a4.portrait;
  const mmToPx = 96 / 25.4; // ~3.7795 px per mm
  return {
    widthPx: Math.round(widthMm * mmToPx),
    heightPx: Math.round(heightMm * mmToPx),
    widthMm,
    heightMm
  };
}

/**
 * High-Fidelity HTML to PDF Exporter
 * Uses html-to-image (SVG ForeignObject) + jsPDF for 100% visual fidelity
 * Eliminates html2canvas flexbox/grid/clipping bugs.
 */
export async function generatePdfFromIframe(iframe, options = {}) {
  const {
    filename = 'document.pdf',
    pageSize = 'a4',
    orientation = 'portrait',
    marginMm = 8,
    pixelRatio = 2
  } = options;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !doc.body) {
    throw new Error('Preview document body not accessible');
  }

  // 1. Wait for all images inside iframe to fully load
  const images = Array.from(doc.images || []);
  await Promise.all(images.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 3000);
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

  // 3. Ensure exact print color adjustment is applied
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

  // 4. Capture target element: doc.documentElement (contains full styled HTML)
  const targetElement = doc.body;

  // Paper metrics
  const { widthMm, heightMm, widthPx } = getPaperPixelDimensions(pageSize, orientation);

  // 5. Generate high-resolution PNG using html-to-image
  const dataUrl = await toPng(targetElement, {
    pixelRatio: pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
    width: targetElement.scrollWidth || widthPx,
    height: targetElement.scrollHeight,
    style: {
      margin: '0',
      transform: 'none',
      width: (targetElement.scrollWidth || widthPx) + 'px'
    }
  });

  // 6. Build PDF document using jsPDF
  const pdf = new jsPDF({
    unit: 'mm',
    format: [widthMm, heightMm],
    orientation: orientation
  });

  // Usable printable dimensions
  const printableWidthMm = widthMm - (marginMm * 2);
  const printableHeightMm = heightMm - (marginMm * 2);

  // Load image to calculate exact aspect ratio
  const img = new Image();
  img.src = dataUrl;
  await new Promise(resolve => {
    img.onload = resolve;
  });

  const imgWidthPx = img.naturalWidth;
  const imgHeightPx = img.naturalHeight;
  const totalImgHeightMm = (imgHeightPx * printableWidthMm) / imgWidthPx;

  // Single-page or multi-page pagination
  if (totalImgHeightMm <= printableHeightMm + 2) {
    // Fits on a single page
    pdf.addImage(dataUrl, 'PNG', marginMm, marginMm, printableWidthMm, totalImgHeightMm, undefined, 'FAST');
  } else {
    // Multi-page handling: slice the canvas image across pages cleanly
    let remainingHeightMm = totalImgHeightMm;
    let pageOffsetMm = 0;
    let isFirstPage = true;

    while (remainingHeightMm > 0) {
      if (!isFirstPage) {
        pdf.addPage([widthMm, heightMm], orientation);
      }
      isFirstPage = false;

      // Draw the image slice with negative Y offset for subsequent pages
      pdf.addImage(
        dataUrl,
        'PNG',
        marginMm,
        marginMm - pageOffsetMm,
        printableWidthMm,
        totalImgHeightMm,
        undefined,
        'FAST'
      );

      pageOffsetMm += printableHeightMm;
      remainingHeightMm -= printableHeightMm;
    }
  }

  // 7. Save the PDF file
  pdf.save(filename);
  return true;
}
