import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFViewerProps {
  fileUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(numPages, prev + 1));

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileUrl.split("/").pop() || "document.pdf";
    link.click();
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[75vh] bg-white dark:bg-gray-900 rounded-lg shadow-inner overflow-hidden">
      
      {/* === Controls === */}
      <div className="flex md:flex-col flex-row items-center md:items-center justify-center gap-2 md:gap-4 p-2 md:p-3 bg-gray-100 dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-300 dark:border-gray-700 md:w-16">
        {/* Prev Page */}
        <button
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
          className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40"
          title="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page Indicator */}
        <div className="text-xs text-center text-gray-700 dark:text-gray-300">
          {pageNumber}/{numPages || "?"}
        </div>

        {/* Next Page */}
        <button
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
          className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40"
          title="Next Page"
        >
          <ChevronRight size={18} />
        </button>

        {/* Zoom */}
        <button
          onClick={() => setScale((s) => s + 0.25)}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          title="Download PDF"
        >
          <Download size={18} />
        </button>
      </div>

      {/* === PDF Display === */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-2">
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
