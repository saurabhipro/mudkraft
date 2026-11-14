# Razorpay runbook

How online payments work on mudkraft.com, how to set up and look after the
Razorpay account, and what to do when something needs a person. Companion to
[TESTING-AND-GO-LIVE.md](./TESTING-AND-GO-LIVE.md), which covers test drills
and the go-live checklist.

---

## 1. How a payment moves

1. The customer places an order with **Pay now**. Bikriup creates the order
   (`payment_method = online`, `payment_status = unpaid`).
2. On `/checkout/pay/<token>` the site opens **one Razorpay order per shop
   order** (receipt = the MK order number) and stores its id on the Bikriup
   order. Every later click, tab or refresh reuses it, so the customer can only
   ever pay that one gateway order.
3. Razorpay's modal takes the card or UPI details. Mudkraft never sees them.
4. Two paths then settle the order, and either can arrive first:
   - the modal's callback, verified with the API key secret;
   - the `payment.captured` webhook, verified with the webhook secret.
   Both re-read the payment from Razorpay, check the receipt and amount,
   capture it if it is only authorized, and report it to Bikriup.
5. Bikriup marks the order **paid**, which sends the customer the
   "payment received" WhatsApp and email.
6. Staff can confirm, pack, ship or book a courier for an online order **only
   once it is paid**. Bikriup refuses those steps before that.

**Duplicate payments.** If an order somehow gets paid twice (for example two
gateway orders opened before this version), Bikriup refuses the second
payment and the site refunds it in full straight away. The customer sees
"your second payment has been refunded". The refund carries the note
`reason = duplicate` in the dashboard.

**Failed payments** are recorded on the order (`payment_status = failed`) and
the customer gets a WhatsApp with a Pay-now link. The order stays payable.

---

## 2. Dashboard setup

Do these in **test mode** first, then repeat steps 1, 2 and 5 in **live
mode** after activation. Test and live mode keep separate keys and webhooks.

1. **API keys.** Account & Settings → API Keys → Generate Key. The secret is
   shown once. Put it straight into `/etc/mudkraft.env` on the VM (section 3).
   Never send keys over WhatsApp, email or chat.
2. **Webhook.** Account & Settings → Webhooks → Add New Webhook.
   - URL: `https://www.mudkraft.com/api/razorpay/webhook`
   - Secret: `openssl rand -hex 32`, saved as `RAZORPAY_WEBHOOK_SECRET`. This
     is a different secret from the API key secret.
   - Alert email: the studio inbox.
   - Events: `payment.captured`, `payment.failed`, `refund.processed`,
     `refund.failed`. Nothing else is needed.
3. **Payment capture.** Account & Settings → Payment Capture → automatically
   capture all payments. The site also captures on its own, but this means no
   authorized money waits at the bank.
4. **Payment methods.** Keep UPI (collect, intent, QR), debit and credit
   cards, netbanking and wallets. Leave EMI, Pay Later and international cards
   off unless the studio decides otherwise; they add chargeback and fraud risk.
5. **Checkout branding.** Account & Settings → Checkout: name "Mudkraft
   Studio", logo, theme colour `#8a5a3b`, support email and phone.
6. **Account security.** Turn on two-factor sign-in for the owner. Give the
   developer their own team member login with a restricted role instead of
   sharing the owner login.
7. **Customer emails.** Turn off Razorpay's own success and failure emails to
   customers. The site already sends its own confirmation and failure
   messages, and one message per event is less confusing.
8. **Activation (KYC).** Business type, PAN, GST if registered, category
   *E-commerce → Home décor / Handicrafts*, settlement bank account. Website
   pages Razorpay checks: `/terms`, `/privacy`, `/shipping-returns`, `/trust`,
   with the phone and email from the footer.
9. Settlement schedule: the default T+2 is fine.

---

## 3. Secrets on the VM

The live settings are in `/etc/mudkraft.env`. It must stay owned by root and
readable only by root:

