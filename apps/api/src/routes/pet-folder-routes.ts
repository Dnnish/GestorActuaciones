import type { FastifyPluginAsync } from "fastify";
import multipart from "@fastify/multipart";
import authenticatePlugin from "../plugins/authenticate.js";
import { petFolderHandler } from "../handlers/pet-folder-handler.js";
import { petHandler } from "../handlers/pet-handler.js";

const petFolderRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  await app.register(authenticatePlugin);

  // List all folders (all authenticated users)
  app.get("/api/pet-folders", petFolderHandler.list);

  // Create a new folder (all authenticated users)
  app.post("/api/pet-folders", petFolderHandler.create);

  // Get folder by id (all authenticated users)
  app.get("/api/pet-folders/:folderId", petFolderHandler.getById);

  // Rename a folder (all authenticated users)
  app.patch("/api/pet-folders/:folderId", petFolderHandler.rename);

  // Delete a folder and all its pets (admin/superadmin only)
  app.delete(
    "/api/pet-folders/:folderId",
    {
      preHandler: async (request, reply) => {
        if (!["superadmin", "admin"].includes(request.user.role)) {
          return reply.code(403).send({ error: "No tienes permisos para esta accion" });
        }
      },
    },
    petFolderHandler.remove,
  );

  // Toggle coliseo status for a folder (admin/superadmin only)
  app.patch(
    "/api/pet-folders/:folderId/coliseo",
    {
      preHandler: async (request, reply) => {
        if (!["superadmin", "admin"].includes(request.user.role)) {
          return reply.code(403).send({ error: "No tienes permisos para esta accion" });
        }
      },
    },
    petFolderHandler.updateColiseo,
  );

  // Download all pets in a folder as ZIP (all authenticated users)
  app.get("/api/pet-folders/:folderId/download", petFolderHandler.downloadZip);

  // List pets in a folder (all authenticated users)
  app.get("/api/pet-folders/:folderId/pets", petHandler.listByFolder);

  // Upload a pet to a specific folder (all authenticated users)
  app.post("/api/pet-folders/:folderId/pets", petHandler.upload);
};

export default petFolderRoutes;
