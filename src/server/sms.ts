import { serverEnv } from "./env";

/**
 * OTP delivery over SMS, mirroring the email module's contract: never throws,
 * resolves to a boolean, and degrades to a console print when unconfigured so
 * the flow can be demoed with no provider account at all.
 *
 * MSG91 is the production adapter (India-focused, ~₹0.20/SMS). Its OTP route
 * requires a DLT-approved template; until DLT registration is done the demo
 * mode is the only honest option anyway.
 */

function smsConfigured(): boolean {
  return Boolean(serverEnv.MSG91_AUTH_KEY && serverEnv.MSG91_DLT_TEMPLATE_ID);
}

/** `phone` is the stored E.164 number, e.g. +919876543210. */
export async function sendOtpSms(phone: string, otp: string): Promise<boolean> {
  if (!smsConfigured()) {
    console.warn(`[sms] demo mode — OTP for ${phone}: ${otp}`);
    return true;
  }

  try {
    const response = await fetch(
      `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
        serverEnv.MSG91_DLT_TEMPLATE_ID as string,
      )}&mobile=${encodeURIComponent(phone.replace(/^\+/, ""))}&otp=${encodeURIComponent(otp)}`,
      {
        method: "POST",
        headers: { authkey: serverEnv.MSG91_AUTH_KEY as string },
      },
    );

    if (!response.ok) {
      console.error(`[sms] MSG91 responded ${response.status}: ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[sms] send failed:", error);
    return false;
  }
}
