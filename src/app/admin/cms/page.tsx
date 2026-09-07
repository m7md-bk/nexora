import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

const heroSchema = z.object({
  titleEn: z.string().min(3).max(180), titleAr: z.string().min(3).max(180),
  subtitleEn: z.string().min(3).max(500), subtitleAr: z.string().min(3).max(500),
  ctaTextEn: z.string().min(2).max(80), ctaTextAr: z.string().min(2).max(80),
  ctaUrl: z.string().startsWith("/"), imageUrl: z.string().startsWith("/").optional().or(z.literal("")),
});

async function saveHero(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const data = heroSchema.parse(Object.fromEntries(formData));
  const current = await prisma.heroSection.findFirst({ orderBy: { updatedAt: "desc" } });
  if (current) await prisma.heroSection.update({ where: { id: current.id }, data });
  else await prisma.heroSection.create({ data });
  revalidatePath("/"); revalidatePath("/admin/cms");
}

async function saveSetting(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!key || !value) throw new Error("Setting key and value are required");
  await prisma.siteSetting.upsert({ where: { key }, update: { value: { text: value }, isPublic: true }, create: { key, value: { text: value }, isPublic: true } });
  revalidatePath("/"); revalidatePath("/admin/cms");
}

async function saveContact(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const data = z.object({ email: z.string().email(), phone: z.string().max(40), whatsapp: z.string().max(40), address: z.string().min(2).max(160) }).parse(Object.fromEntries(formData));
  await prisma.siteSetting.upsert({ where: { key: "contact" }, update: { value: data, isPublic: true }, create: { key: "contact", value: data, isPublic: true } });
  revalidatePath("/"); revalidatePath("/contact"); revalidatePath("/admin/cms");
}

async function savePackage(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  const data = z.object({ name: z.string().min(2), description: z.string().min(5), price: z.coerce.number().positive(), isPopular: z.string().optional() }).parse(Object.fromEntries(formData));
  await prisma.package.update({ where: { id }, data: { name: data.name, description: data.description, price: data.price, isPopular: data.isPopular === "on" } });
  revalidatePath("/"); revalidatePath("/admin/cms");
}

async function saveService(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  const data = z.object({ name: z.string().min(2), description: z.string().min(5), category: z.string().min(2) }).parse(Object.fromEntries(formData));
  await prisma.service.update({ where: { id }, data });
  revalidatePath("/"); revalidatePath("/admin/cms");
}

async function saveFaq(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  const data = z.object({ questionEn: z.string().min(3), answerEn: z.string().min(3), questionAr: z.string().min(3), answerAr: z.string().min(3) }).parse(Object.fromEntries(formData));
  await prisma.fAQ.update({ where: { id }, data });
  revalidatePath("/"); revalidatePath("/admin/cms");
}

async function createPackage(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const data = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/), description: z.string().min(5), price: z.coerce.number().positive() }).parse(Object.fromEntries(formData));
  await prisma.package.create({ data: { ...data, currency: "JOD", billingInterval: "MONTHLY", ctaText: "Get started" } });
  revalidatePath("/"); revalidatePath("/pricing"); revalidatePath("/admin/cms");
}

async function createService(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const data = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/), description: z.string().min(5), category: z.string().min(2) }).parse(Object.fromEntries(formData));
  await prisma.service.create({ data });
  revalidatePath("/"); revalidatePath("/services"); revalidatePath("/admin/cms");
}

async function createFaq(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const data = z.object({ questionEn: z.string().min(3), answerEn: z.string().min(3), questionAr: z.string().min(3), answerAr: z.string().min(3) }).parse(Object.fromEntries(formData));
  await prisma.fAQ.create({ data });
  revalidatePath("/"); revalidatePath("/faq"); revalidatePath("/admin/cms");
}

async function deleteRecord(formData: FormData) {
  "use server";
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const type = String(formData.get("type"));
  const id = String(formData.get("id"));
  if (type === "package") await prisma.package.delete({ where: { id } });
  if (type === "service") await prisma.service.delete({ where: { id } });
  if (type === "faq") await prisma.fAQ.delete({ where: { id } });
  revalidatePath("/"); revalidatePath("/pricing"); revalidatePath("/services"); revalidatePath("/faq"); revalidatePath("/admin/cms");
}

