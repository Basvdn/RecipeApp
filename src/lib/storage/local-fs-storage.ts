import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PhotoStorage } from "./photo-storage";

const photosDir = process.env.PHOTOS_DIR ?? path.join(process.cwd(), "data", "photos");

async function ensureDir() {
  await mkdir(photosDir, { recursive: true });
}

export const localFsStorage: PhotoStorage = {
  async put(data, extension) {
    await ensureDir();
    const storageKey = `${randomUUID()}.${extension}`;
    await writeFile(path.join(photosDir, storageKey), data);
    return storageKey;
  },

  async read(storageKey) {
    return readFile(path.join(photosDir, storageKey));
  },

  async delete(storageKey) {
    await rm(path.join(photosDir, storageKey), { force: true });
  },
};
