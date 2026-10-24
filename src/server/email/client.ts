import nodemailer, { type Transporter } from "nodemailer";

import { serverEnv } from "../env";

/**
 * SMTP transport for transactional mail (Titan, implicit TLS on 465).
 *
 * Email is deliberately best-effort: `sendEmail` never throws. An unreachable
 * SMTP server must never fail an order or a signup — the money flow and the
 * account flow always win over the notification.
 */

const FROM_NAME = "Mudkraft Studio";

export function isEmailConfigured(): boolean {
  return Boolean(
    serverEnv.SMTP_HOST && serverEnv.SMTP_PORT && serverEnv.SMTP_USER && serverEnv.SMTP_PASS,
  );
}

let cached: Transporter | null = null;

function transporter(): Transporter {
  if (!cached) {
    cached = nodemailer.createTransport({
      host: serverEnv.SMTP_HOST,
      port: serverEnv.SMTP_PORT,
      // Implicit TLS on 465; STARTTLS upgrade on anything else (e.g. 587).
      secure: serverEnv.SMTP_PORT === 465,
      auth: { user: serverEnv.SMTP_USER, pass: serverEnv.SMTP_PASS },
    });
  }
  return cached;
}

export function fromAddress(): string {
  return serverEnv.SMTP_FROM ?? serverEnv.SMTP_USER ?? "hello@mudkraft.com";
}

export interface SendEmailInput {
  to?: string;
  /** Broadcast recipients. Always BCC — recipients must never see each other. */
  bcc?: string[];
  subject: string;
  html: string;
}

/** Returns true when the message was accepted by the SMTP server. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(`[email] SMTP not configured — skipped "${input.subject}"`);
    return false;
  }
  if (!input.to && (!input.bcc || input.bcc.length === 0)) return false;

  try {
    await transporter().sendMail({
      from: `"${FROM_NAME}" <${fromAddress()}>`,
      // BCC-only sends still need a To header; the studio addresses itself.
      to: input.to ?? fromAddress(),
      bcc: input.bcc,
      subject: input.subject,
      html: input.html,
    });
    return true;
  } catch (error) {
    console.error(`[email] Failed to send "${input.subject}"`, error);
    return false;
  }
}
