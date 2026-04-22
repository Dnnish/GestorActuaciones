import { useState, useCallback, useRef, useEffect } from "react";
import { Document as PdfDocument, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Document } from "@/hooks/use-documents";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
}

export function PdfViewer({ open, onOpenChange, document: doc }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width - 32);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [open]);

  const pdfUrl = `/api/documents/${doc.id}/download`;

  const handleLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
    setNumPages(pages);
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  function handlePrevPage() {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function handleNextPage() {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  }

  function handleDownload() {
    window.open(pdfUrl, "_blank");
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setCurrentPage(1);
      setNumPages(0);
      setIsLoading(true);
      setHasError(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0 pr-12">
          <DialogTitle className="text-sm font-medium truncate max-w-[70%]" title={doc.filename}>
            {doc.filename}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleDownload} aria-label="Descargar">
            <Download className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div ref={containerRef} className="flex-1 overflow-auto flex items-start justify-center bg-muted/30 p-4">
          {hasError ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No se pudo cargar el PDF</p>
            </div>
          ) : (
            <PdfDocument
              file={pdfUrl}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <p>Cargando PDF...</p>
                </div>
              }
            >
              {!isLoading && (
                <Page
                  pageNumber={currentPage}
                  width={containerWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              )}
            </PdfDocument>
          )}
        </div>

        {!hasError && numPages > 0 && (
          <div className="flex items-center justify-center gap-4 px-4 py-3 border-t shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {numPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
