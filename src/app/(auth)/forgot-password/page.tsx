import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() { return <div className="w-full"><div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-primary"><Mail/></div><h1 className="text-3xl font-extrabold tracking-tight">Reset your password</h1><p className="mt-3 text-slate-600">Enter your account email. If it exists, we’ll send a secure reset link.</p><form className="mt-8 space-y-5"><div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required className="h-12 rounded-xl"/></div><Button className="h-12 w-full rounded-xl">Send reset link</Button></form><Link href="/login" className="mt-6 block text-center text-sm font-bold text-primary">Back to login</Link></div>; }
