"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { submitContact, type ContactState } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function ContactForm(){const[state,action,pending]=useActionState(submitContact,{} as ContactState);if(state.success)return <div className="rounded-2xl bg-emerald-50 p-8 text-center"><h2 className="font-bold text-emerald-900">Message received</h2><p className="mt-2 text-sm text-emerald-700">The Nexora team will get back to you soon.</p></div>;return <form action={action} className="space-y-5"><Field name="name" label="Name"/><Field name="email" label="Email" type="email"/><Field name="phone" label="Phone (optional)" required={false}/><div><Label htmlFor="message">How can we help?</Label><Textarea id="message" name="message" required minLength={10} className="mt-2 min-h-36 rounded-xl"/></div>{state.error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}<Button className="h-12 w-full rounded-xl" disabled={pending}>{pending?<Loader2 className="animate-spin"/>:"Send message"}</Button></form>}
function Field({name,label,required=true,...props}:{name:string;label:string;required?:boolean}&React.ComponentProps<typeof Input>){return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} required={required} className="mt-2 h-12 rounded-xl" {...props}/></div>}
