import { useSyncExternalStore } from "react";
import { ENVIRONMENTS, type Env } from "./data";
import { toast } from "sonner";

let envs: Env[] = ENVIRONMENTS;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function useEnvs() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => envs,
    () => envs,
  );
}

export function notifyManager(id: string) {
  envs = envs.map((e) => (e.id === id ? { ...e, notified: true } : e));
  emit();
  toast.success(`Line manager notified about ${id}`);
}

export function logSnapshot(id: string, snapshot: string, by: string) {
  envs = envs.map((e) => (e.id === id ? { ...e, snapshot, by, when: new Date().toISOString(), status: "synced", notified: false } : e));
  emit();
  toast.success(`${snapshot} logged on ${id}`);
}
