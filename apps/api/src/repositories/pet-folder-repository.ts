import { db, petFolders, pets, users } from "@minidrive/db";
import { eq, desc, sql } from "drizzle-orm";

export const petFolderRepository = {
  async create(data: { name: string; createdById: string }) {
    const result = await db.insert(petFolders).values(data).returning();
    return result[0];
  },

  async findAll() {
    const rows = await db
      .select({
        id: petFolders.id,
        name: petFolders.name,
        coliseoStatus: petFolders.coliseoStatus,
        createdById: petFolders.createdById,
        createdAt: petFolders.createdAt,
        updatedAt: petFolders.updatedAt,
        petCount: sql<number>`cast(count(${pets.id}) as int)`,
      })
      .from(petFolders)
      .leftJoin(pets, eq(pets.folderId, petFolders.id))
      .groupBy(petFolders.id)
      .orderBy(desc(petFolders.createdAt));

    return rows;
  },

  async findById(id: string) {
    const result = await db
      .select()
      .from(petFolders)
      .where(eq(petFolders.id, id))
      .limit(1);
    return result[0] ?? null;
  },

  async deleteById(id: string) {
    await db.delete(petFolders).where(eq(petFolders.id, id));
  },

  async updateName(id: string, name: string) {
    const result = await db
      .update(petFolders)
      .set({ name })
      .where(eq(petFolders.id, id))
      .returning();
    return result[0] ?? null;
  },

  async updateColiseoStatus(id: string, status: boolean) {
    const result = await db
      .update(petFolders)
      .set({ coliseoStatus: status })
      .where(eq(petFolders.id, id))
      .returning();
    return result[0] ?? null;
  },
};
