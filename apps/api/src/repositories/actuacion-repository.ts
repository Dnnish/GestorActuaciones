import { db, actuaciones, users, documents } from "@minidrive/db";
import { eq, desc, asc, count, sql, and, type SQL } from "drizzle-orm";

export const actuacionRepository = {
  async findAll(
    page: number,
    limit: number,
    search?: string,
    sortBy = "date",
    sortOrder = "desc",
    coliseoStatus = "all",
  ) {
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        sql`(similarity(${actuaciones.name}, ${search}) > 0.1 OR ${actuaciones.name} ILIKE ${"%" + search + "%"})`,
      );
    }

    if (coliseoStatus !== "all") {
      conditions.push(eq(actuaciones.coliseoStatus, coliseoStatus === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause = search
      ? sql`similarity(${actuaciones.name}, ${search}) DESC`
      : sortBy === "name"
        ? (sortOrder === "asc" ? asc(actuaciones.name) : desc(actuaciones.name))
        : (sortOrder === "asc" ? asc(actuaciones.createdAt) : desc(actuaciones.createdAt));

    const baseQuery = db
      .select({
        id: actuaciones.id,
        name: actuaciones.name,
        createdById: actuaciones.createdById,
        createdByName: users.name,
        coliseoStatus: actuaciones.coliseoStatus,
        folderColiseoStatuses: actuaciones.folderColiseoStatuses,
        createdAt: actuaciones.createdAt,
        updatedAt: actuaciones.updatedAt,
      })
      .from(actuaciones)
      .innerJoin(users, eq(actuaciones.createdById, users.id));

    const countQuery = db.select({ total: count() }).from(actuaciones);

    const [data, totalResult] = await Promise.all([
      whereClause
        ? baseQuery.where(whereClause).orderBy(orderByClause).limit(limit).offset(offset)
        : baseQuery.orderBy(orderByClause).limit(limit).offset(offset),
      whereClause
        ? countQuery.where(whereClause)
        : countQuery,
    ]);

    return { data, total: totalResult[0]?.total ?? 0 };
  },

  async findById(id: string) {
    const result = await db
      .select({
        id: actuaciones.id,
        name: actuaciones.name,
        createdById: actuaciones.createdById,
        createdByName: users.name,
        coliseoStatus: actuaciones.coliseoStatus,
        folderColiseoStatuses: actuaciones.folderColiseoStatuses,
        createdAt: actuaciones.createdAt,
        updatedAt: actuaciones.updatedAt,
      })
      .from(actuaciones)
      .innerJoin(users, eq(actuaciones.createdById, users.id))
      .where(eq(actuaciones.id, id))
      .limit(1);

    return result[0] ?? null;
  },

  async getDocumentCountsByFolder(actuacionId: string): Promise<Record<string, number>> {
    const rows = await db
      .select({
        folder: documents.folder,
        total: count(),
      })
      .from(documents)
      .where(eq(documents.actuacionId, actuacionId))
      .groupBy(documents.folder);

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.folder] = row.total;
    }
    return result;
  },

  async create(data: { name: string; createdById: string }) {
    const result = await db
      .insert(actuaciones)
      .values(data)
      .returning();
    return result[0];
  },

  async updateName(id: string, name: string) {
    const result = await db
      .update(actuaciones)
      .set({ name })
      .where(eq(actuaciones.id, id))
      .returning();
    return result[0] ?? null;
  },

  async updateColiseoStatus(id: string, status: boolean) {
    const result = await db
      .update(actuaciones)
      .set({ coliseoStatus: status })
      .where(eq(actuaciones.id, id))
      .returning();
    return result[0] ?? null;
  },

  async updateFolderColiseoStatus(id: string, folder: string, status: boolean) {
    const row = await db
      .select({ folderColiseoStatuses: actuaciones.folderColiseoStatuses })
      .from(actuaciones)
      .where(eq(actuaciones.id, id))
      .limit(1);
    if (!row[0]) return null;

    const current = (row[0].folderColiseoStatuses ?? {}) as Record<string, boolean>;
    const updated = { ...current, [folder]: status };

    const result = await db
      .update(actuaciones)
      .set({ folderColiseoStatuses: updated })
      .where(eq(actuaciones.id, id))
      .returning();
    return result[0] ?? null;
  },

  async deleteById(id: string) {
    await db.delete(actuaciones).where(eq(actuaciones.id, id));
  },
};
