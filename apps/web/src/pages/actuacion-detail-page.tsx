import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Circle } from "lucide-react";
import { useActuacion, useToggleColiseo } from "@/hooks/use-actuacion";
import { useDocuments } from "@/hooks/use-documents";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Folder } from "@minidrive/shared";

const FOLDERS: Folder[] = ["postes", "camaras", "fachadas", "fotos", "pets", "planos"];

const FOLDER_LABELS: Record<Folder, string> = {
  postes: "Postes",
  camaras: "Cámaras",
  fachadas: "Fachadas",
  fotos: "Fotos",
  pets: "PETs",
  planos: "Planos",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentListProps {
  actuacionId: string;
  folder: Folder;
}

function DocumentList({ actuacionId, folder }: DocumentListProps) {
  const { data, isLoading } = useDocuments(actuacionId, folder);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No hay documentos en esta carpeta
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Nombre</th>
            <th className="pb-2 font-medium">Tamaño</th>
            <th className="pb-2 font-medium">Subido por</th>
            <th className="pb-2 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {data.map((doc) => (
            <tr key={doc.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{doc.filename}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {formatFileSize(doc.size)}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {doc.uploadedByName}
              </td>
              <td className="py-2 text-muted-foreground">
                {new Date(doc.uploadedAt).toLocaleDateString("es-ES")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActuacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { data: actuacion, isLoading } = useActuacion(id ?? "");
  const toggleColiseo = useToggleColiseo();

  const canToggleColiseo =
    user?.role === "superadmin" || user?.role === "admin";

  function handleColiseoToggle() {
    if (!actuacion) return;
    toggleColiseo.mutate({
      id: actuacion.id,
      status: !actuacion.coliseoStatus,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!actuacion) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Actuación no encontrada
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate("/actuaciones")}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">{actuacion.name}</h1>
        </div>

        {canToggleColiseo && (
          <Button
            variant={actuacion.coliseoStatus ? "default" : "outline"}
            size="sm"
            onClick={handleColiseoToggle}
            disabled={toggleColiseo.isPending}
            className={
              actuacion.coliseoStatus
                ? "bg-green-600 hover:bg-green-700"
                : "border-red-400 text-red-600 hover:bg-red-50"
            }
          >
            {actuacion.coliseoStatus ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            {actuacion.coliseoStatus ? "Subido a Coliseo" : "Pendiente"}
          </Button>
        )}
      </div>

      {/* Folder grid */}
      <div className="grid grid-cols-3 gap-3">
        {FOLDERS.map((folder) => {
          const count = actuacion.folderCounts[folder] ?? 0;
          const isSelected = selectedFolder === folder;

          return (
            <Card
              key={folder}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : ""
              }`}
              onClick={() =>
                setSelectedFolder(isSelected ? null : folder)
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  {FOLDER_LABELS[folder]}
                  <Badge variant={count > 0 ? "default" : "secondary"}>
                    {count}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Document list */}
      {selectedFolder ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {FOLDER_LABELS[selectedFolder]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentList actuacionId={actuacion.id} folder={selectedFolder} />
          </CardContent>
        </Card>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          Selecciona una carpeta
        </div>
      )}
    </div>
  );
}
