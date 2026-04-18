import type { FastifyRequest, FastifyReply } from "fastify";
import { folderSchema } from "@minidrive/shared";
import type { Folder } from "@minidrive/shared";
import { documentService, InvalidMimeTypeError } from "../services/document-service.js";

export const documentHandler = {
  async upload(
    request: FastifyRequest<{ Params: { actuacionId: string } }>,
    reply: FastifyReply,
  ) {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "No se envio ningun archivo" });
    }

    const folderField = file.fields.folder;
    // multipart fields come as objects with a value property
    const folderValue =
      folderField && typeof folderField === "object" && "value" in folderField
        ? (folderField as { value: string }).value
        : undefined;

    const folderParsed = folderSchema.safeParse(folderValue);
    if (!folderParsed.success) {
      return reply.code(400).send({ error: "Carpeta invalida o no especificada" });
    }

    const buffer = await file.toBuffer();

    try {
      const document = await documentService.upload({
        actuacionId: request.params.actuacionId,
        folder: folderParsed.data as Folder,
        filename: file.filename,
        mimeType: file.mimetype,
        buffer,
        uploadedById: request.user.id,
      });

      return reply.code(201).send(document);
    } catch (err) {
      if (err instanceof InvalidMimeTypeError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  },

  async list(
    request: FastifyRequest<{
      Params: { actuacionId: string };
      Querystring: { folder?: string };
    }>,
    reply: FastifyReply,
  ) {
    const { folder } = request.query;
    if (!folder) {
      return reply.code(400).send({ error: "El parametro folder es requerido" });
    }

    const folderParsed = folderSchema.safeParse(folder);
    if (!folderParsed.success) {
      return reply.code(400).send({ error: "Carpeta invalida" });
    }

    const docs = await documentService.listByFolder(
      request.params.actuacionId,
      folderParsed.data,
    );
    return reply.send(docs);
  },

  async download(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const result = await documentService.download(request.params.id);
    if (!result) {
      return reply.code(404).send({ error: "Documento no encontrado" });
    }

    const { document, stream } = result;

    return reply
      .header("Content-Type", document.mimeType)
      .header(
        "Content-Disposition",
        `attachment; filename="${document.filename}"`,
      )
      .send(stream);
  },

  async remove(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const document = await documentService.remove(request.params.id);
    if (!document) {
      return reply.code(404).send({ error: "Documento no encontrado" });
    }
    return reply.send(document);
  },
};
