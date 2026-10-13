/**
 * db.ts — IndexedDB layer (via `idb`) for data that spec section 10.2
 * explicitly calls out: bookmarks and last reading position.
 *
 * Small settings (font size, chosen background, prayer city, etc.) live in
 * localStorage instead — see settings.ts.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Bookmark, LastPosition } from "./types";

interface QuranDB extends DBSchema {
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: { "by-createdAt": number };
  };
  lastPosition: {
    key: string;
    value: LastPosition;
  };
}

const DB_NAME = "quran-app-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<QuranDB>> | null = null;

function getDB(): Promise<IDBPDatabase<QuranDB>> {
  if (!dbPromise) {
    dbPromise = openDB<QuranDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("bookmarks")) {
          const store = db.createObjectStore("bookmarks", { keyPath: "id" });
          store.createIndex("by-createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("lastPosition")) {
          db.createObjectStore("lastPosition", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ---- Bookmarks --------------------------------------------------------

export async function listBookmarks(): Promise<Bookmark[]> {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex("bookmarks", "by-createdAt");
    return all.reverse(); // newest first
  } catch (err) {
    console.error("listBookmarks failed", err);
    return [];
  }
}

export async function addBookmark(b: Bookmark): Promise<boolean> {
  try {
    const db = await getDB();
    await db.put("bookmarks", b);
    return true;
  } catch (err) {
    console.error("addBookmark failed", err);
    return false;
  }
}

export async function removeBookmark(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    await db.delete("bookmarks", id);
    return true;
  } catch (err) {
    console.error("removeBookmark failed", err);
    return false;
  }
}

export async function isBookmarked(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    const v = await db.get("bookmarks", id);
    return !!v;
  } catch {
    return false;
  }
}

// ---- Last reading position ---------------------------------------------

export async function getLastPosition(): Promise<LastPosition | null> {
  try {
    const db = await getDB();
    const v = await db.get("lastPosition", "current");
    return v ?? null;
  } catch (err) {
    console.error("getLastPosition failed", err);
    return null;
  }
}

export async function setLastPosition(
  pos: Omit<LastPosition, "id" | "updatedAt">,
): Promise<boolean> {
  try {
    const db = await getDB();
    await db.put("lastPosition", {
      id: "current",
      ...pos,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error("setLastPosition failed", err);
    return false;
  }
}

/** Used by the offline-readiness check (section 10.3 / PWA install screen). */
export async function isIndexedDBHealthy(): Promise<boolean> {
  try {
    await getDB();
    return true;
  } catch {
    return false;
  }
}
