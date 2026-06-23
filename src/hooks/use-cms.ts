"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createCmsItem,
  deleteCmsItem,
  listCmsItems,
  reorderCmsItems,
  updateCmsItem,
  type CmsBase,
  type CmsPayload,
} from "@/lib/api/services/cms";

function queryKey(section: string) {
  return ["cms", section] as const;
}

export function useCmsList<T extends CmsBase = CmsBase>(
  section: string,
  options?: Omit<UseQueryOptions<T[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery<T[], Error>({
    queryKey: queryKey(section),
    queryFn: () => listCmsItems<T>(section),
    ...options,
  });
}

export function useCmsMutations(section: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKey(section) });

  const create = useMutation({
    mutationFn: (payload: CmsPayload) => createCmsItem(section, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CmsPayload }) =>
      updateCmsItem(section, id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCmsItem(section, id),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (items: Array<{ id: string }>) => reorderCmsItems(section, items),
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder, invalidate };
}
