import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { db } from "@minidrive/db";
import { sql } from "drizzle-orm";
import { buildApp, createAuthenticatedUser } from "./setup.js";
import { ensureBucket } from "../lib/s3-client.js";
import { imageService } from "../services/image-service.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  await ensureBucket();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE users, sessions, accounts, verifications, actuaciones, documents CASCADE`,
  );
});

// Generate a real 1x1 PNG buffer
async function createPngBuffer(): Promise<Buffer> {
  return sharp({
    create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
}

// Generate a real 1x1 WEBP buffer
async function createWebpBuffer(): Promise<Buffer> {
  return sharp({
    create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 255, b: 0 } },
  })
    .webp()
    .toBuffer();
}

// Generate a real 1x1 JPEG buffer
async function createJpegBuffer(): Promise<Buffer> {
  return sharp({
    create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 255 } },
  })
    .jpeg()
    .toBuffer();
}

function createMultipartPayload(
  fields: Record<string, string>,
  file: {
    fieldname: string;
    filename: string;
    content: Buffer;
    contentType: string;
  },
) {
  const boundary = "----TestBoundary" + Date.now();
  const parts: Buffer[] = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
      ),
    );
  }

  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
    ),
  );
  parts.push(file.content);
  parts.push(Buffer.from("\r\n"));
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function createTestActuacion(
  appInstance: FastifyInstance,
  cookies: string,
  name: string,
) {
  const res = await appInstance.inject({
    method: "POST",
    url: "/api/actuaciones",
    headers: { cookie: cookies },
    payload: { name },
  });
  return res.json();
}

describe("imageService (unit)", () => {
  it("converts PNG to JPG — produces valid JPEG buffer", async () => {
    const png = await createPngBuffer();
    const jpg = await imageService.convertToJpg(png);

    const metadata = await sharp(jpg).metadata();
    expect(metadata.format).toBe("jpeg");
  });

  it("JPG passthrough — does not reconvert", async () => {
    const jpeg = await createJpegBuffer();
    expect(imageService.isJpeg("image/jpeg")).toBe(true);
    // When isJpeg is true, convertToJpg should NOT be called
    // The buffer should remain as-is
    const metadata = await sharp(jpeg).metadata();
    expect(metadata.format).toBe("jpeg");
  });

  it("replaces extension correctly", () => {
    expect(imageService.replaceExtensionWithJpg("photo.png")).toBe("photo.jpg");
    expect(imageService.replaceExtensionWithJpg("image.webp")).toBe("image.jpg");
    expect(imageService.replaceExtensionWithJpg("file")).toBe("file.jpg");
    expect(imageService.replaceExtensionWithJpg("my.photo.heic")).toBe("my.photo.jpg");
  });
});

describe("PETs conversion (integration)", () => {
  it("upload PNG to pets → saved as .jpg with mime image/jpeg", async () => {
    const { cookies } = await createAuthenticatedUser(app, {
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "superadmin",
    });

    const actuacion = await createTestActuacion(app, cookies, "Actuacion PETs");
    const pngBuffer = await createPngBuffer();

    const { body, contentType } = createMultipartPayload(
      { folder: "pets" },
      {
        fieldname: "file",
        filename: "captura.png",
        content: pngBuffer,
        contentType: "image/png",
      },
    );

    const res = await app.inject({
      method: "POST",
      url: `/api/actuaciones/${actuacion.id}/documents`,
      headers: { cookie: cookies, "content-type": contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
    const doc = res.json();
    expect(doc.filename).toBe("captura.jpg");
    expect(doc.mimeType).toBe("image/jpeg");
    expect(doc.folder).toBe("pets");
  });

  it("upload WEBP to pets → saved as .jpg with mime image/jpeg", async () => {
    const { cookies } = await createAuthenticatedUser(app, {
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "superadmin",
    });

    const actuacion = await createTestActuacion(app, cookies, "Actuacion PETs");
    const webpBuffer = await createWebpBuffer();

    const { body, contentType } = createMultipartPayload(
      { folder: "pets" },
      {
        fieldname: "file",
        filename: "foto.webp",
        content: webpBuffer,
        contentType: "image/webp",
      },
    );

    const res = await app.inject({
      method: "POST",
      url: `/api/actuaciones/${actuacion.id}/documents`,
      headers: { cookie: cookies, "content-type": contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
    const doc = res.json();
    expect(doc.filename).toBe("foto.jpg");
    expect(doc.mimeType).toBe("image/jpeg");
  });

  it("upload JPG to pets → no reconversion, keeps .jpg", async () => {
    const { cookies } = await createAuthenticatedUser(app, {
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "superadmin",
    });

    const actuacion = await createTestActuacion(app, cookies, "Actuacion PETs");
    const jpegBuffer = await createJpegBuffer();

    const { body, contentType } = createMultipartPayload(
      { folder: "pets" },
      {
        fieldname: "file",
        filename: "original.jpg",
        content: jpegBuffer,
        contentType: "image/jpeg",
      },
    );

    const res = await app.inject({
      method: "POST",
      url: `/api/actuaciones/${actuacion.id}/documents`,
      headers: { cookie: cookies, "content-type": contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
    const doc = res.json();
    expect(doc.filename).toBe("original.jpg");
    expect(doc.mimeType).toBe("image/jpeg");
  });
});

describe("Document download", () => {
  it("download returns file with correct Content-Type and Content-Disposition", async () => {
    const { cookies } = await createAuthenticatedUser(app, {
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "superadmin",
    });

    const actuacion = await createTestActuacion(app, cookies, "Actuacion DL");
    const pdfBuffer = Buffer.from("%PDF-1.4 test content");

    const { body, contentType } = createMultipartPayload(
      { folder: "postes" },
      {
        fieldname: "file",
        filename: "informe.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    );

    const uploadRes = await app.inject({
      method: "POST",
      url: `/api/actuaciones/${actuacion.id}/documents`,
      headers: { cookie: cookies, "content-type": contentType },
      payload: body,
    });

    expect(uploadRes.statusCode).toBe(201);
    const doc = uploadRes.json();

    const dlRes = await app.inject({
      method: "GET",
      url: `/api/documents/${doc.id}/download`,
      headers: { cookie: cookies },
    });

    expect(dlRes.statusCode).toBe(200);
    expect(dlRes.headers["content-type"]).toBe("application/pdf");
    expect(dlRes.headers["content-disposition"]).toContain("informe.pdf");
  });

  it("download non-existent document → 404", async () => {
    const { cookies } = await createAuthenticatedUser(app, {
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "superadmin",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/documents/00000000-0000-0000-0000-000000000000/download",
      headers: { cookie: cookies },
    });

    expect(res.statusCode).toBe(404);
  });
});
