"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./api";
import type { Connection } from "./types";

export const useEnvs = () => useQuery({ queryKey: ["envs"], queryFn: api.environments });
export const useFolders = () => useQuery({ queryKey: ["folders"], queryFn: api.folders });
export const useInsights = () => useQuery({ queryKey: ["insights"], queryFn: api.insights });
export const useFilterOptions = () =>
  useQuery({ queryKey: ["filters"], queryFn: api.filterOptions });

export function useEnvActions() {
  const qc = useQueryClient();
  const onSuccess = (msg: string) => (data: unknown) => {
    qc.setQueryData(["envs"], data);
    toast.success(msg);
  };
  return {
    notify: useMutation({
      mutationFn: (id: string) => api.notifyManager(id),
      onSuccess: (d, id) => onSuccess(`Line manager notified about ${id}`)(d),
    }),
    applyLatest: useMutation({
      mutationFn: (id: string) => api.applyLatestSnapshot(id),
      onSuccess: (d, id) => onSuccess(`Latest snapshot logged on ${id}`)(d),
    }),
  };
}

export const useConnections = () =>
  useQuery({
    queryKey: ["connections"],
    queryFn: api.connections,
    refetchInterval: (q) =>
      q.state.data?.some((c) => c.status === "connecting" || c.status === "syncing") ? 700 : false,
  });

export function useConnectionActions() {
  const qc = useQueryClient();
  const set = (d: Connection[]) => qc.setQueryData(["connections"], d);
  return {
    connect: useMutation({ mutationFn: (id: Connection["id"]) => api.connect(id), onSuccess: set }),
    sync: useMutation({
      mutationFn: (id: Connection["id"]) => api.syncConnection(id),
      onSuccess: set,
    }),
    disconnect: useMutation({
      mutationFn: (id: Connection["id"]) => api.disconnect(id),
      onSuccess: set,
    }),
  };
}

export const useUploads = () =>
  useQuery({
    queryKey: ["uploads"],
    queryFn: api.uploads,
    refetchInterval: (q) => (q.state.data?.some((u) => u.status === "processing") ? 700 : false),
  });

export function useUploadFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => api.upload(files),
    onSuccess: (d) => qc.setQueryData(["uploads"], d),
  });
}

export const useSnowIncidents = () => useQuery({ queryKey: ["snow"], queryFn: api.snowIncidents });
