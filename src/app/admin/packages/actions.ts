"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BillingInterval, RecordStatus } from "@prisma/client";

const packageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  description: z.string().trim().min(5).max(500),
  price: z.coerce.number().positive(),
  currency: z.string().default("JOD"),
  billingInterval: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]).default("MONTHLY" as BillingInterval),
  ctaText: z.string().trim().default("Get started"),
  isPopular: z.coerce.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
});

export async function createPackage(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  const data = packageSchema.parse(Object.fromEntries(formData));
  
  const existing = await prisma.package.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new Error("A package with this slug already exists");
  }
  
  const pkg = await prisma.package.create({
    data: {
      ...data,
      status: "ACTIVE" as RecordStatus,
    },
  });
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "PACKAGE_CREATED",
      entity: "Package",
      entityId: pkg.id,
      after: { name: pkg.name, slug: pkg.slug },
    },
  });
  
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/pricing");
  
  return { success: true, packageId: pkg.id };
}

export async function updatePackage(packageId: string, formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  const data = packageSchema.partial().parse(Object.fromEntries(formData));
  
  // Check if slug is being changed and if it already exists
  if (data.slug) {
    const existing = await prisma.package.findFirst({
      where: { slug: data.slug, id: { not: packageId } },
    });
    if (existing) {
      throw new Error("A package with this slug already exists");
    }
  }
  
  const pkg = await prisma.package.update({
    where: { id: packageId },
    data,
  });
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "PACKAGE_UPDATED",
      entity: "Package",
      entityId: pkg.id,
      after: { name: pkg.name, slug: pkg.slug },
    },
  });
  
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/pricing");
  
  return { success: true };
}

export async function deletePackage(packageId: string) {
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  // Check if package has active subscriptions
  const subscriptionCount = await prisma.subscription.count({
    where: { packageId, status: "ACTIVE" },
  });
  
  if (subscriptionCount > 0) {
    throw new Error(`Cannot delete package with ${subscriptionCount} active subscription(s). Set it to inactive instead.`);
  }
  
  await prisma.package.delete({
    where: { id: packageId },
  });
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "PACKAGE_DELETED",
      entity: "Package",
      entityId: packageId,
    },
  });
  
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/pricing");
  
  return { success: true };
}

export async function togglePackageStatus(packageId: string) {
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) throw new Error("Package not found");
  
  const newStatus = pkg.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  
  await prisma.package.update({
    where: { id: packageId },
    data: { status: newStatus as RecordStatus },
  });
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "PACKAGE_STATUS_CHANGED",
      entity: "Package",
      entityId: packageId,
      after: { status: newStatus },
    },
  });
  
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/pricing");
  
  return { success: true, newStatus };
}

export async function updatePackageFeatures(packageId: string, features: { name: string; description?: string; limit?: number }[]) {
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  await prisma.$transaction(async (tx) => {
    // Delete existing features
    await tx.packageFeature.deleteMany({
      where: { packageId },
    });
    
    // Create new features
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      await tx.packageFeature.create({
        data: {
          packageId,
          name: feature.name,
          description: feature.description,
          limit: feature.limit,
          displayOrder: i,
        },
      });
    }
  });
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "PACKAGE_FEATURES_UPDATED",
      entity: "Package",
      entityId: packageId,
    },
  });
  
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/pricing");
  
  return { success: true };
}
