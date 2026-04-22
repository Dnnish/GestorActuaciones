import { pgTable, varchar, bigint, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { actuaciones } from "./actuaciones";
import { users } from "./users";

export const folderEnum = pgEnum("folder", [
  "postes",
  "camaras",
  "fachadas",
  "fotos",
  "planos",
  "arquetas",
]);

export const documents = pgTable("documents", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  actuacionId: varchar("actuacion_id", { length: 36 })
    .notNull()
    .references(() => actuaciones.id),
  folder: folderEnum("folder").notNull(),
  filename: varchar("filename", { length: 500 }).notNull(),
  storageKey: varchar("storage_key", { length: 1000 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  uploadedById: varchar("uploaded_by_id", { length: 36 })
    .notNull()
    .references(() => users.id),
  sortOrder: integer("sort_order").notNull().default(0),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
