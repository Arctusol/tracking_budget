import * as pdfjsLib from 'pdfjs-dist';

// Initialisation de PDF.js
export function initPDFJS() {
    if (typeof window === 'undefined') return;

    const workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
    ).toString();

    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}
