import { db, documents, users } from "@minidrive/db";
import { eq, and, asc, desc, inArray, sql } from "drizzle-orm";

export const documentRepository = {
  async create(data: {
    actuacionId: string;
    folder: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    uploadedById: string;
  }) {
    const result = await db.insert(documents).values(data).returning();
    return result[0];
  },

  async findById(id: string) {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    return result[0] ?? null;
  },

  async findByActuacionAndFolder(actuacionId: string, folder: string) {
    return db
      .select({
        id: documents.id,
        actuacionId: documents.actuacionId,
        folder: documents.folder,
        filename: documents.filename,
        storageKey: documents.storageKey,
        mimeType: documents.mimeType,
        size: documents.size,
        uploadedById: documents.uploadedById,
        uploadedByName: users.name,
        uploadedAt: documents.uploadedAt,
      })
      .from(documents)
      .innerJoin(users, eq(documents.uploadedById, users.id))
      .where(
        and(
          eq(documents.actuacionId, actuacionId),
          eq(documents.folder, folder as "postes" | "camaras" | "fachadas" | "fotos" | "planos"),
        ),
      )
      .orderBy(asc(documents.sortOrder), desc(documents.uploadedAt));
  },

  async findByActuacion(actuacionId: string) {
    return db
      .select({
        id: documents.id,
        actuacionId: documents.actuacionId,
        folder: documents.folder,
        filename: documents.filename,
        storageKey: documents.storageKey,
        mimeType: documents.mimeType,
        size: documents.size,
      })
      .from(documents)
      .where(eq(documents.actuacionId, actuacionId))
      .orderBy(documents.folder, desc(documents.uploadedAt));
  },

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(documents).where(inArray(documents.id, ids));
  },

  async deleteById(id: string) {
    await db.delete(documents).where(eq(documents.id, id));
  },

  async deleteByIds(ids: string[]) {
    if (ids.length === 0) return;
    await db.delete(documents).where(inArray(documents.id, ids));
  },

  async deleteByActuacionId(actuacionId: string) {
    await db.delete(documents).where(eq(documents.actuacionId, actuacionId));
  },

  async reorder(items: { id: string; sortOrder: number }[]) {
    if (items.length === 0) return;
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(documents)
          .set({ sortOrder: item.sortOrder })
          .where(eq(documents.id, item.id));
      }
    });
  },
};
