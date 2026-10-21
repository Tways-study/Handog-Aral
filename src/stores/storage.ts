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
 * idb-keyval is the durable store. On top of it, a synchronous localStorage mirror lets the very first
 * client render use the real state: the FIRST read per store returns the mirror synchronously (zustand
 * then hydrates during store creation, so there is no loading frame to wait out). Every later read goes
 * to IndexedDB.
 *
 * Every write stamps BOTH copies with the same timestamp (`<name>:ts`). Once the page is idle, the copies
 * are compared: if they differ, the NEWER one wins. A write cut short by a reload or the app being killed
 * leaves the mirror ahead of IndexedDB — then IndexedDB is repaired from the mirror (never the other way
 * round, which would silently throw away the child's last change). Only when IndexedDB is genuinely newer
 * (another tab, a restored profile) is the store rehydrated from it.
 */
const tsKey = (name: string) => `${name}:ts`;

function createMirroredStorage(onDrift: (name: string) => void): StateStorage {
  const booted = new Set<string>();
  const served = new Map<string, string>();
  const dirty = new Set<string>();

  const reconcile = (name: string) => {
    void Promise.all([idbStorage.getItem(name), idbStorage.getItem(tsKey(name))]).then(([fromIdb, idbTsRaw]) => {
      if (dirty.has(name)) return;
      const mirrored = served.get(name);
      if (mirrored === undefined || (fromIdb ?? null) === mirrored) return;
      const mirrorTs = Number(readMirror(tsKey(name)) ?? 0) || 0;
      const idbTs = Number(idbTsRaw ?? 0) || 0;
      if (mirrorTs > idbTs) {
        // The mirror is ahead: IndexedDB missed the last write. Repair it; the store already holds the mirror's state.
        void idbStorage.setItem(name, mirrored).then(() => idbStorage.setItem(tsKey(name), String(mirrorTs)));
        return;
      }
      onDrift(name);
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
      const ts = String(Date.now());
      writeMirror(name, value);
      writeMirror(tsKey(name), ts);
      return idbStorage.setItem(name, value).then(() => idbStorage.setItem(tsKey(name), ts));
    },
    removeItem: (name) => {
      dirty.add(name);
      writeMirror(name, null);
      writeMirror(tsKey(name), null);
      return idbStorage.removeItem(name).then(() => idbStorage.removeItem(tsKey(name)));
    },
  };
}

/** idb-keyval backed JSON storage with a synchronous first read; a no-op on the server. */
export function createIdbStorage(onDrift: (name: string) => void = () => {}) {
  return createJSONStorage(() => (typeof indexedDB === "undefined" ? noopStorage : createMirroredStorage(onDrift)));
}
