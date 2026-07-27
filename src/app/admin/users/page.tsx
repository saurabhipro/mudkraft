import { FilterSelect, ResetFilters, SearchField } from "@/components/admin/filters";
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
} from "@/components/admin/ui";
import { getSession } from "@/server/auth-guard";
import { getAdminUsers } from "@/server/store/admin";

import { UserControls } from "./user-controls";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const role = single("role");
  const query = (single("q") ?? "").trim().toLowerCase();

  const [all, session] = await Promise.all([getAdminUsers(), getSession()]);

  const users = all.filter((user) => {
    if (role && user.role !== role) return false;
    if (!query) return true;
    return [user.name, user.email].some((field) => field.toLowerCase().includes(query));
  });

  const adminCount = all.filter((u) => u.role === "admin").length;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Accounts" }]}
        title="Accounts"
        description="Admins can promote other admins. You cannot remove your own access, and the last remaining admin cannot be demoted — both would lock the studio out of this panel."
      />

      <Panel className="mt-5">
        <Toolbar>
          <SearchField name="q" placeholder="Name or email" label="Search accounts" />
          <FilterSelect
            name="role"
            label="Role"
            options={[
              { value: "admin", label: "Admin" },
              { value: "customer", label: "Customer" },
            ]}
          />
          <ResetFilters keys={["q", "role"]} />
          <span className="ml-auto text-xs text-muted-foreground">
            {users.length} of {all.length} · {adminCount} admin{adminCount === 1 ? "" : "s"}
          </span>
        </Toolbar>

        {users.length === 0 ? (
          <EmptyState title="No accounts match" description="Try clearing the filters." />
        ) : (
          <Table minWidth={820}>
            <THead>
              <tr>
                <TH>Account</TH>
                <TH>Role</TH>
                <TH>Joined</TH>
                <TH align="right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {users.map((user) => (
                <TR key={user.id}>
                  <TD>
                    <IdentityCell
                      title={
                        <span className="flex items-center gap-2">
                          {user.name}
                          {user.banned && <StatusBadge tone="danger">banned</StatusBadge>}
                        </span>
                      }
                      subtitle={
                        <>
                          {user.email}
                          {!user.emailVerified && " · unverified"}
                        </>
                      }
                    />
                  </TD>
                  <TD>
                    <StatusBadge tone={user.role === "admin" ? "solid" : "neutral"}>
                      {user.role}
                    </StatusBadge>
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {user.createdAt.toLocaleDateString("en-IN")}
                  </TD>
                  <TD align="right">
                    <UserControls
                      userId={user.id}
                      role={user.role}
                      banned={user.banned}
                      isSelf={user.id === session?.user.id}
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
