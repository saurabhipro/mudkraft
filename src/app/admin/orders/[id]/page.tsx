import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  TD,
  TH,
  THead,
  TR,
  Table,
  orderStatusTone,
} from "@/components/admin/ui";
import { formatPaise, formatPaiseExact } from "@/lib/money";
import { serverEnv } from "@/server/env";
import { getAdminOrderById } from "@/server/store/admin";

import { DeliveryQrActions } from "./delivery-qr";

function txnTone(status: string) {
  if (status === "captured") return "success" as const;
  if (status === "failed") return "danger" as const;
  if (status === "refunded") return "warning" as const;
  return "neutral" as const;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Junk ids (or anything that is not a UUID) can never match; refuse early
  // rather than letting Postgres reject the cast.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const verification = order.deliveryVerification;
  const verifyUrl = verification
    ? `${serverEnv.BETTER_AUTH_URL.replace(/\/+$/, "")}/verify/${verification.token}`
    : null;
  const qrDataUrl = verifyUrl
    ? await QRCode.toDataURL(verifyUrl, { width: 512, margin: 2, color: { dark: "#3d3229" } })
    : null;

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
        title={order.orderNumber}
        description={`Placed ${order.createdAt.toLocaleString("en-IN")} · ${order.userId ? "Account customer" : "Guest checkout"}`}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <div className="p-5">
            <h2 className="text-sm font-medium text-earth">Customer & delivery</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="text-earth/85">
                  {order.shippingName}
                  {order.user && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (account: {order.user.email})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Contact</dt>
                <dd className="text-earth/85">
                  {[order.contactEmail, order.contactPhone].filter(Boolean).join(" · ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Shipping address</dt>
                <dd className="text-earth/85">
                  {order.shippingLine1}
                  {order.shippingLine2 && <>, {order.shippingLine2}</>}
                  <br />
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                </dd>
              </div>
              {order.customerNote && (
                <div>
                  <dt className="text-xs text-muted-foreground">Customer note</dt>
                  <dd className="text-earth/85">{order.customerNote}</dd>
                </div>
              )}
            </dl>
          </div>
        </Panel>

        <Panel>
          <div className="p-5">
            <h2 className="text-sm font-medium text-earth">Order</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge tone={orderStatusTone(order.status)}>
                {order.status.replace(/_/g, " ")}
              </StatusBadge>
              <StatusBadge tone={order.paymentStatus === "paid" ? "success" : "warning"}>
                {order.paymentStatus}
              </StatusBadge>
              <StatusBadge tone="neutral">{order.paymentProvider}</StatusBadge>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span className="text-earth/85">
                    {item.productName} × {item.qty}
                  </span>
                  <span className="text-earth">{formatPaiseExact(item.lineTotalPaise)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-earth/10 pt-3 text-sm">
              <span className="text-muted-foreground">Total (shipping included)</span>
              <span className="font-medium text-earth">{formatPaise(order.totalPaise)}</span>
            </div>
            {order.paymentRef && (
              <p className="mt-2 text-xs text-muted-foreground">
                Payment reference: <span className="font-mono">{order.paymentRef}</span>
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel className="mt-5">
        <div className="p-5 pb-0">
          <h2 className="text-sm font-medium text-earth">Payment attempts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every attempt is kept, including failed ones — this is the first place to look when a
            customer says they paid.
          </p>
        </div>

        {order.transactions.length === 0 ? (
          <EmptyState
            title="No payment attempts"
            description={
              order.paymentProvider === "whatsapp"
                ? "This order is settled over WhatsApp, outside the gateway."
                : "The customer has not opened the payment window yet."
            }
          />
        ) : (
          <Table minWidth={900}>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Status</TH>
                <TH>Method</TH>
                <TH align="right">Amount</TH>
                <TH>Payment id</TH>
                <TH>Confirmed via</TH>
                <TH>Error</TH>
              </tr>
            </THead>
            <tbody>
              {order.transactions.map((txn) => (
                <TR key={txn.id}>
                  <TD className="text-xs text-muted-foreground">
                    {txn.createdAt.toLocaleString("en-IN")}
                  </TD>
                  <TD>
                    <StatusBadge tone={txnTone(txn.status)}>{txn.status}</StatusBadge>
                  </TD>
                  <TD className="text-earth/85">
                    {txn.method ?? "—"}
                    {txn.methodDetail && (
                      <span className="block text-xs text-muted-foreground">{txn.methodDetail}</span>
                    )}
                  </TD>
                  <TD align="right" className="text-earth">
                    {formatPaiseExact(txn.amountPaise)}
                  </TD>
                  <TD className="font-mono text-xs text-earth/75">
                    {txn.providerPaymentId ?? "—"}
                  </TD>
                  <TD className="text-xs text-muted-foreground">{txn.confirmedVia ?? "—"}</TD>
                  <TD className="text-xs text-red-800">
                    {txn.errorCode && <span className="font-mono">{txn.errorCode}</span>}
                    {txn.errorDescription && (
                      <span className="block text-muted-foreground">{txn.errorDescription}</span>
                    )}
                    {!txn.errorCode && !txn.errorDescription && "—"}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Panel className="mt-5">
        <div className="p-5">
          <h2 className="text-sm font-medium text-earth">Delivery verification</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Print the QR and paste it on the box. The customer scans it on arrival and confirms
            with an OTP sent to the order&apos;s phone — it works exactly once.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-5">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`Delivery verification QR for ${order.orderNumber}`}
                className="h-36 w-36 rounded-lg border border-earth/10 bg-white p-2"
              />
            )}

            <div className="space-y-3">
              {verification && (
                <StatusBadge tone={verification.verifiedAt ? "success" : "warning"}>
                  {verification.verifiedAt
                    ? `verified ${verification.verifiedAt.toLocaleString("en-IN")}`
                    : "awaiting scan"}
                </StatusBadge>
              )}
              <DeliveryQrActions
                orderId={order.id}
                orderNumber={order.orderNumber}
                qrDataUrl={qrDataUrl}
              />
              {verifyUrl && (
                <p className="max-w-md break-all text-[11px] text-muted-foreground">{verifyUrl}</p>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <p className="mt-5 text-xs text-muted-foreground">
        <Link href="/admin/orders" className="underline hover:text-earth">
          ← Back to all orders
        </Link>
      </p>
    </div>
  );
}
