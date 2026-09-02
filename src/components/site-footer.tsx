import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin } from "lucide-react";

export function SiteFooter() {
  return <footer className="border-t bg-slate-950 text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center gap-3"><Image src="/assets/nexora-logo.png" alt="" width={42} height={42} className="rounded-xl" /><span className="text-xl font-bold text-white">Nexora</span></div>
        <p className="max-w-sm text-sm leading-6 text-slate-400">AI-powered content and practical digital marketing that helps Jordanian businesses show up consistently and grow confidently.</p>
        <div className="mt-5 flex gap-3"><a className="rounded-full border border-slate-700 p-2 hover:border-blue-400 hover:text-white" href="#" aria-label="Instagram"><Instagram size={17}/></a><a className="rounded-full border border-slate-700 p-2 hover:border-blue-400 hover:text-white" href="#" aria-label="LinkedIn"><Linkedin size={17}/></a></div>
      </div>
      <div><h2 className="mb-4 font-semibold text-white">Company</h2><div className="grid gap-3 text-sm"><Link href="/about">About</Link><Link href="/services">Services</Link><Link href="/pricing">Pricing</Link><Link href="/faq">FAQ</Link></div></div>
      <div><h2 className="mb-4 font-semibold text-white">Get in touch</h2><div className="grid gap-3 text-sm"><span className="flex gap-2"><MapPin size={17}/> Amman, Jordan</span><a className="flex gap-2" href="mailto:hello@nexora.jo"><Mail size={17}/> hello@nexora.jo</a><Link href="/contact">Contact support</Link></div></div>
    </div>
    <div className="border-t border-slate-800"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Nexora. All rights reserved.</p><div className="flex gap-5"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/refund-policy">Refund policy</Link></div></div></div>
  </footer>;
}
