import { createJSONStorage, type StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return ((await get(name)) as string | undefined) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await set(name, value);
    } catch {
      // storage unavailable; state stays in memory
    }
  },
  removeItem: async (name) => {
    try {
      await del(name);
    } catch {
      // ignore
    }
  },
};

/** idb-keyval backed JSON storage; a no-op on the server. */
export function createIdbStorage() {
  return createJSONStorage(() => (typeof indexedDB === "undefined" ? noopStorage : idbStorage));
}
