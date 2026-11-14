# Mudkraft — Payment, COD & Delivery-Verification Testing Guide

How to demo every money-and-delivery flow on localhost today, and exactly what
changes when we go to production. Written 2026-08-03 against branch
`deepak_VG_PG`.

Companion file: [costing.xlsx](./costing.xlsx) — per-transaction and one-time
costs for Razorpay, SMS OTP and WhatsApp (regenerate with
`npx tsx scripts/generate-costing.ts`).

---

## 0. One-time demo setup

1. Copy `.env.example` → `.env.local` and fill the always-required values
   (`DATABASE_URL`, `BETTER_AUTH_*`, Google, Cloudinary).
2. Create a free account at [razorpay.com](https://razorpay.com) — **no KYC
   needed for test mode**. Dashboard → Account & Settings → API Keys →
   generate **test** keys and paste them in:

   ```
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="..."
   ```

3. Leave `MSG91_*` and `RAZORPAY_WEBHOOK_SECRET` blank — both degrade to demo
   behaviour on purpose (OTP prints to console; webhook stays inert).
4. `npm run dev`, and keep the terminal visible — it is where demo OTPs appear.

Everything below assumes at least one **active product** exists in the catalogue.

---

## 1. Online payment (Razorpay test mode)

**Path:** add to cart → `/checkout` → fill details → **Pay now** →
`/checkout/pay/<token>` → **Pay securely with UPI / card** → Razorpay modal.

**Test instruments (no real money ever moves in test mode):**

| Instrument | Value | Result |
|---|---|---|
| Card | `4111 1111 1111 1111`, any future expiry, any CVV | Success |
| Card | `4000 0000 0000 0002` | Declined |
| UPI | `success@razorpay` | Success |
| UPI | `failure@razorpay` | Failure |
| Netbanking | any test bank | Success/failure buttons shown |

**What to verify after a successful payment:**

- Redirect lands on `/checkout/done/<token>` showing **Payment received**.
- Confirmation email arrives (if SMTP configured) with the correct next-step line.
- Admin → Orders → the order shows status `confirmed`, payment `paid`.
- Admin → order row menu → **View details & payments** → the *Payment attempts*
  table has one `captured` row with method, masked detail (VPA / card last-4),
  amount, Razorpay `pay_...` id, and `confirmed via: handler`.

**Failure & retry drill (do this once — it exercises the attempt history):**

1. Pay with the declined card → error shows, order stays `unpaid`, done page
   still offers **Pay now**.
2. Retry with the success card → order settles.
3. Admin payment attempts now show **two rows**: one `failed` with the error
   code, one `captured`. That history is the answer to "I paid twice!".

**Abandonment:** close the modal without paying — nothing breaks, the order
stays payable from the done page (that page is also linked from the email).

---

## 2. Cash on Delivery (Delhi NCR only)

**Eligibility is by PIN prefix** (`src/lib/serviceability.ts`):
`110` Delhi · `122` Gurgaon · `2013` Noida/Greater Noida.

| Test | PIN | Expected |
|---|---|---|
| Eligible | `110001`, `122001`, `201301` | **Cash on delivery** button appears between Pay now and WhatsApp |
| Ineligible | `400001` (Mumbai) | COD button hidden; hint says COD is Delhi-NCR only |
| Server enforcement | Devtools: call `placeOrder` with `method: "cod"` and PIN `400001` | Rejected with a field error on the PIN — the hidden button is UX, the server is the gate |

**After placing a COD order:** done page says "pay ₹X in cash when it
arrives", no Pay now button; email says keep the amount ready; admin shows
provider `cod`, payment `unpaid`. **An unpaid COD order in transit is normal**
— it is marked paid manually in admin (payment dropdown) after the cash is
collected at the door.

---

## 3. Delivery verification (QR + OTP, one-time)

**Print side:** Admin → order detail → *Delivery verification* panel →
**Generate delivery QR** → QR appears with its URL → **Print QR label** →
paste on the box.

**Customer side (demo):**

1. Scan the QR with a phone (or open the shown `/verify/<token>` URL).
2. Page greets the customer by first name and shows the **masked** phone the
   order was placed with (`+91 9•••••••43`).
3. **Text me the code** → in demo mode the OTP appears in the dev-server
   terminal: `[sms] demo mode — OTP for +91••••••3344: 123456` (the phone is
   masked; a production build never prints the code).
4. Enter the code → **Verified**. Order status jumps to `delivered`, an order
   event records "Delivery verified by the customer", admin badge flips to
   *verified* with a timestamp.
5. **Scan the QR again** → "All done — this code works only once." The OTP
   form is never rendered again. This is enforced in the database, not the UI.

**Abuse limits worth demoing:** wrong code 5× → locked until a new code is
requested; resend inside 60 s → "give it a minute"; 6th send overall →
"contact us on WhatsApp".

---

## 4. WhatsApp order path (already live)

**Confirm on WhatsApp** at checkout creates the order with provider
`whatsapp` and the done page deep-links into a prefilled `wa.me` chat. This
click-to-chat link costs **nothing** and needs no Meta setup — see the costing
sheet for what changes if we adopt the WhatsApp Business (Cloud) API for
programmatic messages later.

---

## 5. Going to production — the full checklist

### Razorpay

Deploy order: **Bikriup first, then Mudkraft.** Bikriup adds the gateway-order
endpoint and the duplicate-payment check that the site's new code calls; the
Mudkraft deploy then applies its `webhook_event` migration automatically
(`deploy/mudkraft/mudkraft-deploy.sh` in the Bikriup repo runs `npm run db:migrate`
before switching — reinstall it on the VM as `/usr/local/bin/mudkraft-deploy`).

| # | Change | Where |
|---|---|---|
| 1 | Complete KYC: business type (individual/proprietor is fine), PAN, bank account (penny-drop verified), address proof | Razorpay dashboard → Account activation |
| 2 | Give Razorpay the policy page links: `/terms`, `/privacy`, `/shipping-returns` (refunds and cancellation), `/trust`, plus the footer contact details | Activation form |
| 3 | Turn on **automatic capture**. The code also captures an authorized payment itself; only captured payments ever mark an order paid | Dashboard → Account & Settings → Payment Capture |
| 4 | Swap `rzp_test_` → `rzp_live_` keys. **No code changes.** The app refuses to start with live keys and no webhook secret | `/etc/mudkraft.env` on the VM, then restart |
| 5 | Register the **live** webhook: URL `https://www.mudkraft.com/api/razorpay/webhook`, events `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`; secret from `openssl rand -hex 32` (32+ characters) | Dashboard (Live mode) → Webhooks, then `RAZORPAY_WEBHOOK_SECRET` |
| 6 | Set `ALERT_EMAIL` to the inbox that should hear about amount mismatches and failed refunds (defaults to `SMTP_FROM`) | `/etc/mudkraft.env` |
| 7 | Place one real ₹1 order end-to-end. Then open **Pay** in two tabs on a second ₹1 order and pay in both: the second payment must come back as an automatic refund (`notes.reason = duplicate` in the dashboard) | — |
| 8 | Refund the first ₹1 order from the dashboard; the order must turn **Refunded** in Bikriup within a minute | — |
| 9 | Watch the server log for `[csp]` lines for a week; add any legitimate source to the policy in `next.config.ts`, then switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy` | `journalctl -u mudkraft \| grep "\[csp\]"` |

The webhook matters in production: it settles orders when the customer's
browser dies between paying and confirming, records failed attempts, and
closes refunds. On localhost the in-browser handler alone is fine. Day-to-day
operations (key rotation, refunds, reconciliation, alerts) are in
[razorpay-runbook.md](./razorpay-runbook.md).

### SMS OTP (delivery verification)

| # | Change | Notes |
|---|---|---|
| 1 | TRAI **DLT registration** (one-time, ~₹5,900 on one operator portal, covers all networks, 2–7 working days) | Required by law; unregistered OTP routes are blocked by Jio/Airtel/Vi |
| 2 | Register sender ID (e.g. `MUDKRT`) and the OTP template on DLT | Template text must match exactly |
| 3 | MSG91 account + prepaid wallet | ~₹0.20/SMS |
| 4 | Fill `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_DLT_TEMPLATE_ID` | Console demo mode switches itself off; no code changes |

**Alternative:** WhatsApp authentication templates (~₹0.13/msg) need **no DLT**
— if we adopt the Cloud API for chat anyway, sending the delivery OTP over
WhatsApp instead of SMS removes the DLT cost and step entirely (small adapter
change in `src/server/sms.ts`).

### Email

`SMTP_PASS` (Titan) is still blank — welcome, order-confirmation and
verification-adjacent emails silently skip until it is set.

### General

- `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` → the real domain (the QR encodes
  this URL — QRs printed with a wrong base URL are wasted stickers).
- Google OAuth redirect URI for the production domain.
- The COD region list and any future COD cap live in
  `src/lib/serviceability.ts` — one line to extend.
- Before the first real dispatch, run one full rehearsal: order → pay (₹1) →
  mark dispatched → print QR → scan → OTP → verified.
