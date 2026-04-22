import type { FastifyRequest, FastifyReply } from "fastify";
import { searchActuacionesSchema, createActuacionSchema } from "@minidrive/shared";
import { actuacionService, ForbiddenError } from "../services/actuacion-service.js";

export const actuacionHandler = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const parsed = searchActuacionesSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { page, limit, search, sortBy, sortOrder, coliseoStatus } = parsed.data;
    const { data, total } = await actuacionService.list(page, limit, search, sortBy, sortOrder, coliseoStatus);
    return reply.send({ data, total, page, limit });
  },

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const actuacion = await actuacionService.getById(request.params.id);
    if (!actuacion) {
      return reply.code(404).send({ error: "Actuacion no encontrada" });
    }
    return reply.send(actuacion);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createActuacionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const actuacion = await actuacionService.create(parsed.data.name, request.user.id);
    return reply.code(201).send(actuacion);
  },

  async rename(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return reply.code(400).send({ error: "El nombre es requerido" });
    }
    if (name.trim().length > 50) {
      return reply.code(400).send({ error: "El nombre no puede superar 50 caracteres" });
    }

    try {
      const actuacion = await actuacionService.rename(
        id,
        name.trim(),
        request.user.id,
        request.user.role,
      );
      if (!actuacion) {
        return reply.code(404).send({ error: "Actuación no encontrada" });
      }
      return reply.send(actuacion);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  },

  async updateFolderColiseo(request: FastifyRequest, reply: FastifyReply) {
    const { id, folder } = request.params as { id: string; folder: string };
    const { status } = request.body as { status: boolean };
    if (typeof status !== "boolean") {
      return reply.code(400).send({ error: "El campo status es requerido y debe ser booleano" });
    }

    try {
      const result = await actuacionService.updateFolderColiseoStatus(
        id,
        folder,
        status,
        request.user.role,
      );
      if (!result) {
        return reply.code(404).send({ error: "Actuación no encontrada" });
      }
      return reply.send(result);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  },

  async updateColiseo(
    request: FastifyRequest<{ Params: { id: string }; Body: { status: boolean } }>,
    reply: FastifyReply,
  ) {
    const { status } = request.body as { status: boolean };
    if (typeof status !== "boolean") {
      return reply.code(400).send({ error: "El campo status es requerido y debe ser booleano" });
    }

    try {
      const actuacion = await actuacionService.updateColiseoStatus(
        request.params.id,
        status,
        request.user.role,
      );
      if (!actuacion) {
        return reply.code(404).send({ error: "Actuacion no encontrada" });
      }
      return reply.send(actuacion);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  },

  async remove(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const actuacion = await actuacionService.delete(
        request.params.id,
        request.user.id,
        request.user.role,
      );
      if (!actuacion) {
        return reply.code(404).send({ error: "Actuacion no encontrada" });
      }
      return reply.send(actuacion);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  },
};
