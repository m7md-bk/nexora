import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, CalendarCheck, Check, MessageSquareText, PenTool, Send, Sparkles, Store, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const services = [
  { icon: PenTool, title: "Social content", text: "On-brand posts, captions, and campaign concepts shaped around your business." },
  { icon: CalendarCheck, title: "Content planning", text: "A consistent monthly plan that keeps your channels useful, timely, and active." },
  { icon: BarChart3, title: "Growth support", text: "Practical recommendations grounded in your goals and real channel performance." },
];
const plans = [
  { name: "Launch", price: "149", description: "For small businesses building a consistent presence.", features: ["12 social posts", "Arabic & English captions", "Monthly content calendar", "1 revision round"] },
  { name: "Growth", price: "279", description: "For growing brands that need more momentum.", popular: true, features: ["20 social posts", "4 short-form video concepts", "Bilingual captions", "Priority delivery", "2 revision rounds"] },
  { name: "Scale", price: "449", description: "A high-output content engine for ambitious teams.", features: ["30 social posts", "8 video concepts", "Campaign planning", "Dedicated strategist", "Performance review"] },
];
const faqs = [
  ["What happens after I subscribe?", "You complete a short brand profile and submit your first content request. Our team reviews it, confirms the scope, and keeps every update visible in your dashboard."],
  ["Can Nexora create Arabic and English content?", "Yes. Plans can include Arabic, English, or bilingual content, with tone and terminology tailored to your audience."],
  ["How do manual payments work?", "Choose a package, create your order, then upload secure payment proof. Your subscription activates only after an administrator verifies the payment."],
  ["Can I change my package later?", "Yes. You can request an upgrade, downgrade, renewal, pause, or cancellation from your subscription dashboard."],
];

async function getPublicContent() {
  const [hero, servicesFromDb, packagesFromDb, faqsFromDb] = await Promise.all([
    prisma.heroSection.findFirst({ where: { status: "ACTIVE" }, orderBy: { updatedAt: "desc" } }),
    prisma.service.findMany({ where: { status: "ACTIVE" }, orderBy: { displayOrder: "asc" } }),
    prisma.package.findMany({ where: { status: "ACTIVE" }, include: { features: { orderBy: { displayOrder: "asc" } } }, orderBy: { displayOrder: "asc" } }),
    prisma.fAQ.findMany({ where: { status: "ACTIVE" }, orderBy: { displayOrder: "asc" } }),
  ]);
  const icons = [PenTool, CalendarCheck, BarChart3];
  return {
    hero: hero ? { title: hero.titleEn, subtitle: hero.subtitleEn, ctaText: hero.ctaTextEn, ctaUrl: hero.ctaUrl } : null,
    services: servicesFromDb.length ? servicesFromDb.map((item, index) => ({ icon: icons[index % icons.length], title: item.name, text: item.description })) : services,
    plans: packagesFromDb.length ? packagesFromDb.map(item => ({ name: item.name, price: String(item.price), description: item.description, popular: item.isPopular, features: item.features.map(feature => feature.name) })) : plans,
    faqs: faqsFromDb.length ? faqsFromDb.map(item => [item.questionEn, item.answerEn] as [string, string]) : faqs,
  };
}

