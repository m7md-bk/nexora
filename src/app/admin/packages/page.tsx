import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPackage,
  togglePackageStatus,
  deletePackage,
  updatePackageFeatures,
  updatePackage,
} from "./actions";
import type { Package, PackageFeature } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  const packages = await prisma.package.findMany({
    include: {
      features: {
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });
  
  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Management</p>
        <h1 className="mt-1 text-3xl font-extrabold">Packages</h1>
        <p className="mt-2 text-slate-500">Create, edit, and manage subscription packages.</p>
      </div>
      
      <PackageForm />
      
      <Card className="mt-7 overflow-hidden rounded-2xl border-0 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">All Packages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {packages.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Popular</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold">{pkg.name}</td>
                      <td className="px-6 py-4 text-slate-500">{pkg.slug}</td>
                      <td className="px-6 py-4 font-medium">
                        {Number(pkg.price).toFixed(2)} {pkg.currency}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            pkg.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pkg.isPopular ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{pkg.displayOrder}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <EditPackageButton pkg={pkg} />
                          <form action={async (formData) => {
                            "use server";
                            await togglePackageStatus(pkg.id);
                          }}>
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg"
                            >
                              {pkg.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 rounded-lg"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${pkg.name}"?`)) {
                                await deletePackage(pkg.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">
                ◎
              </div>
              <p className="mt-4 font-bold">No packages available</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first package using the form above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EditPackageButton({ pkg }: { pkg: Package & { features: PackageFeature[] } }) {
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-lg"
        onClick={() => {
          const dialog = document.getElementById(`edit-package-${pkg.id}`) as HTMLDialogElement;
          if (dialog) dialog.showModal();
        }}
      >
        Edit
      </Button>
      <EditPackageDialog pkg={pkg} />
    </>
  );
}

function EditPackageDialog({ pkg }: { pkg: Package & { features: PackageFeature[] } }) {
  return (
    <dialog id={`edit-package-${pkg.id}`} className="backdrop:bg-slate-950/50 backdrop:backblur-sm open:animate-in open:fade-in open:zoom-in-95 close:animate-out close:fade-out close:zoom-out-95 rounded-2xl p-0 shadow-2xl">
      <div className="flex max-h-[90vh] flex-col rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-bold">Edit Package</h2>
          <button
            onClick={() => (document.getElementById(`edit-package-${pkg.id}`) as HTMLDialogElement)?.close()}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <form action={async (formData: FormData) => {
            "use server";
            // Extract features data before processing other fields
            const featuresData = formData.get("features") as string;
            const features = featuresData ? JSON.parse(featuresData) : [];
            
            // Update package features first
            await updatePackageFeatures(pkg.id, features);
            
            // Then update package main data
            await updatePackage(pkg.id, formData);
            
            revalidatePath("/admin/packages");
            revalidatePath("/");
            revalidatePath("/pricing");
            (document.getElementById(`edit-package-${pkg.id}`) as HTMLDialogElement)?.close();
          }} className="space-y-4">
            <input type="hidden" name="features" value={JSON.stringify(pkg.features.map(f => ({ name: f.name, description: f.description ?? undefined, limit: f.limit ?? undefined })))} />
            
            <div>
              <Label htmlFor={`edit-name-${pkg.id}`}>Name</Label>
              <Input
                id={`edit-name-${pkg.id}`}
                name="name"
                defaultValue={pkg.name}
                required
                className="mt-2 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor={`edit-slug-${pkg.id}`}>Slug</Label>
              <Input
                id={`edit-slug-${pkg.id}`}
                name="slug"
                defaultValue={pkg.slug}
                required
                pattern="[a-z0-9-]+"
                className="mt-2 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`edit-price-${pkg.id}`}>Price</Label>
                <Input
                  id={`edit-price-${pkg.id}`}
                  name="price"
                  type="number"
                  step="0.001"
                  min="0"
                  defaultValue={Number(pkg.price)}
                  required
                  className="mt-2 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor={`edit-currency-${pkg.id}`}>Currency</Label>
                <Input
                  id={`edit-currency-${pkg.id}`}
                  name="currency"
                  defaultValue={pkg.currency}
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`edit-description-${pkg.id}`}>Description</Label>
              <Input
                id={`edit-description-${pkg.id}`}
                name="description"
                defaultValue={pkg.description}
                required
                className="mt-2 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`edit-billingInterval-${pkg.id}`}>Billing Interval</Label>
                <select
                  id={`edit-billingInterval-${pkg.id}`}
                  name="billingInterval"
                  defaultValue={pkg.billingInterval}
                  className="mt-2 flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="ONE_TIME">One Time</option>
                </select>
              </div>
              <div>
                <Label htmlFor={`edit-ctaText-${pkg.id}`}>CTA Text</Label>
                <Input
                  id={`edit-ctaText-${pkg.id}`}
                  name="ctaText"
                  defaultValue={pkg.ctaText}
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`edit-isPopular-${pkg.id}`}
                  name="isPopular"
                  defaultChecked={pkg.isPopular}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={`edit-isPopular-${pkg.id}`} className="mb-0">Most Popular</Label>
              </div>
              <div className="flex-1">
                <Label htmlFor={`edit-displayOrder-${pkg.id}`}>Display Order</Label>
                <Input
                  id={`edit-displayOrder-${pkg.id}`}
                  name="displayOrder"
                  type="number"
                  defaultValue={pkg.displayOrder}
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Label>Features</Label>
              <p className="mt-1 text-xs text-slate-500">Features are saved along with package data.</p>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => (document.getElementById(`edit-package-${pkg.id}`) as HTMLDialogElement)?.close()}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}

function PackageForm() {
  async function handleCreate(formData: FormData) {
    "use server";
    await createPackage(formData);
    revalidatePath("/admin/packages");
  }
  
  return (
    <Card className="mt-7 rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Create Package</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleCreate} className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required className="mt-2 rounded-xl" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              className="mt-2 rounded-xl"
              placeholder="e.g., growth-plan"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="price">Price (JOD)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.001"
              min="0"
              required
              className="mt-2 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue="JOD"
              className="mt-2 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="billingInterval">Billing Interval</Label>
            <select
              id="billingInterval"
              name="billingInterval"
              className="mt-2 flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              defaultValue="MONTHLY"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
              <option value="ONE_TIME">One Time</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              required
              className="mt-2 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="ctaText">CTA Text</Label>
            <Input
              id="ctaText"
              name="ctaText"
              defaultValue="Get started"
              className="mt-2 rounded-xl"
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPopular"
                name="isPopular"
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPopular" className="mb-0">Most Popular</Label>
            </div>
            <div className="flex-1">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                name="displayOrder"
                type="number"
                defaultValue="0"
                className="mt-2 rounded-xl"
              />
            </div>
          </div>
          <div className="md:col-span-6">
            <Button className="h-10 w-full rounded-xl" type="submit">
              Create Package
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
