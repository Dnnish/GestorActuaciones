import { describe, it, expect, beforeAll } from "vitest";
import { ensureBucket } from "../lib/s3-client.js";
import { storageService } from "../services/storage-service.js";

beforeAll(async () => {
  await ensureBucket();
});

describe("Storage Service", () => {
  const testKey = "test/storage-test.txt";
  const testContent = Buffer.from("Hello MinIO!");
  const testContentType = "text/plain";

  it("uploads a file successfully", async () => {
    await storageService.upload(testKey, testContent, testContentType);
    // If no error thrown, upload succeeded
  });

  it("downloads an uploaded file", async () => {
    await storageService.upload(testKey, testContent, testContentType);

    const stream = await storageService.download(testKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const downloaded = Buffer.concat(chunks);
    expect(downloaded.toString()).toBe("Hello MinIO!");
  });

  it("throws on download of non-existent key", async () => {
    await expect(
      storageService.download("non-existent/file.txt"),
    ).rejects.toThrow();
  });

  it("removes a file and subsequent download fails", async () => {
    const removeKey = "test/to-remove.txt";
    await storageService.upload(removeKey, testContent, testContentType);

    await storageService.remove(removeKey);

    await expect(storageService.download(removeKey)).rejects.toThrow();
  });
});