export default async function Home() {
  const currentUser = await getCurrentUser();
  const user = currentUser ? { name: currentUser.name, role: currentUser.role.name } : null;
  const content = await getPublicContent();
  const services = content.services;
  const plans = content.plans;
  const faqs = content.faqs;
  return <main className="min-h-screen overflow-hidden bg-[#fcfbf8]">
    <SiteHeader user={user} />
    <section className="relative border-b">
      <div className="surface-grid absolute inset-0 opacity-40" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700"><Sparkles size={15}/> Built for businesses in Jordan</div>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-[-.04em] text-slate-950 sm:text-6xl">{content.hero?.title ?? "Great content, without building a whole content team."}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{content.hero?.subtitle ?? "Nexora blends AI speed with human strategy to plan, create, and deliver social content your local business can proudly publish."}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" className="h-12 rounded-xl px-6" asChild><Link href={content.hero?.ctaUrl ?? "/pricing"}>{content.hero?.ctaText ?? "Explore packages"} <ArrowRight className="ml-2" size={18}/></Link></Button><Button size="lg" variant="outline" className="h-12 rounded-xl bg-white px-6" asChild><Link href="/contact">Talk to our team</Link></Button></div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"><span className="flex items-center gap-2"><BadgeCheck className="text-emerald-600" size={17}/> No long-term contract</span><span className="flex items-center gap-2"><BadgeCheck className="text-emerald-600" size={17}/> Human-reviewed delivery</span></div>
        </div>
        <div className="relative"><div className="absolute -inset-3 rounded-[2.25rem] bg-blue-100/60"/><Image src="/assets/hero-content-workspace.png" alt="Nexora content planning workspace for local businesses" width={900} height={720} className="relative w-full rounded-[2rem] border bg-white object-cover shadow-2xl shadow-blue-950/10" priority /></div>
      </div>
    </section>

    <section className="border-b bg-white"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-7 text-center sm:px-6 md:flex-row lg:px-8"><p className="font-semibold text-slate-800">One flexible content partner for every local business</p><div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-slate-500">{["Restaurants", "Cafés", "Salons", "Retail", "Online stores"].map(x=><span key={x} className="rounded-full bg-slate-100 px-4 py-2">{x}</span>)}</div></div></section>

    <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">What we do</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your content operation, simplified.</h2><p className="mt-4 text-lg text-slate-600">From the next post idea to a ready-to-publish delivery, every step stays clear.</p></div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">{content.services.map(({icon:Icon,title,text})=><article key={title} className="group rounded-3xl border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-primary"><Icon/></div><h3 className="text-xl font-bold text-slate-900">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p><Link href="/services" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Learn more <ArrowRight size={16}/></Link></article>)}</div>
    </section>

    <section className="bg-slate-950 py-20 text-white"><div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><Image src="/assets/how-it-works.png" alt="Three-step Nexora content process" width={900} height={506} className="rounded-3xl border border-slate-700"/><div><p className="text-sm font-bold uppercase tracking-[.18em] text-blue-400">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From brief to publish-ready in three clear steps.</h2><div className="mt-8 space-y-6">{[[Store,"Choose your package","Pick the capacity and services that fit your current goals."],[MessageSquareText,"Send your brief","Share the platform, audience, tone, references, and secure attachments."],[Send,"Review and receive","Track progress, respond to updates, and access every delivery in one place."]].map(([Icon,title,text],i)=><div key={String(title)} className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 font-bold">{i+1}</div><div><h3 className="font-bold">{String(title)}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{String(text)}</p></div></div>)}</div></div></div></section>

    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">Simple packages</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Choose your content rhythm.</h2><p className="mt-4 text-slate-600">Prices shown are monthly in JOD. Final package data is managed from the Nexora admin CMS.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map(plan=><article key={plan.name} className={`relative rounded-3xl border bg-white p-7 shadow-sm ${plan.popular ? "border-blue-500 ring-4 ring-blue-100" : ""}`}>{plan.popular&&<span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Most popular</span>}<h3 className="text-xl font-bold">{plan.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p><div className="mt-6 flex items-end gap-1"><span className="text-4xl font-extrabold">{plan.price}</span><span className="pb-1 text-sm text-slate-500">JOD / month</span></div><Button className="mt-6 w-full rounded-xl" variant={plan.popular?"default":"outline"} asChild><Link href="/register">Choose {plan.name}</Link></Button><ul className="mt-6 space-y-3">{plan.features.map(f=><li key={f} className="flex gap-2 text-sm text-slate-700"><Check className="text-emerald-600" size={18}/>{f}</li>)}</ul></article>)}</div></section>

    <section className="border-y bg-blue-50/60 py-20"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">Built for dependable delivery</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Every request stays organized.</h2><p className="mt-4 max-w-xl leading-7 text-slate-600">Secure files, visible statuses, bilingual briefs, payment verification, and a complete delivery history—without chasing updates across chat threads.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Secure request attachments","Clear revision history","Real-time notifications","Invoices and payment records"].map(x=><div key={x} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-semibold shadow-sm"><Zap className="text-primary" size={18}/>{x}</div>)}</div></div><div className="rounded-3xl border bg-white p-7 shadow-xl shadow-blue-950/5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Content request</p><h3 className="mt-1 font-bold">Ramadan campaign launch</h3></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">In progress</span></div><div className="mt-8 space-y-5">{["Brief received","Strategist review","Content production","Customer approval"].map((x,i)=><div key={x} className="flex items-center gap-3"><div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i<2?"bg-blue-600 text-white":"bg-slate-100 text-slate-500"}`}>{i<2?<Check size={15}/>:i+1}</div><span className={i<2?"font-semibold":"text-slate-500"}>{x}</span></div>)}</div></div></div></section>

    <section id="faq" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">Questions, answered</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Know what to expect.</h2><p className="mt-4 text-slate-600">Need something more specific? Our team is ready to help.</p><Button className="mt-6 rounded-xl" variant="outline" asChild><Link href="/contact">Contact us</Link></Button></div><Accordion type="single" collapsible className="rounded-3xl border bg-white px-6">{faqs.map(([q,a],i)=><AccordionItem key={q} value={`q-${i}`}><AccordionTrigger className="text-left font-bold">{q}</AccordionTrigger><AccordionContent className="leading-7 text-slate-600">{a}</AccordionContent></AccordionItem>)}</Accordion></section>

    <section className="px-4 pb-20 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-blue-600 p-8 text-white shadow-2xl shadow-blue-600/20 sm:p-12 lg:flex-row lg:items-center"><div><h2 className="text-3xl font-bold tracking-tight">Ready for content that keeps up?</h2><p className="mt-3 max-w-xl text-blue-100">Choose a package, share your goals, and let Nexora turn your next month of content into a clear plan.</p></div><Button size="lg" variant="secondary" className="rounded-xl bg-white text-blue-700 hover:bg-blue-50" asChild><Link href="/register">Create your account <ArrowRight className="ml-2" size={18}/></Link></Button></div></section>
    <SiteFooter />
  </main>;
}
