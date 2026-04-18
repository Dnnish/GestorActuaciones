import { useQuery } from "@tanstack/react-query";
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
  });
}
