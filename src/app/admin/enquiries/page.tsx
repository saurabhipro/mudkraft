import { SearchField } from "@/components/admin/filters";
import { RowMenu } from "@/components/admin/RowMenu";
import { Tabs } from "@/components/admin/Tabs";
import { EmptyState, PageHeader, Panel, Toolbar } from "@/components/admin/ui";
import { getAdminEnquiries } from "@/server/store/admin";

import { EnquiryStatusSelect } from "./enquiry-status-select";

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const status = single("status");
  const query = (single("q") ?? "").trim().toLowerCase();

  const all = await getAdminEnquiries();
  const enquiries = all.filter((enquiry) => {
    if (status && enquiry.status !== status) return false;
    if (!query) return true;
    return [enquiry.name, enquiry.email, enquiry.phone, enquiry.message]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query));
  });

  const countOf = (value: string) => all.filter((e) => e.status === value).length;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Enquiries" }]}
        title="Workshop enquiries"
        description="Booking requests from the workshops page."
      />

      <Tabs
        param="status"
        ariaLabel="Enquiry status"
        items={[
          { value: "", label: "All", icon: "all", count: all.length },
          { value: "new", label: "New", icon: "inbox", count: countOf("new") },
          { value: "contacted", label: "Contacted", icon: "phone", count: countOf("contacted") },
          { value: "booked", label: "Booked", icon: "calendar", count: countOf("booked") },
        ]}
      />

      <Panel className="mt-5">
        <Toolbar>
          <SearchField name="q" placeholder="Name, email, phone or message" label="Search enquiries" />
          <span className="ml-auto text-xs text-muted-foreground">
            {enquiries.length} of {all.length}
          </span>
        </Toolbar>

        {enquiries.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "No enquiries yet" : "No enquiries match"}
            description={
              all.length === 0
                ? "The workshops form still opens WhatsApp rather than saving here — that wiring is still to come."
                : "Try clearing the search or switching tabs."
            }
          />
        ) : (
          <ul className="divide-y divide-earth/8">
            {enquiries.map((enquiry) => (
              <li key={enquiry.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs tracking-wider uppercase text-clay">
                      {enquiry.type.replace(/_/g, " ")}
                      {enquiry.preferredDate ? ` · ${enquiry.preferredDate}` : ""}
                      {enquiry.guests ? ` · ${enquiry.guests}` : ""}
                    </div>
                    <h2 className="mt-1 font-display text-xl text-earth">{enquiry.name}</h2>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[enquiry.phone, enquiry.email].filter(Boolean).join(" · ")} ·{" "}
                      {enquiry.createdAt.toLocaleDateString("en-IN")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <EnquiryStatusSelect enquiryId={enquiry.id} status={enquiry.status} />
                    <RowMenu
                      label={`Actions for ${enquiry.name}`}
                      items={[
                        {
                          label: "Email",
                          href: enquiry.email ? `mailto:${enquiry.email}` : undefined,
                          disabled: !enquiry.email,
                        },
                        {
                          label: "WhatsApp",
                          href: enquiry.phone
                            ? `https://wa.me/${enquiry.phone.replace(/\D/g, "")}`
                            : undefined,
                          disabled: !enquiry.phone,
                        },
                      ]}
                    />
                  </div>
                </div>

                {enquiry.message && (
                  <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                    {enquiry.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
