import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock react-pdf before importing any component that uses it.
// react-pdf does not work in jsdom — the worker and canvas APIs are absent.
vi.mock("react-pdf", () => ({
  Document: ({ children, onLoadSuccess, ...props }: any) => {
    setTimeout(() => onLoadSuccess?.({ numPages: 5 }), 0);
    return (
      <div data-testid="pdf-document" {...props}>
        {children}
      </div>
    );
  },
  Page: ({ pageNumber }: any) => (
    <div data-testid="pdf-page">Page {pageNumber}</div>
  ),
  pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
}));

// Mock the CSS side-effect imports from react-pdf so jsdom doesn't choke on them
vi.mock("react-pdf/dist/Page/AnnotationLayer.css", () => ({}));
vi.mock("react-pdf/dist/Page/TextLayer.css", () => ({}));

vi.mock("@/hooks/use-documents", () => ({
  useDeleteDocument: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

import { PdfViewer } from "@/components/documents/pdf-viewer";
import { ImagePreview } from "@/components/documents/image-preview";
import type { Document } from "@/hooks/use-documents";

const mockPdfDocument: Document = {
  id: "doc-pdf-1",
  actuacionId: "act-1",
  folder: "postes",
  filename: "plano-001.pdf",
  storageKey: "postes/plano-001.pdf",
  mimeType: "application/pdf",
  size: 204800,
  uploadedById: "user-1",
  uploadedByName: "Ana García",
  uploadedAt: new Date().toISOString(),
};

const mockImageDocument: Document = {
  id: "doc-img-1",
  actuacionId: "act-1",
  folder: "fotos",
  filename: "foto-fachada.jpg",
  storageKey: "fotos/foto-fachada.jpg",
  mimeType: "image/jpeg",
  size: 102400,
  uploadedById: "user-1",
  uploadedByName: "Ana García",
  uploadedAt: new Date().toISOString(),
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("PdfViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("visor PDF renderiza el componente Document de react-pdf", () => {
    renderWithProviders(
      <PdfViewer
        open={true}
        onOpenChange={vi.fn()}
        document={mockPdfDocument}
      />,
    );

    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
  });

  it("navegacion de paginas actualiza el numero de pagina", async () => {
    renderWithProviders(
      <PdfViewer
        open={true}
        onOpenChange={vi.fn()}
        document={mockPdfDocument}
      />,
    );

    // Wait for the mock onLoadSuccess to fire (setTimeout 0)
    await waitFor(() => {
      expect(screen.getByText("Página 1 de 5")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /página siguiente/i });
    fireEvent.click(nextButton);

    expect(screen.getByText("Página 2 de 5")).toBeInTheDocument();

    const prevButton = screen.getByRole("button", { name: /página anterior/i });
    fireEvent.click(prevButton);

    expect(screen.getByText("Página 1 de 5")).toBeInTheDocument();
  });
});

describe("ImagePreview", () => {
  it("preview de imagen muestra la imagen con src correcto", () => {
    renderWithProviders(
      <ImagePreview
        open={true}
        onOpenChange={vi.fn()}
        document={mockImageDocument}
      />,
    );

    const img = screen.getByRole("img", { name: mockImageDocument.filename });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain(
      `/api/documents/${mockImageDocument.id}/download`,
    );
  });
});
