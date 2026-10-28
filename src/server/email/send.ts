import { cloudinaryThumb } from "@/lib/cloudinary";

import { sendEmail } from "./client";
import {
  appBaseUrl,
  orderConfirmationEmail,
  orderUpdateEmail,
  welcomeEmail,
  type OrderUpdateEmailData,
  type OrderEmailData,
  type OrderEmailItem,
} from "./templates";

/**
 * Thin, typed entry points the rest of the server calls. Each one resolves to
 * a boolean and never throws — see the contract on `sendEmail`.
 */

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const { subject, html } = welcomeEmail(name);
  return sendEmail({ to, subject, html });
}

/** Cloudinary URLs cannot be built when the cloud name env var is absent. */
export function safeThumb(publicId: string | null, size = 112): string | null {
  if (!publicId || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) return null;
  return cloudinaryThumb(publicId, size);
}

export interface OrderConfirmationInput {
  to: string;
  customerName: string;
  orderNumber: string;
  lookupToken: string;
  method: "gateway" | "whatsapp" | "cod";
  items: Array<{
    productName: string;
    qty: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    imagePublicId: string | null;
  }>;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  address: OrderEmailData["address"];
}

export async function sendOrderConfirmationEmail(input: OrderConfirmationInput): Promise<boolean> {
  const items: OrderEmailItem[] = input.items.map((item) => ({
    name: item.productName,
    qty: item.qty,
    unitPricePaise: item.unitPricePaise,
    lineTotalPaise: item.lineTotalPaise,
    imageUrl: safeThumb(item.imagePublicId),
  }));

  const { subject, html } = orderConfirmationEmail({
    customerName: input.customerName,
    orderNumber: input.orderNumber,
    method: input.method,
    items,
    subtotalPaise: input.subtotalPaise,
    shippingPaise: input.shippingPaise,
    totalPaise: input.totalPaise,
    address: input.address,
    statusUrl: `${appBaseUrl()}/checkout/done/${input.lookupToken}`,
  });

  return sendEmail({ to: input.to, subject, html });
}

export async function sendOrderUpdateEmail(
  to: string,
  data: OrderUpdateEmailData,
): Promise<boolean> {
  const { subject, html } = orderUpdateEmail(data);
  return sendEmail({ to, subject, html });
}
