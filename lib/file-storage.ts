"use client"

// Client-side file cache backed by IndexedDB. Attachment binary content
// never leaves the browser except when it is read and sent directly to the
// analyze endpoint - only lightweight metadata (name/type/size) is persisted
// to the database.

const DB_NAME = "analysis-studio-files"
const STORE_NAME = "files"
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function storeFile(id: string, file: File): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(file, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getFile(id: string): Promise<File | undefined> {
  const db = await openDB()
  const result = await new Promise<File | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result as File | undefined)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
