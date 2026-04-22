import { pgTable, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./users";

export const petFolders = pgTable("pet_folders", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 500 }).notNull(),
  coliseoStatus: boolean("coliseo_status").notNull().default(false),
  createdById: varchar("created_by_id", { length: 36 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const pets = pgTable("pets", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  folderId: varchar("folder_id", { length: 36 })
    .notNull()
    .references(() => petFolders.id),
  filename: varchar("filename", { length: 500 }).notNull(),
  storageKey: varchar("storage_key", { length: 1000 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  coliseoStatus: boolean("coliseo_status").notNull().default(false),
  uploadedById: varchar("uploaded_by_id", { length: 36 })
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
