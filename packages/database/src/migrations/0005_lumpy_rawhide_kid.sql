ALTER TABLE "mh_communities" ADD COLUMN "distress_score" real;--> statement-breakpoint
ALTER TABLE "mh_communities" ADD COLUMN "distress_updated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "mh_communities_distress_score_idx" ON "mh_communities" USING btree ("distress_score");