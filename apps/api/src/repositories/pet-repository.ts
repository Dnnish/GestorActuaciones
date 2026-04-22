import { db, pets, users } from "@minidrive/db";
import { eq, asc, desc, inArray } from "drizzle-orm";

export const petRepository = {
  async create(data: {
    folderId: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    uploadedById: string;
  }) {
    const result = await db.insert(pets).values(data).returning();
    return result[0];
  },

  async findAll() {
    return db
      .select({
        id: pets.id,
        folderId: pets.folderId,
        filename: pets.filename,
        storageKey: pets.storageKey,
        mimeType: pets.mimeType,
        size: pets.size,
        coliseoStatus: pets.coliseoStatus,
        uploadedById: pets.uploadedById,
        uploadedByName: users.name,
        uploadedAt: pets.uploadedAt,
      })
      .from(pets)
      .innerJoin(users, eq(pets.uploadedById, users.id))
      .orderBy(asc(pets.sortOrder), desc(pets.uploadedAt));
  },

  async findByFolderId(folderId: string) {
    return db
      .select({
        id: pets.id,
        folderId: pets.folderId,
        filename: pets.filename,
        storageKey: pets.storageKey,
        mimeType: pets.mimeType,
        size: pets.size,
        coliseoStatus: pets.coliseoStatus,
        uploadedById: pets.uploadedById,
        uploadedByName: users.name,
        uploadedAt: pets.uploadedAt,
      })
      .from(pets)
      .innerJoin(users, eq(pets.uploadedById, users.id))
      .where(eq(pets.folderId, folderId))
      .orderBy(asc(pets.sortOrder), desc(pets.uploadedAt));
  },

  async findAllByFolderId(folderId: string) {
    return db.select().from(pets).where(eq(pets.folderId, folderId));
  },

  async findById(id: string) {
    const result = await db
      .select()
      .from(pets)
      .where(eq(pets.id, id))
      .limit(1);
    return result[0] ?? null;
  },

  async deleteById(id: string) {
    await db.delete(pets).where(eq(pets.id, id));
  },

  async deleteByFolderId(folderId: string) {
    await db.delete(pets).where(eq(pets.folderId, folderId));
  },

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(pets).where(inArray(pets.id, ids));
  },

  async deleteByIds(ids: string[]) {
    if (ids.length === 0) return;
    await db.delete(pets).where(inArray(pets.id, ids));
  },

  async updateColiseoStatus(id: string, status: boolean) {
    const result = await db
      .update(pets)
      .set({ coliseoStatus: status })
      .where(eq(pets.id, id))
      .returning();
    return result[0] ?? null;
  },

  async reorder(items: { id: string; sortOrder: number }[]) {
    if (items.length === 0) return;
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(pets)
          .set({ sortOrder: item.sortOrder })
          .where(eq(pets.id, item.id));
      }
    });
  },
};
