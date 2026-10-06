import type { SavedOuting } from "./domain";

let database: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("garrett-adventures", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("outings", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Cannot open local storage. Your browser may block saved outings."));
      request.onblocked = () => reject(new Error("Local storage upgrade is blocked. Close other app tabs and retry."));
    });
  }
  return database;
}

export async function readOutings(): Promise<SavedOuting[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("outings", "readonly");
    const request = transaction.objectStore("outings").getAll();
    transaction.oncomplete = () => resolve(request.result as SavedOuting[]);
    transaction.onerror = () => reject(new Error("Could not read saved outings."));
    transaction.onabort = () => reject(new Error("Reading saved outings was interrupted."));
  });
}

export async function writeOuting(outing: SavedOuting): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("outings", "readwrite");
    transaction.objectStore("outings").put(outing);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Could not save this outing. Check available browser storage."));
    transaction.onabort = () => reject(new Error("Saving failed. Check available browser storage."));
  });
}

export async function removeOuting(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("outings", "readwrite");
    transaction.objectStore("outings").delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Could not remove the saved outing."));
    transaction.onabort = () => reject(new Error("Removing the outing was interrupted."));
  });
}
