ALTER TABLE "documents" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;