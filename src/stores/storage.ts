import { createJSONStorage, type StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { readMirror, writeMirror } from "./bootMirror";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return ((await get(name)) as string | undefined) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch {
      // storage unavailable; state stays in memory
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch {
      // ignore
    }
  },
};

/**
 * idb-keyval is the source of truth. On top of it, a synchronous localStorage mirror lets the very
 * first client render use the real state: the FIRST read per store returns the mirror synchronously
 * (zustand then hydrates during store creation, so there is no loading frame to wait out). Every
 * later read goes to IndexedDB. Once the page is idle, IndexedDB is compared with what the mirror
 * served and the store is rehydrated from IndexedDB if they differ (unless the child already changed
 * something in between).
 */
function createMirroredStorage(onDrift: (name: string) => void): StateStorage {
  const booted = new Set<string>();
  const served = new Map<string, string>();
  const dirty = new Set<string>();

  const reconcile = (name: string) => {
    void idbStorage.getItem(name).then((fromIdb) => {
      if (dirty.has(name)) return;
      if ((fromIdb ?? null) !== (served.get(name) ?? null)) onDrift(name);
    });
  };

  return {
    getItem: (name) => {
      if (!booted.has(name)) {
        booted.add(name);
        const mirrored = readMirror(name);
        if (mirrored !== null) {
          served.set(name, mirrored);
          const idle = typeof requestIdleCallback === "function" ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
          idle(() => reconcile(name));
          return mirrored;
        }
      }
      return idbStorage.getItem(name);
    },
    setItem: (name, value) => {
      dirty.add(name);
      writeMirror(name, value);
      return idbStorage.setItem(name, value);
    },
    removeItem: (name) => {
      dirty.add(name);
      writeMirror(name, null);
      return idbStorage.removeItem(name);
    },
  };
}

/** idb-keyval backed JSON storage with a synchronous first read; a no-op on the server. */
export function createIdbStorage(onDrift: (name: string) => void = () => {}) {
  return createJSONStorage(() => (typeof indexedDB === "undefined" ? noopStorage : createMirroredStorage(onDrift)));
}
