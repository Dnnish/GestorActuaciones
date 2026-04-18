import type { FastifyPluginAsync } from "fastify";
import multipart from "@fastify/multipart";
import authenticatePlugin from "../plugins/authenticate.js";
import { documentHandler } from "../handlers/document-handler.js";

const documentRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
  await app.register(authenticatePlugin);

  // Upload document to actuacion folder
  app.post("/api/actuaciones/:actuacionId/documents", documentHandler.upload);

  // List documents by folder
  app.get("/api/actuaciones/:actuacionId/documents", documentHandler.list);

  // Download document
  app.get("/api/documents/:id/download", documentHandler.download);

  // Delete document (superadmin and admin only)
  app.delete(
    "/api/documents/:id",
    {
      preHandler: async (request, reply) => {
        if (!["superadmin", "admin"].includes(request.user.role)) {
          return reply.code(403).send({ error: "No tienes permisos para esta accion" });
        }
      },
    },
    documentHandler.remove,
  );
};

export default documentRoutes;
