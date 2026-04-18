import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Actuacion } from "@/hooks/use-actuaciones";

export interface ActuacionDetail extends Actuacion {
  folderCounts: Record<string, number>;
}

export function useActuacion(id: string) {
  return useQuery<ActuacionDetail>({
    queryKey: ["actuaciones", id],
    queryFn: () => apiClient.get<ActuacionDetail>(`/api/actuaciones/${id}`),
    enabled: !!id,
  });
}

export function useToggleColiseo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      apiClient.patch<Actuacion>(`/api/actuaciones/${id}/coliseo`, { status }),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["actuaciones", id] });
      const previous = queryClient.getQueryData<ActuacionDetail>(["actuaciones", id]);
      queryClient.setQueryData<ActuacionDetail>(["actuaciones", id], (old) =>
        old ? { ...old, coliseoStatus: status } : old,
      );
      return { previous };
    },

    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["actuaciones", id], context.previous);
      }
    },

    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["actuaciones", id] });
    },
  });
}
