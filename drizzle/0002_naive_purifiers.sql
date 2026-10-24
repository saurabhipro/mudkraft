CREATE TABLE "delivery_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"token" text NOT NULL,
	"otp_hash" text,
	"otp_expires_at" timestamp with time zone,
	"send_count" integer DEFAULT 0 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_sent_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_verification_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "delivery_verification_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "delivery_verification" ADD CONSTRAINT "delivery_verification_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;