import { cloudinaryThumb } from "@/lib/cloudinary";

import { fromAddress, sendEmail } from "./client";
import {
  appBaseUrl,
  orderConfirmationEmail,
  newsletterStudioNoteEmail,
  newsletterWelcomeEmail,
  orderUpdateEmail,
  signInAlertEmail,
  signInCodeEmail,
  welcomeEmail,
  type OrderUpdateEmailData,
  type SignInAlertData,
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
  /** Optional extras the template can show: invoice, GST, discount, arrival window… */
  extras?: Partial<OrderEmailData>;
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
    ...input.extras,
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

/** Not wired into sign-in yet: the site signs in with Google/password, and OTPs go by SMS. */
export async function sendSignInCodeEmail(to: string, code: string): Promise<boolean> {
  const { subject, html } = signInCodeEmail(to, code);
  return sendEmail({ to, subject, html });
}

export async function sendSignInAlertEmail(to: string, data: SignInAlertData): Promise<boolean> {
  const { subject, html } = signInAlertEmail(data);
  return sendEmail({ to, subject, html });
}

export async function sendNewsletterWelcomeEmail(to: string, unsubscribeToken: string): Promise<boolean> {
  const url = `${appBaseUrl()}/newsletter/unsubscribe?t=${encodeURIComponent(unsubscribeToken)}`;
  const { subject, html } = newsletterWelcomeEmail(url);
  return sendEmail({ to, subject, html });
}

/** Lets the studio see each signup arrive; best-effort like every other send. */
export async function sendNewsletterStudioNote(email: string): Promise<boolean> {
  const { subject, html } = newsletterStudioNoteEmail(email);
  return sendEmail({ to: fromAddress(), subject, html });
}
