import Link from "next/link";
import { Banknote, CircleCheck, Clock3, ShoppingBag, UserRoundPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [customers, subscriptions, orders, revenue, pendingPayments, requests] = await Promise.all([
    prisma.user.count({ where: { role: { name: "CUSTOMER" } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.contentRequest.count({ where: { status: "PENDING" } }),
  ]);
  const cards = [
    ["Customers", customers, Users],
    ["Active subscriptions", subscriptions, CircleCheck],
    ["Orders", orders, ShoppingBag],
    ["Revenue", `${Number(revenue._sum.amount ?? 0).toFixed(2)} JOD`, Banknote],
    ["Pending payments", pendingPayments, Clock3],
    ["Pending requests", requests, UserRoundPlus],
  ] as const;
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary">BUSINESS OVERVIEW</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">Dashboard</h1><p className="mt-2 text-slate-500">Live operational data from your Nexora workspace.</p></div>
        <Button className="rounded-xl" asChild><Link href="/admin/cms">Edit website</Link></Button>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, Icon]) => <Card key={label} className="rounded-2xl border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-blue-50 p-3 text-primary"><Icon size={20}/></div><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-slate-950">{value}</p></div></CardContent></Card>)}</div>
    </div>
  );
}
