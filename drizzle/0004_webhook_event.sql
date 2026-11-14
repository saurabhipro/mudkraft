CREATE TABLE "webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "webhook_event_received_idx" ON "webhook_event" USING btree ("received_at");