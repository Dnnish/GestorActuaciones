CREATE TABLE "pet_folders" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"coliseo_status" boolean DEFAULT false NOT NULL,
	"created_by_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "folder_id" varchar(36);--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "coliseo_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pet_folders" ADD CONSTRAINT "pet_folders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Backfill: create a migration folder for existing orphaned pets
DO $$
DECLARE
  migration_folder_id varchar(36);
  first_user_id varchar(36);
BEGIN
  IF EXISTS (SELECT 1 FROM pets WHERE folder_id IS NULL) THEN
    SELECT id INTO first_user_id FROM users LIMIT 1;
    migration_folder_id := gen_random_uuid()::varchar(36);
    INSERT INTO pet_folders (id, name, coliseo_status, created_by_id, created_at, updated_at)
    VALUES (migration_folder_id, 'Migración - ' || to_char(now(), 'YYYY-MM-DD'), false, first_user_id, now(), now());
    UPDATE pets SET folder_id = migration_folder_id WHERE folder_id IS NULL;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "pets" ALTER COLUMN "folder_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_folder_id_pet_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."pet_folders"("id") ON DELETE no action ON UPDATE no action;
