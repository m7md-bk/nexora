"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export function AuthForm({ mode, redirectTo }: { mode: "login" | "register"; redirectTo?: string }) {
  const [state, action, pending] = useActionState(
    mode === "login" ? loginAction : registerAction, 
    initial
  );
  
  return (
    <form action={action} className="space-y-5">
      {/* Hidden field for redirect destination */}
      <input type="hidden" name="redirectTo" value={redirectTo || ""} />
      
      {mode === "register" && (
        <>
          <Field id="name" label="Full name" placeholder="Your name" autoComplete="name" />
          <Field id="businessName" label="Business name" placeholder="Your business" autoComplete="organization" />
        </>
      )}
      <Field id="email" label="Email address" placeholder="you@business.com" type="email" autoComplete="email" />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {mode === "login" && (
            <Link href="/forgot-password" className="text-sm font-semibold text-primary">
              Forgot password?
            </Link>
          )}
        </div>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          minLength={8} 
          maxLength={128} 
          autoComplete={mode === "login" ? "current-password" : "new-password"} 
          required 
          className="h-12 rounded-xl" 
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
      <Button 
        type="submit" 
        className="h-12 w-full rounded-xl" 
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            {mode === "login" ? "Log in securely" : "Create account"}
            <ArrowRight className="ml-2" size={18} />
          </>
        )}
      </Button>
    </form>
  );
}

function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} required className="h-12 rounded-xl" {...props} />
    </div>
  );
}
