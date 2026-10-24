CREATE TYPE "public"."payment_txn_status" AS ENUM('created', 'captured', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "payment_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"provider_order_id" text NOT NULL,
	"provider_payment_id" text,
	"status" "payment_txn_status" DEFAULT 'created' NOT NULL,
	"amount_paise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"method" text,
	"method_detail" text,
	"error_code" text,
	"error_description" text,
	"confirmed_via" text,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_transaction_provider_payment_id_unique" UNIQUE("provider_payment_id"),
	CONSTRAINT "payment_txn_amount_positive" CHECK ("payment_transaction"."amount_paise" > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_txn_order_idx" ON "payment_transaction" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_txn_provider_order_idx" ON "payment_transaction" USING btree ("provider_order_id");