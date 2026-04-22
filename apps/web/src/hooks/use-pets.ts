import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Pet {
  id: string;
  folderId: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  size: number;
  coliseoStatus: boolean;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
}

function petsByFolderQueryKey(folderId: string) {
  return ["pets", "folder", folderId] as const;
}

export function usePets(folderId: string) {
  return useQuery<Pet[]>({
    queryKey: petsByFolderQueryKey(folderId),
    queryFn: () => apiClient.get<Pet[]>(`/api/pet-folders/${folderId}/pets`),
    enabled: Boolean(folderId),
  });
}

export function useUploadPet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folderId,
    }: {
      file: File;
      folderId: string;
    }): Promise<Pet> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/pet-folders/${folderId}/pets`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        let message = response.statusText;
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      return response.json() as Promise<Pet>;
    },
    onSuccess: (pet) => {
      void queryClient.invalidateQueries({
        queryKey: petsByFolderQueryKey(pet.folderId),
      });
      // Also refresh folder list to update petCount
      void queryClient.invalidateQueries({ queryKey: ["pet-folders"] });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<Pet> =>
      apiClient.delete<Pet>(`/api/pets/${id}`),
    onSuccess: (pet) => {
      void queryClient.invalidateQueries({
        queryKey: petsByFolderQueryKey(pet.folderId),
      });
      void queryClient.invalidateQueries({ queryKey: ["pet-folders"] });
    },
  });
}

export function useBulkDownloadPets() {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/pets/bulk-download", {
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
      a.download = "pets.zip";
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useBulkDeletePets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[]; folderId: string }) => {
      return apiClient.post<{ deleted: number }>("/api/pets/bulk-delete", { ids });
    },
    onSuccess: (_data, { folderId }) => {
      void queryClient.invalidateQueries({ queryKey: petsByFolderQueryKey(folderId) });
      void queryClient.invalidateQueries({ queryKey: ["pet-folders"] });
    },
  });
}

export function useReorderPets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ items }: { items: { id: string; sortOrder: number }[]; folderId: string }) =>
      apiClient.patch<{ ok: boolean }>("/api/pets/reorder", { items }),
    onSuccess: (_data, { folderId }) => {
      void queryClient.invalidateQueries({ queryKey: petsByFolderQueryKey(folderId) });
    },
  });
}

export function useTogglePetColiseo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: boolean;
    }): Promise<Pet> =>
      apiClient.patch<Pet>(`/api/pets/${id}/coliseo`, { status }),
    onSuccess: (pet) => {
      void queryClient.invalidateQueries({
        queryKey: petsByFolderQueryKey(pet.folderId),
      });
    },
  });
}
