import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Document {
  id: string;
  actuacionId: string;
  folder: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
}

export function useDocuments(actuacionId: string, folder: string) {
  return useQuery<Document[]>({
    queryKey: ["documents", actuacionId, folder],
    queryFn: () =>
      apiClient.get<Document[]>(
        `/api/actuaciones/${actuacionId}/documents?folder=${folder}`,
      ),
    enabled: !!actuacionId && !!folder,
    refetchOnMount: "always",
  });
}

interface UploadDocumentParams {
  actuacionId: string;
  folder: string;
  file: File;
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actuacionId, folder, file }: UploadDocumentParams): Promise<Document> => {
      const formData = new FormData();
      formData.append("folder", folder);
      formData.append("file", file);

      const response = await fetch(`/api/actuaciones/${actuacionId}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        let message = response.statusText;
        try {
          const data = (await response.json()) as { message?: string };
          if (data.message) message = data.message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      return response.json() as Promise<Document>;
    },
    onSuccess: (_data, { actuacionId, folder }) => {
      void queryClient.invalidateQueries({ queryKey: ["documents", actuacionId, folder] });
      void queryClient.invalidateQueries({ queryKey: ["actuaciones", actuacionId] });
    },
  });
}

export function useBulkDownloadDocuments() {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/documents/bulk-download", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Error al descargar");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "documentos.zip";
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useBulkDeleteDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[]; actuacionId: string; folder: string }) => {
      return apiClient.post<{ deleted: number }>("/api/documents/bulk-delete", { ids });
    },
    onSuccess: (_data, { actuacionId, folder }) => {
      void queryClient.invalidateQueries({ queryKey: ["documents", actuacionId, folder] });
      void queryClient.invalidateQueries({ queryKey: ["actuaciones", actuacionId] });
    },
  });
}

export function useReorderDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ items }: { items: { id: string; sortOrder: number }[]; actuacionId: string; folder: string }) =>
      apiClient.patch<{ ok: boolean }>("/api/documents/reorder", { items }),
    onSuccess: (_data, { actuacionId, folder }) => {
      void queryClient.invalidateQueries({ queryKey: ["documents", actuacionId, folder] });
    },
  });
}

interface DeleteDocumentParams {
  id: string;
  actuacionId: string;
  folder: string;
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteDocumentParams): Promise<Document> =>
      apiClient.delete<Document>(`/api/documents/${id}`),
    onSuccess: (_data, { actuacionId, folder }) => {
      void queryClient.invalidateQueries({ queryKey: ["documents", actuacionId, folder] });
      void queryClient.invalidateQueries({ queryKey: ["actuaciones", actuacionId] });
    },
  });
}
