import { Mail, MapPin, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";

export default async function ContactPage() {
  const [currentUser, setting] = await Promise.all([
    getCurrentUser(),
    prisma.siteSetting.findUnique({ where: { key: "contact" } }),
  ]);
  const user = currentUser ? { name: currentUser.name, role: currentUser.role.name } : null;
  const contact = setting?.value && typeof setting.value === "object" ? setting.value as Record<string, unknown> : {};
  const email = typeof contact.email === "string" ? contact.email : "hello@nexora.jo";
  const phone = typeof contact.phone === "string" && contact.phone ? contact.phone : "Available during business hours";
  const whatsapp = typeof contact.whatsapp === "string" && contact.whatsapp ? contact.whatsapp : phone;
  const address = typeof contact.address === "string" ? contact.address : "Amman, Jordan";
  return <main className="min-h-screen bg-[#fcfbf8]"><SiteHeader user={user}/><section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">Contact Nexora</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Let’s talk about your next month of content.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Tell us about your business, goals, and current challenges. We’ll help you find the right next step.</p><div className="mt-9 space-y-4">{[[Mail, "Email", email], [MessageCircle, "WhatsApp", whatsapp], [MapPin, "Location", address]].map(([Icon, label, value]) => <div key={String(label)} className="flex gap-4 rounded-2xl border bg-white p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-primary"><Icon size={20}/></div><div><p className="text-sm text-slate-500">{String(label)}</p><p className="font-bold">{String(value)}</p></div></div>)}</div></div><div className="rounded-3xl border bg-white p-6 shadow-xl shadow-blue-950/5 sm:p-8"><h2 className="text-xl font-bold">Send a message</h2><p className="mt-2 text-sm text-slate-500">All fields are stored securely in your Nexora workspace.</p><div className="mt-7"><ContactForm/></div></div></section><SiteFooter/></main>;
}