```
sudo chown root:root /etc/mudkraft.env
sudo chmod 600 /etc/mudkraft.env
```

After any edit, restart the site and check it came up:

```
sudo systemctl restart mudkraft
curl -fsS http://127.0.0.1:3000/api/health
journalctl -u mudkraft -n 50
```

The site checks the Razorpay settings when it starts:

- A key id without its secret, or a key id that is not `rzp_test_…` /
  `rzp_live_…`, stops the start with a clear message.
- Live keys without a webhook secret of at least 32 characters stop the start.
- Test keys on the live site start normally but log
  `!!! Razorpay TEST keys on the live site … !!!` three times. Checkout works,
  but nobody is charged. Swap in the live keys.

### Rotating the API key

1. Dashboard → API Keys → Regenerate (or create a new key).
2. Put the new id and secret in `/etc/mudkraft.env`, restart.
3. Pay a ₹1 order and refund it.
4. Remove the old key in the dashboard.

Rotate at once if the secret may have been seen by anyone else.

### Rotating the webhook secret

1. Dashboard → Webhooks → edit → new secret (`openssl rand -hex 32`).
2. Put it in `RAZORPAY_WEBHOOK_SECRET`, restart.
3. Dashboard → Webhooks → the webhook's deliveries should show `200`.
   A run of `401` means the two secrets do not match.

Between steps 1 and 2 deliveries fail with 401. Razorpay retries them for up
to 24 hours, so nothing is lost if step 2 follows soon.

---

## 4. Refunds

- **Whole order:** refund it in the Razorpay dashboard (Transactions →
  Payments → the payment → Refund). When Razorpay finishes, the
  `refund.processed` webhook turns the Bikriup order **Refunded** and the
  customer gets the refund message.
- **Part of an order** (one broken piece): issue the credit note in Bikriup
  as usual and refund that amount in the dashboard. The order stays paid until
  the refunds add up to the full total. Mark the credit note refunded in
  Bikriup.
- **Duplicate payments** are refunded by the site on its own (section 1).
- **Cancelled after payment:** Bikriup sets `refund_due`. Refund in the
  dashboard; the webhook closes it.

Normal-speed refunds take 5–7 working days to reach the customer.

---

## 5. Alert emails and what to do

Alerts go to `ALERT_EMAIL` (or `SMTP_FROM` when it is not set), with the
subject starting `[Mudkraft payments]`.

**"Payment needs checking"** — Razorpay captured money that could not be
matched to its order automatically. Usually the order total changed after the
customer opened the payment (a delivery charge edited by hand).

1. Find the payment in the dashboard; note its gateway order and amount.
2. Open the order in Bikriup (the gateway order's receipt is the MK number).
3. If the customer paid the right amount for what they will receive, record
   the payment on the order by hand with the `pay_…` id as reference.
4. Otherwise refund the difference, or the whole payment, and tell the
   customer.

**"Refund failed"** — money that should have gone back did not. Retry it from
the dashboard, or pay the customer back another way and note it on the order.

---

## 6. Reconciliation (weekly)

1. Dashboard → Reports → Settlements: export the week.
2. Bikriup → web orders paid online in the same week.
3. Every captured payment should match one paid order by `payment_ref`
   (`pay_…`). Payments refunded with `reason = duplicate` net to zero and have
   no order of their own.
4. Anything left over: start from section 5.

---

## 7. Logs

`journalctl -u mudkraft` lines to know:

| Prefix | Meaning |
|---|---|
| `[razorpay] audit: duplicate payment …` | A second payment was refunded automatically. Informational. |
| `[razorpay] webhook could not settle …` | Same event as the "Payment needs checking" alert. |
| `[razorpay] webhook … failed` | Bikriup or Razorpay was unreachable. Razorpay retries; act only if it repeats. |
| `[csp] …` | A browser reported something the content policy would block. Review weekly. |

Logs carry order numbers, gateway ids and amounts. Phone numbers are masked
and card or UPI details never reach the site.
