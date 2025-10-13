import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ScrollText,
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
  const [continuous, setContinuous] = useState(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNextPage = () => setPageNumber((p) => Math.min(numPages, p + 1));

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileUrl.split("/").pop() || "document.pdf";
    link.click();
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-inner overflow-hidden">

      {/* === Controls === */}
      <div className="flex flex-row md:flex-col items-center justify-center gap-2 p-2 md:p-3 bg-gray-100 dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-300 dark:border-gray-700 
        sticky top-0 md:static z-10">
        
        {/* Prev */}
        {!continuous && (
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40"
            title="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Page Indicator */}
        <div className="text-xs md:text-sm text-center text-gray-700 dark:text-gray-300">
          {continuous ? "Scroll Mode" : `${pageNumber}/${numPages || "?"}`}
        </div>

        {/* Next */}
        {!continuous && (
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40"
            title="Next Page"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Zoom */}
        <div className="flex gap-2">
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
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
        </div>

        {/* Toggle Mode */}
        <button
          onClick={() => setContinuous((c) => !c)}
          className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          title="Toggle View Mode"
        >
          <ScrollText size={18} />
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
      <div className="flex-1 overflow-auto flex justify-center items-start p-2 md:p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p>Loading PDF...</p>}
          error={<p className="text-red-500">Failed to load PDF.</p>}
        >
          {continuous ? (
            Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                className="relative mb-6 flex justify-center items-center"
              >
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                  className="w-full h-auto max-w-full"
                />
                <div className="absolute bottom-2 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                  Page {index + 1} / {numPages}
                </div>
              </div>
            ))
          ) : (
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
              className="w-full h-auto max-w-full"
            />
          )}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
