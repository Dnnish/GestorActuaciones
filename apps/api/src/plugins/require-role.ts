import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import authenticatePlugin from "./authenticate.js";

export function requireRole(...roles: string[]) {
  const plugin: FastifyPluginAsync = async (app) => {
    await app.register(authenticatePlugin);

    app.addHook("preHandler", async (request, reply) => {
      if (!roles.includes(request.user.role)) {
        return reply.code(403).send({ error: "No tienes permisos para esta accion" });
      }
    });
  };

  return fp(plugin, { name: `require-role-${roles.join("-")}` });
}
