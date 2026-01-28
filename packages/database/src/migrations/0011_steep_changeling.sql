CREATE TABLE "sync_checkpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"sync_session_id" text NOT NULL,
	"source" text NOT NULL,
	"last_completed_entity" text,
	"total_records_synced" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sync_chk_session_idx" ON "sync_checkpoints" USING btree ("sync_session_id");--> statement-breakpoint
CREATE INDEX "sync_chk_source_idx" ON "sync_checkpoints" USING btree ("source");--> statement-breakpoint
CREATE INDEX "sync_chk_status_idx" ON "sync_checkpoints" USING btree ("status");