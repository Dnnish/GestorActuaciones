import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { isValidMimeType } from "@minidrive/shared";
import { useUploadDocument } from "@/hooks/use-documents";
import type { Folder } from "@minidrive/shared";

interface FileUploadZoneProps {
  actuacionId: string;
  folder: Folder;
}

const ACCEPT_BY_FOLDER: Record<Folder, string> = {
  postes: "application/pdf",
  camaras: "application/pdf",
  fachadas: "application/pdf",
  fotos: "image/*",
  planos: "application/pdf,.kmz",
  arquetas: "image/*",
};

const FORMAT_LABEL_BY_FOLDER: Record<Folder, string> = {
  postes: "Solo archivos PDF",
  camaras: "Solo archivos PDF",
  fachadas: "Solo archivos PDF",
  fotos: "Imágenes (JPG, PNG, WEBP, etc.)",
  planos: "Archivos PDF y KMZ",
  arquetas: "Imágenes (JPG, PNG, WEBP, etc.)",
};

export function FileUploadZone({ actuacionId, folder }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadDocument = useUploadDocument();

  function handleFiles(files: FileList | File[]) {
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (!isValidMimeType(folder, file.type, file.name)) {
        toast.error(`Formato no permitido: ${file.name}`);
      } else {
        valid.push(file);
      }
    }

    for (const file of valid) {
      uploadDocument.mutate(
        { actuacionId, folder, file },
        {
          onSuccess: () => {
            toast.success(`${file.name} subido correctamente`);
          },
          onError: () => {
            toast.error(`Error al subir ${file.name}`);
          },
        },
      );
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div className="mb-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de archivos"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
        } ${uploadDocument.isPending ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploadDocument.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Haz clic o arrastra archivos aquí
            </p>
            <p className="text-xs text-muted-foreground">
              {FORMAT_LABEL_BY_FOLDER[folder]}
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT_BY_FOLDER[folder]}
        multiple
        onChange={handleInputChange}
        aria-hidden="true"
      />
    </div>
  );
}
