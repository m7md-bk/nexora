import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { createPackageOrder } from "@/server/orders";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function choosePackage(formData: FormData) {
  "use server";
  const user = await requireUser();
  const packageId = String(formData.get("packageId") ?? "");
  if (!packageId) throw new Error("Package is required");
  await createPackageOrder(user.id, packageId);
  redirect("/dashboard/orders");
}

export default async function PricingPage() {
  const [plans, currentUser] = await Promise.all([
    prisma.package.findMany({ where: { status: "ACTIVE" }, include: { features: { orderBy: { displayOrder: "asc" } } }, orderBy: { displayOrder: "asc" } }),
    getCurrentUser(),
  ]);
  return <main className="min-h-screen bg-[#fcfbf8]"><SiteHeader user={currentUser ? { name: currentUser.name, role: currentUser.role.name } : null}/><section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">Pricing</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">A package for every stage of growth.</h1><p className="mt-5 text-lg text-slate-600">Transparent subscription plans managed directly by the Nexora team.</p></div>{plans.length ? <div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map(plan => <article key={plan.id} className={`relative rounded-3xl border bg-white p-7 shadow-sm ${plan.isPopular ? "border-blue-500 ring-4 ring-blue-100" : ""}`}>{plan.isPopular && <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Most popular</span>}<h2 className="text-xl font-bold">{plan.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p><div className="mt-6"><span className="text-4xl font-extrabold">{Number(plan.price).toFixed(0)}</span><span className="text-sm text-slate-500"> {plan.currency} / {plan.billingInterval.toLowerCase()}</span></div>{currentUser ? <form action={choosePackage}><input type="hidden" name="packageId" value={plan.id}/><Button className="mt-6 w-full rounded-xl" variant={plan.isPopular ? "default" : "outline"} type="submit">Continue with this package</Button></form> : <Button className="mt-6 w-full rounded-xl" variant={plan.isPopular ? "default" : "outline"} asChild><Link href={`/register?package=${plan.slug}`}>{plan.ctaText}</Link></Button>}<ul className="mt-6 space-y-3">{plan.features.map(feature => <li key={feature.id} className="flex gap-2 text-sm"><Check className="text-emerald-600" size={18}/>{feature.name}</li>)}</ul></article>)}</div> : <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-dashed bg-white p-12 text-center"><h2 className="font-bold">No packages available</h2><p className="mt-2 text-sm text-slate-500">New subscription options are being prepared. Please contact us for a tailored plan.</p><Button className="mt-5 rounded-xl" asChild><Link href="/contact">Contact Nexora</Link></Button></div>}</section><SiteFooter/></main>;
}
