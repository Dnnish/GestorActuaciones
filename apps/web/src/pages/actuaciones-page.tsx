import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useActuaciones,
  useDeleteActuacion,
  type Actuacion,
} from "@/hooks/use-actuaciones";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateActuacionDialog } from "@/components/actuaciones/create-actuacion-dialog";

const PAGE_LIMIT = 20;

interface ColiseoIndicatorProps {
  status: boolean;
}

function ColiseoIndicator({ status }: ColiseoIndicatorProps) {
  return (
    <div
      title={status ? "Subido a Coliseo" : "Pendiente de Coliseo"}
      className={`h-3 w-3 rounded-full ${status ? "bg-green-500" : "bg-red-500"}`}
      aria-label={status ? "Subido a Coliseo" : "Pendiente de Coliseo"}
    />
  );
}

interface DeleteActuacionDialogProps {
  actuacion: Actuacion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DeleteActuacionDialog({
  actuacion,
  open,
  onOpenChange,
}: DeleteActuacionDialogProps) {
  const deleteActuacion = useDeleteActuacion();

  async function handleConfirm() {
    if (!actuacion) return;
    await deleteActuacion.mutateAsync(actuacion.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar actuación</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar la actuación{" "}
            <span className="font-medium text-foreground">
              {actuacion?.name}
            </span>
            ? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteActuacion.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={deleteActuacion.isPending}
          >
            {deleteActuacion.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ActuacionesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Actuacion | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useActuaciones(page, PAGE_LIMIT, debouncedSearch);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_LIMIT)) : 1;

  const canCreate = user?.role === "superadmin" || user?.role === "admin";

  function canDelete(actuacion: Actuacion): boolean {
    if (!user) return false;
    if (user.role === "superadmin") return true;
    if (user.role === "admin") return actuacion.createdById === user.id;
    return false;
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function openDelete(actuacion: Actuacion, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(actuacion);
    setDeleteOpen(true);
  }

  function handleCardClick(id: string) {
    void navigate(`/actuaciones/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Actuaciones</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Nueva actuación
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar actuaciones..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No se encontraron actuaciones
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data.map((actuacion) => (
            <Card
              key={actuacion.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => handleCardClick(actuacion.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ColiseoIndicator status={actuacion.coliseoStatus} />
                    <CardTitle className="text-base">{actuacion.name}</CardTitle>
                  </div>
                  {canDelete(actuacion) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${actuacion.name}`}
                      onClick={(e) => openDelete(actuacion, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Creado por: {actuacion.createdByName}</span>
                  <span>
                    {new Date(actuacion.createdAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (data?.total ?? 0) > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CreateActuacionDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DeleteActuacionDialog
        actuacion={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
