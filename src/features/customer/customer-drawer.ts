import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

let open = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return open;
}

export function openCustomerDrawer() {
  if (open) {
    return;
  }

  open = true;
  emit();
}

export function closeCustomerDrawer() {
  if (!open) {
    return;
  }

  open = false;
  emit();
}

export function useCustomerDrawerOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
