import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { db, users } from "@minidrive/db";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser;
  }
}

const authenticatePlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest("user", null);

  app.addHook("preHandler", async (request: FastifyRequest, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.raw.headers),
    });

    if (!session?.user) {
      return reply.code(401).send({ error: "No autenticado" });
    }

    const dbUser = await db.select().from(users).where(eq(users.id, session.user.id)).then(r => r[0]);

    if (!dbUser) {
      return reply.code(401).send({ error: "Usuario no encontrado" });
    }

    if (dbUser.deletedAt) {
      return reply.code(401).send({ error: "Usuario eliminado" });
    }

    request.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };
  });
};

export default fp(authenticatePlugin, {
  name: "authenticate",
});
