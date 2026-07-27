import { FilterSelect, ResetFilters, SearchField } from "@/components/admin/filters";
import { RowMenu } from "@/components/admin/RowMenu";
import {
  EmptyState,
  IdentityCell,
  PageHeader,
  Panel,
  StatusBadge,
  TD,
  TH,
  THead,
  TR,
  Table,
  Toolbar,
  orderStatusTone,
} from "@/components/admin/ui";
import { formatPaise } from "@/lib/money";
import { getAdminOrders } from "@/server/store/admin";

import { OrderControls } from "./order-controls";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "crafting",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const query = (single("q") ?? "").trim().toLowerCase();
  const status = single("status");
  const payment = single("payment");

  const all = await getAdminOrders();

  // Filtered in memory: the orders table is empty today and this keeps the
  // query simple. Move to SQL predicates once volume makes a full scan costly.
  const orders = all.filter((order) => {
    if (status && order.status !== status) return false;
    if (payment && order.paymentStatus !== payment) return false;
    if (!query) return true;
    return [order.orderNumber, order.shippingName, order.contactEmail, order.contactPhone]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query));
  });

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}
        title="Orders"
        description="Status changes are recorded in an append-only event log, which is what drives the customer-facing tracking timeline."
      />

      <Panel className="mt-5">
        <Toolbar>
          <SearchField name="q" placeholder="Order number, name, email or phone" label="Search orders" />
          <FilterSelect
            name="status"
            label="Status"
            options={ORDER_STATUSES.map((value) => ({
              value,
              label: value.replace(/_/g, " "),
            }))}
          />
          <FilterSelect
            name="payment"
            label="Payment"
            options={["unpaid", "paid", "failed", "refunded"].map((value) => ({
              value,
              label: value,
            }))}
          />
          <ResetFilters keys={["q", "status", "payment"]} />
          <span className="ml-auto text-xs text-muted-foreground">
            {orders.length} of {all.length}
          </span>
        </Toolbar>

        {orders.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "No orders yet" : "No orders match"}
            description={
              all.length === 0
                ? "Checkout is not wired up yet — this table fills once it is. The schema, tracking timeline and mock payment states are already in place."
                : "Try clearing the filters."
            }
          />
        ) : (
          <Table minWidth={980}>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH align="right">Items</TH>
                <TH align="right">Total</TH>
                <TH>Placed</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {orders.map((order) => (
                <TR key={order.id}>
                  <TD>
                    <IdentityCell
                      title={order.orderNumber}
                      subtitle={order.userId ? "Account" : "Guest"}
                    />
                  </TD>
                  <TD>
                    <span className="block text-earth/85">{order.shippingName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {order.contactEmail ?? order.contactPhone} · {order.shippingCity}
                    </span>
                  </TD>
                  <TD align="right" className="text-earth/75">
                    {order.itemCount}
                  </TD>
                  <TD align="right" className="text-earth">
                    {formatPaise(order.totalPaise)}
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-IN")}
                  </TD>
                  <TD>
                    <div className="flex flex-col items-start gap-2">
                      <StatusBadge tone={orderStatusTone(order.status)}>
                        {order.status.replace(/_/g, " ")}
                      </StatusBadge>
                      <OrderControls
                        orderId={order.id}
                        status={order.status}
                        paymentStatus={order.paymentStatus}
                      />
                    </div>
                  </TD>
                  <TD align="right">
                    <RowMenu
                      label={`Actions for ${order.orderNumber}`}
                      items={[
                        {
                          label: "Email customer",
                          href: order.contactEmail ? `mailto:${order.contactEmail}` : undefined,
                          disabled: !order.contactEmail,
                        },
                      ]}
                    />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
