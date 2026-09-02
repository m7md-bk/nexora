import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen bg-[#fcfbf8] lg:grid-cols-2">
    <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
      <Link href="/" className="flex w-fit items-center gap-2.5"><Image src="/assets/nexora-logo.png" alt="" width={42} height={42} className="rounded-xl"/><span className="text-xl font-extrabold">Nexora</span></Link>
      <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">{children}</div>
    </section>
    <aside className="relative hidden overflow-hidden bg-blue-700 lg:block"><Image src="/assets/auth-pattern.png" alt="" fill className="object-cover opacity-80"/><div className="absolute inset-0 bg-blue-950/25"/><blockquote className="absolute bottom-14 left-14 right-14 rounded-3xl border border-white/20 bg-slate-950/75 p-8 text-white backdrop-blur"><p className="text-2xl font-bold leading-snug">“Consistency is no longer the hard part. Your next month of content can start with one clear brief.”</p><footer className="mt-4 text-sm text-blue-100">The Nexora content team · Amman</footer></blockquote></aside>
  </main>;
}
