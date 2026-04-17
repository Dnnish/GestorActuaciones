import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client, BUCKET } from "../lib/s3-client.js";
import type { Readable } from "node:stream";

export const storageService = {
  async upload(key: string, buffer: Buffer, contentType: string) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  },

  async download(key: string): Promise<Readable> {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
    return response.Body as Readable;
  },

  async remove(key: string) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  },
};
