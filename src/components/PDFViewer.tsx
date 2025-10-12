import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// ✅ Correct imports for react-pdf v7+
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// ✅ Configure PDF.js worker — no CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  fileUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  // 🔹 Update PDF scale on window resize (responsive behavior)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Auto-scale based on screen size
    if (windowWidth < 640) setScale(0.8);
    else if (windowWidth < 1024) setScale(1);
    else setScale(1.2);

    return () => window.removeEventListener("resize", handleResize);
  }, [windowWidth]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 🔹 Control Bar */}
      <div className="flex flex-wrap justify-center items-center gap-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
        <button
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          ◀ Prev
        </button>

        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page {pageNumber} / {numPages}
        </span>

        <button
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          Next ▶
        </button>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setScale((s) => s + 0.25)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔍+
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔍-
          </button>
        </div>
      </div>

      {/* 🔹 PDF Container */}
      <div className="overflow-auto max-h-[85vh] w-full flex justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p>Loading PDF...</p>}
          error={<p className="text-red-500">Failed to load PDF.</p>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
