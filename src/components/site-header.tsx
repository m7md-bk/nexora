"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  ["Services", "/services"], ["Pricing", "/pricing"], ["About", "/about"], ["FAQ", "/faq"], ["Contact", "/contact"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Nexora home">
          <Image src="/assets/nexora-logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" priority />
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Nexora</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className="text-sm font-medium text-slate-600 transition hover:text-primary">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" asChild><Link href="/ar" lang="ar">العربية</Link></Button>
          <Button variant="ghost" asChild><Link href="/login">Log in</Link></Button>
          <Button className="rounded-xl shadow-sm" asChild><Link href="/pricing">Start growing</Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && <nav className="border-t bg-background p-4 lg:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-7xl gap-1">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-medium hover:bg-secondary">{label}</Link>)}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-4">
            <Button variant="outline" asChild><Link href="/login">Log in</Link></Button>
            <Button asChild><Link href="/pricing">Get started</Link></Button>
          </div>
        </div>
      </nav>}
    </header>
  );
}
