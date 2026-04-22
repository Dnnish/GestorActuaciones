import archiver from "archiver";
import { PassThrough } from "node:stream";
import type { Readable } from "node:stream";
import { storageService } from "./storage-service.js";

interface ZipEntry {
  filename: string;
  storageKey: string;
}

export const zipService = {
  createZipStream(entries: ZipEntry[]): Readable {
    const archive = archiver("zip", { zlib: { level: 5 } });

    async function appendAll() {
      for (const entry of entries) {
        const stream = await storageService.download(entry.storageKey);
        archive.append(stream, { name: entry.filename });
      }
      await archive.finalize();
    }

    appendAll().catch((err) => archive.destroy(err as Error));

    return archive;
  },
};
