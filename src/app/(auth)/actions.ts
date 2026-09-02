"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthState = { error?: string };

const loginSchema = z.object({ email: z.string().email().transform(v => v.trim().toLowerCase()), password: z.string().min(8).max(128) });
const registerSchema = loginSchema.extend({ name: z.string().trim().min(2).max(80), businessName: z.string().trim().min(2).max(120) });

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { role: true } });
  if (!user || user.status !== "ACTIVE" || !(await compare(parsed.data.password, user.passwordHash))) return { error: "Email or password is incorrect." };
  await createSession(user.id);
  await prisma.adminActivityLog.create({ data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id } });
  redirect(user.role.name === "CUSTOMER" ? "/dashboard" : "/admin");
}

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with this email already exists." };
  const customerRole = await prisma.role.upsert({ where: { name: "CUSTOMER" }, update: {}, create: { name: "CUSTOMER" } });
  const user = await prisma.user.create({ data: {
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: await hash(parsed.data.password, 12),
    status: "ACTIVE",
    roleId: customerRole.id,
    customerProfile: { create: { businessName: parsed.data.businessName } },
  } });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
