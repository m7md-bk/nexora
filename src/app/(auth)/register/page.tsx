import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ package?: string }> }) {
  const pkg = (await searchParams).package;
  
  // Determine redirect destination based on package selection
  const redirectTo = pkg ? `/pricing?package=${pkg}` : "/dashboard";
  
  return (
    <div className="w-full">
      <p className="text-sm font-bold text-primary">START GROWING</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-3 text-slate-600">Set up your secure workspace, then choose the package that fits.</p>
      <div className="mt-8">
        <AuthForm mode="register" redirectTo={redirectTo} />
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered? <Link href="/login" className="font-bold text-primary">Log in</Link>
      </p>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        By continuing, you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
