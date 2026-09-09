import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [
  { label: "Dashboard", href: "/admin", icon: "gauge" },
  { label: "Customers", href: "/admin/customers", icon: "users" },
  { label: "Packages", href: "/admin/packages", icon: "package" },
  { label: "Services", href: "/admin/services", icon: "boxes" },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: "clipboard" },
  { label: "Orders", href: "/admin/orders", icon: "receipt" },
  { label: "Payments", href: "/admin/payments", icon: "billing" },
  { label: "Invoices", href: "/admin/invoices", icon: "file-text" },
  { label: "Coupons", href: "/admin/coupons", icon: "tags" },
  { label: "Content requests", href: "/admin/content-requests", icon: "file-box" },
  { label: "Testimonials", href: "/admin/testimonials", icon: "star" },
  { label: "FAQ", href: "/admin/faq", icon: "help" },
  { label: "Website CMS", href: "/admin/cms", icon: "layout" },
  { label: "Site settings", href: "/admin/settings", icon: "settings" },
  { label: "Notifications", href: "/admin/notifications", icon: "bell" },
  { label: "Contact messages", href: "/admin/messages", icon: "mail" },
  { label: "Users & roles", href: "/admin/users", icon: "shield" },
  { label: "Analytics", href: "/admin/analytics", icon: "activity" },
  { label: "Audit logs", href: "/admin/audit-logs", icon: "shield" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"]);
  return (
    <DashboardShell nav={nav} name={user.name} subtitle={user.role.name.replaceAll("_", " ")} admin>
      {children}
    </DashboardShell>
  );
}
