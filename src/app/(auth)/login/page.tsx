import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() { return <div className="w-full"><p className="text-sm font-bold text-primary">WELCOME BACK</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Log in to Nexora</h1><p className="mt-3 text-slate-600">Manage your subscription, requests, and deliveries securely.</p><div className="mt-8"><AuthForm mode="login"/></div><p className="mt-6 text-center text-sm text-slate-600">New to Nexora? <Link href="/register" className="font-bold text-primary">Create an account</Link></p></div>; }