export default async function CmsPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"]);
  const [hero, settings, packages, services, faqs] = await Promise.all([
    prisma.heroSection.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.siteSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.package.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.service.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.fAQ.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);
  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="text-sm font-bold uppercase tracking-wide text-primary">Website CMS</p><h1 className="mt-1 text-3xl font-extrabold">Edit the public website</h1><p className="mt-2 text-slate-500">Changes are saved to Supabase and reflected on the public website.</p></div>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Hero section</CardTitle></CardHeader><CardContent><form action={saveHero} className="grid gap-4 md:grid-cols-2"><Field name="titleEn" label="English title" defaultValue={hero?.titleEn ?? ""}/><Field name="titleAr" label="Arabic title" defaultValue={hero?.titleAr ?? ""}/><TextField name="subtitleEn" label="English subtitle" defaultValue={hero?.subtitleEn ?? ""}/><TextField name="subtitleAr" label="Arabic subtitle" defaultValue={hero?.subtitleAr ?? ""}/><Field name="ctaTextEn" label="English button" defaultValue={hero?.ctaTextEn ?? ""}/><Field name="ctaTextAr" label="Arabic button" defaultValue={hero?.ctaTextAr ?? ""}/><Field name="ctaUrl" label="Button URL" defaultValue={hero?.ctaUrl ?? "/pricing"}/><Field name="imageUrl" label="Image path" defaultValue={hero?.imageUrl ?? "/assets/hero-content-workspace.png"}/><div className="md:col-span-2"><Button className="rounded-xl">Save hero section</Button></div></form></CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Public settings</CardTitle></CardHeader><CardContent><form action={saveSetting} className="grid gap-4 md:grid-cols-[1fr_2fr_auto]"><Field name="key" label="Key" placeholder="announcement"/><Field name="value" label="Value" placeholder="Your announcement"/><div className="flex items-end"><Button variant="outline" className="rounded-xl">Save setting</Button></div></form>{settings.length > 0 && <div className="mt-6 divide-y rounded-xl border">{settings.map(setting => <div key={setting.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="font-semibold">{setting.key}</span><span className="truncate text-slate-500">{JSON.stringify(setting.value)}</span></div>)}</div>}</CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Contact information</CardTitle></CardHeader><CardContent><form action={saveContact} className="grid gap-4 md:grid-cols-2"><Field name="email" label="Email" type="email" defaultValue={contactValue(settings, "email", "hello@nexora.jo")}/><Field name="phone" label="Phone" defaultValue={contactValue(settings, "phone", "")}/><Field name="whatsapp" label="WhatsApp" defaultValue={contactValue(settings, "whatsapp", "")}/><Field name="address" label="Address" defaultValue={contactValue(settings, "address", "Amman, Jordan")}/><div className="md:col-span-2"><Button className="rounded-xl">Save contact information</Button></div></form></CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Edit packages</CardTitle></CardHeader><CardContent className="space-y-4">{packages.map(plan => <form key={plan.id} action={savePackage} className="grid gap-3 rounded-xl border p-4 md:grid-cols-4"><input type="hidden" name="id" value={plan.id}/><Field name="name" label="Name" defaultValue={plan.name}/><Field name="description" label="Description" defaultValue={plan.description}/><Field name="price" label="Price" type="number" step="0.001" defaultValue={String(plan.price)}/><div className="flex items-end gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPopular" defaultChecked={plan.isPopular}/> Popular</label><Button className="rounded-xl">Save</Button></div></form>)}</CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Add package</CardTitle></CardHeader><CardContent><form action={createPackage} className="grid gap-4 md:grid-cols-4"><Field name="name" label="Name"/><Field name="slug" label="Slug"/><Field name="description" label="Description"/><Field name="price" label="Price" type="number" step="0.001"/><div className="md:col-span-4"><Button className="rounded-xl">Add package</Button></div></form></CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Edit services</CardTitle></CardHeader><CardContent className="space-y-4">{services.map(service => <form key={service.id} action={saveService} className="grid gap-3 rounded-xl border p-4 md:grid-cols-4"><input type="hidden" name="id" value={service.id}/><Field name="name" label="Name" defaultValue={service.name}/><Field name="category" label="Category" defaultValue={service.category}/><TextField name="description" label="Description" defaultValue={service.description}/><div className="flex items-end"><Button className="rounded-xl">Save</Button></div></form>)}</CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Add service</CardTitle></CardHeader><CardContent><form action={createService} className="grid gap-4 md:grid-cols-4"><Field name="name" label="Name"/><Field name="slug" label="Slug"/><Field name="category" label="Category"/><TextField name="description" label="Description"/><div className="md:col-span-4"><Button className="rounded-xl">Add service</Button></div></form></CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Edit FAQ</CardTitle></CardHeader><CardContent className="space-y-4">{faqs.map(faq => <form key={faq.id} action={saveFaq} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2"><input type="hidden" name="id" value={faq.id}/><Field name="questionEn" label="Question (English)" defaultValue={faq.questionEn}/><Field name="questionAr" label="Question (Arabic)" defaultValue={faq.questionAr}/><TextField name="answerEn" label="Answer (English)" defaultValue={faq.answerEn}/><TextField name="answerAr" label="Answer (Arabic)" defaultValue={faq.answerAr}/><div><Button className="rounded-xl">Save FAQ</Button></div></form>)}</CardContent></Card>
    <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>Add FAQ</CardTitle></CardHeader><CardContent><form action={createFaq} className="grid gap-4 md:grid-cols-2"><Field name="questionEn" label="Question (English)"/><Field name="questionAr" label="Question (Arabic)"/><TextField name="answerEn" label="Answer (English)"/><TextField name="answerAr" label="Answer (Arabic)"/><div className="md:col-span-2"><Button className="rounded-xl">Add FAQ</Button></div></form></CardContent></Card>
  </div>;
}

function Field({ name, label, ...props }: { name: string; label: string } & React.ComponentProps<typeof Input>) { return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} required className="mt-2 rounded-xl" {...props}/></div>; }
function TextField({ name, label, ...props }: { name: string; label: string } & React.ComponentProps<typeof Textarea>) { return <div><Label htmlFor={name}>{label}</Label><Textarea id={name} name={name} required className="mt-2 min-h-28 rounded-xl" {...props}/></div>; }
function contactValue(settings: Array<{ key: string; value: unknown }>, key: string, fallback: string) { const setting = settings.find(item => item.key === "contact"); const value = setting?.value; return value && typeof value === "object" && key in value && typeof value[key as keyof typeof value] === "string" ? value[key as keyof typeof value] as string : fallback; }
