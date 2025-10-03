import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShowPdfProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
}

const ShowPdf: React.FC<ShowPdfProps> = ({ open, onOpenChange, pdfUrl }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent
        className="max-w-5xl h-[90vh] p-0 overflow-hidden flex flex-col bg-gray-600 text-white"
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold text-white">
            PDF Preview
          </DialogTitle>
          
        </DialogHeader>

        <div className="flex-1">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0`} // #toolbar=0 hides default PDF toolbar if supported
              title="PDF Preview"
              className="w-full h-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">Loading PDF...</p>
            </div>
          )}
        </div>

        {/* ✅ Fallback link for mobile/iOS where iframe might fail */}
        {pdfUrl && (
          <div className="p-3 border-t text-center bg-gray-600 text-white">
            <Button asChild variant="outline" size="sm">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in New Tab / Download
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShowPdf;
