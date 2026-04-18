import { useState, useCallback } from "react";
import { Document as PdfDocument, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
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

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

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
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-sm font-medium truncate max-w-[60%]" title={doc.filename}>
            {doc.filename}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownload} aria-label="Descargar">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-start justify-center bg-muted/30 p-4">
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
