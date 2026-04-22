import type { FastifyRequest, FastifyReply } from "fastify";
import { petService, InvalidPetMimeTypeError } from "../services/pet-service.js";

export const petHandler = {
  async upload(request: FastifyRequest, reply: FastifyReply) {
    const { folderId } = request.params as { folderId: string };
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "No se envio ningun archivo" });
    }

    const buffer = await file.toBuffer();

    try {
      const pet = await petService.upload({
        folderId,
        filename: file.filename,
        mimeType: file.mimetype,
        buffer,
        uploadedById: request.user.id,
      });

      return reply.code(201).send(pet);
    } catch (err) {
      if (err instanceof InvalidPetMimeTypeError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  },

  async listByFolder(request: FastifyRequest, reply: FastifyReply) {
    const { folderId } = request.params as { folderId: string };
    const pets = await petService.listByFolder(folderId);
    return reply.send(pets);
  },

  async download(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await petService.download(id);
    if (!result) {
      return reply.code(404).send({ error: "PET no encontrado" });
    }

    const { pet, stream } = result;

    return reply
      .header("Content-Type", pet.mimeType)
      .header("Content-Disposition", `attachment; filename="${pet.filename}"`)
      .send(stream);
  },

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const pet = await petService.remove(id);
    if (!pet) {
      return reply.code(404).send({ error: "PET no encontrado" });
    }
    return reply.send(pet);
  },

  async bulkDownload(request: FastifyRequest, reply: FastifyReply) {
    const { ids } = request.body as { ids?: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.code(400).send({ error: "Se requiere un array de IDs" });
    }

    const stream = await petService.bulkDownload(ids);
    if (!stream) {
      return reply.code(404).send({ error: "No se encontraron PETs" });
    }

    return reply
      .header("Content-Type", "application/zip")
      .header("Content-Disposition", `attachment; filename="pets.zip"`)
      .send(stream);
  },

  async bulkRemove(request: FastifyRequest, reply: FastifyReply) {
    const { ids } = request.body as { ids?: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.code(400).send({ error: "Se requiere un array de IDs" });
    }

    const removed = await petService.bulkRemove(ids);
    return reply.send({ deleted: removed.length });
  },

  async reorder(request: FastifyRequest, reply: FastifyReply) {
    const { items } = request.body as { items?: { id: string; sortOrder: number }[] };
    if (!items || !Array.isArray(items)) {
      return reply.code(400).send({ error: "Se requiere un array de items con id y sortOrder" });
    }
    await petService.reorder(items);
    return reply.send({ ok: true });
  },

  async toggleColiseo(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: boolean };
    if (typeof status !== "boolean") {
      return reply
        .code(400)
        .send({ error: "El campo status es requerido y debe ser booleano" });
    }

    const pet = await petService.toggleColiseo(id, status);
    if (!pet) {
      return reply.code(404).send({ error: "PET no encontrado" });
    }
    return reply.send(pet);
  },
};
