import type { FastifyPluginAsync } from "fastify";
import authenticatePlugin from "../plugins/authenticate.js";
import { petHandler } from "../handlers/pet-handler.js";

const petRoutes: FastifyPluginAsync = async (app) => {
  await app.register(authenticatePlugin);

  // Reorder PETs within a folder
  app.patch("/api/pets/reorder", petHandler.reorder);

  // Bulk download PETs as ZIP
  app.post("/api/pets/bulk-download", petHandler.bulkDownload);

  // Bulk delete PETs (admin/superadmin only)
  app.post(
    "/api/pets/bulk-delete",
    {
      preHandler: async (request, reply) => {
        if (!["superadmin", "admin"].includes(request.user.role)) {
          return reply.code(403).send({ error: "No tienes permisos para esta accion" });
        }
      },
    },
    petHandler.bulkRemove,
  );

  // Download a PET file (all authenticated users)
  app.get("/api/pets/:id/download", petHandler.download);

  // Delete a PET (admin and superadmin only)
  app.delete(
    "/api/pets/:id",
    {
      preHandler: async (request, reply) => {
        if (!["superadmin", "admin"].includes(request.user.role)) {
          return reply.code(403).send({ error: "No tienes permisos para esta accion" });
        }
      },
    },
    petHandler.remove,
  );

  // Toggle coliseo status for a single pet (admin/superadmin only)
  app.patch(
    "/api/pets/:id/coliseo",
    {
      preHandler: async (request, reply) => {
        if (!["superadmin", "admin"].includes(request.user.role)) {
          return reply.code(403).send({ error: "No tienes permisos para esta accion" });
        }
      },
    },
    petHandler.toggleColiseo,
  );
};

export default petRoutes;
