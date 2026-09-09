import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

async function updateOrderStatus(formData: FormData) {
  "use server";
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"]);
  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as string;
  
  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as any },
  });
  
  await prisma.adminActivityLog.create({
    data: {
      userId: admin.id,
      action: "ORDER_STATUS_UPDATED",
      entity: "Order",
      entityId: orderId,
      after: { status },
    },
  });
  
  revalidatePath("/admin/manage-all");
}

async function updatePaymentStatus(formData: FormData) {
  "use server";
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"]);
  const paymentId = formData.get("paymentId") as string;
  const status = formData.get("status") as string;
  const note = formData.get("note") as string;
  const reference = formData.get("reference") as string;
  
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: status as any,
        adminNote: note || null,
        transactionReference: reference || null,
        paidAt: status === "PAID" ? new Date() : null,
        reviewedAt: new Date(),
      },
    });
    
    if (payment.orderId) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: status as any,
          status: status === "PAID" ? "PROCESSING" : "PENDING",
        },
      });
      
      await tx.invoice.updateMany({
        where: { orderId: payment.orderId },
        data: {
          status: status as any,
          paidAt: status === "PAID" ? new Date() : null,
        },
      });
      
      if (status === "PAID" && payment.order?.subscriptionId) {
        await tx.subscription.update({
          where: { id: payment.order.subscriptionId },
          data: { status: "ACTIVE" },
        });
      }
    }
    
    await tx.notification.create({
      data: {
        userId: payment.userId,
        type: "PAYMENT",
        title: status === "PAID" ? "تم قبول الدفع" : "تم تحديث حالة الدفع",
        message: status === "PAID" 
          ? "تم التحقق من دفعتك بنجاح وسيتم معالجة طلبك." 
          : `تم تحديث حالة دفعتك إلى ${status}.`,
        link: "/dashboard/payments",
      },
    });
  });
  
  await prisma.adminActivityLog.create({
    data: {
      userId: admin.id,
      action: status === "PAID" ? "PAYMENT_APPROVED" : "PAYMENT_UPDATED",
      entity: "Payment",
      entityId: paymentId,
      after: { status },
    },
  });
  
  revalidatePath("/admin/manage-all");
}

async function updateUserRole(formData: FormData) {
  "use server";
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const userId = formData.get("userId") as string;
  const roleId = formData.get("roleId") as string;
  const status = formData.get("status") as string;
  
  await prisma.user.update({
    where: { id: userId },
    data: { roleId, status: status as any },
  });
  
  await prisma.adminActivityLog.create({
    data: {
      userId: admin.id,
      action: "USER_ROLE_UPDATED",
      entity: "User",
      entityId: userId,
      after: { roleId, status },
    },
  });
  
  revalidatePath("/admin/manage-all");
}

export default async function AdminManageAllPage() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"]);
  
  const [orders, payments, customers, roles, packages, services] = await Promise.all([
    prisma.order.findMany({
      include: { 
        user: { include: { role: true } },
        items: { include: { package: true, service: true } },
        subscription: { include: { package: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.payment.findMany({
      include: { 
        user: { include: { role: true } },
        order: { include: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: { name: "CUSTOMER" } },
      include: { 
        role: true,
        customerProfile: true,
        orders: { take: 5, orderBy: { createdAt: "desc" } },
        subscriptions: { take: 5, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany(),
    prisma.package.findMany({ 
      where: { status: "ACTIVE" },
      include: { features: true },
    }),
    prisma.service.findMany({ where: { status: "ACTIVE" } }),
  ]);
  
  const pendingPayments = payments.filter(p => p.status === "PENDING");
  const pendingOrders = orders.filter(o => o.status === "PENDING");
  
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-bold text-primary">إدارة الموقع الشاملة</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">لوحة التحكم الكاملة</h1>
        <p className="mt-2 text-slate-500">إدارة الطلبات، المدفوعات، المستخدمين، ومحتوى الموقع</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-yellow-50 p-3 text-yellow-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">طلبات قيد الانتظار</p>
              <p className="mt-1 text-2xl font-extrabold">{pendingOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">مدفوعات待 المراجعة</p>
              <p className="mt-1 text-2xl font-extrabold">{pendingPayments.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-green-50 p-3 text-green-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">عدد العملاء</p>
              <p className="mt-1 text-2xl font-extrabold">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">إجمالي الطلبات</p>
              <p className="mt-1 text-2xl font-extrabold">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Payments Section */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">المدفوعات待 المراجعة ({pendingPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length > 0 ? (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{payment.user.name}</p>
                      <p className="text-sm text-slate-500">{payment.user.email}</p>
                      <p className="mt-1 text-sm">
                        <span className="font-medium">المبلغ:</span> {Number(payment.amount).toFixed(3)} {payment.currency}
                      </p>
                      {payment.customerNote && (
                        <p className="mt-1 text-sm text-slate-600">
                          <span className="font-medium">ملاحظة العميل:</span> {payment.customerNote}
                        </p>
                      )}
                      {payment.proofUrl && (
                        <a 
                          href={payment.proofUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-sm text-blue-600 hover:underline"
                        >
                          عرض إثبات الدفع
                        </a>
                      )}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="rounded-xl" variant="outline">
                          مراجعة الدفع
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>مراجعة الدفع - {Number(payment.amount).toFixed(3)} {payment.currency}</DialogTitle>
                        </DialogHeader>
                        <form action={updatePaymentStatus} className="space-y-4">
                          <input type="hidden" name="paymentId" value={payment.id} />
                          
                          <div>
                            <Label>حالة الدفع</Label>
                            <Select name="status" defaultValue="PENDING">
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الحالة" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                                <SelectItem value="PAID">تم الدفع</SelectItem>
                                <SelectItem value="FAILED">فشل</SelectItem>
                                <SelectItem value="CANCELLED">ملغي</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`ref-${payment.id}`}>رقم المعاملة (اختياري)</Label>
                            <Input 
                              id={`ref-${payment.id}`} 
                              name="reference" 
                              placeholder="مثال: TXN123456"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`note-${payment.id}`}>ملاحظة الإدارة</Label>
                            <Textarea 
                              id={`note-${payment.id}`} 
                              name="note" 
                              placeholder="أية ملاحظات إضافية..."
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button type="submit" className="flex-1 rounded-xl" variant="default">
                              حفظ التغييرات
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">✓</div>
              <p className="mt-4 font-bold">لا توجد مدفوعات待 المراجعة</p>
              <p className="mt-1 text-sm text-slate-500">جميع المدفوعات تمت مراجعتها</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Orders Section */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">الطلبات الأخيرة ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">رقم الطلب</th>
                    <th className="px-6 py-4">العميل</th>
                    <th className="px-6 py-4">التفاصيل</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">حالة الدفع</th>
                    <th className="px-6 py-4 text-right">المبلغ</th>
                    <th className="px-6 py-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold">{order.orderNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{order.user.name}</p>
                        <p className="text-xs text-slate-500">{order.user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-sm">{item.name} × {item.quantity}</p>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[order.status] || "bg-gray-100"}>
                          {order.status === "PENDING" && "قيد الانتظار"}
                          {order.status === "PROCESSING" && "قيد المعالجة"}
                          {order.status === "COMPLETED" && "مكتمل"}
                          {order.status === "CANCELLED" && "ملغي"}
                          {order.status === "REFUNDED" && "مسترد"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={paymentStatusColors[order.paymentStatus] || "bg-gray-100"}>
                          {order.paymentStatus === "PENDING" && "قيد الانتظار"}
                          {order.paymentStatus === "PAID" && "مدفوع"}
                          {order.paymentStatus === "FAILED" && "فشل"}
                          {order.paymentStatus === "CANCELLED" && "ملغي"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {Number(order.amount).toFixed(3)} {order.currency}
                      </td>
                      <td className="px-6 py-4">
                        <form action={updateOrderStatus} className="flex items-center gap-2">
                          <input type="hidden" name="orderId" value={order.id} />
                          <Select 
                            name="status" 
                            defaultValue={order.status}
                            onValueChange={(value) => {
                              const form = document.createElement('form');
                              form.method = 'POST';
                              form.innerHTML = `
                                <input type="hidden" name="orderId" value="${order.id}" />
                                <input type="hidden" name="status" value="${value}" />
                              `;
                              document.body.appendChild(form);
                              form.submit();
                            }}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">انتظار</SelectItem>
                              <SelectItem value="PROCESSING">معالجة</SelectItem>
                              <SelectItem value="COMPLETED">مكتمل</SelectItem>
                              <SelectItem value="CANCELLED">إلغاء</SelectItem>
                            </SelectContent>
                          </Select>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">📦</div>
              <p className="mt-4 font-bold">لا توجد طلبات بعد</p>
              <p className="mt-1 text-sm text-slate-500">ستظهر الطلبات هنا عند بدئها</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Customers Management */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">إدارة العملاء ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">الاسم</th>
                    <th className="px-6 py-4">البريد الإلكتروني</th>
                    <th className="px-6 py-4">الشركة</th>
                    <th className="px-6 py-4">الدور</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">الطلبات</th>
                    <th className="px-6 py-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold">{customer.name}</td>
                      <td className="px-6 py-4">{customer.email}</td>
                      <td className="px-6 py-4">{customer.customerProfile?.businessName || "-"}</td>
                      <td className="px-6 py-4">
                        <form action={updateUserRole} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={customer.id} />
                          <Select 
                            name="roleId" 
                            defaultValue={customer.roleId}
                            onValueChange={(value) => {
                              const form = document.createElement('form');
                              form.method = 'POST';
                              form.innerHTML = `
                                <input type="hidden" name="userId" value="${customer.id}" />
                                <input type="hidden" name="roleId" value="${value}" />
                                <input type="hidden" name="status" value="${customer.status}" />
                              `;
                              document.body.appendChild(form);
                              form.submit();
                            }}
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name === "SUPER_ADMIN" && "مدير أعلى"}
                                  {role.name === "ADMIN" && "مدير"}
                                  {role.name === "STAFF" && "موظف"}
                                  {role.name === "CUSTOMER" && "عميل"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </form>
                      </td>
                      <td className="px-6 py-4">
                        <form action={updateUserRole} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={customer.id} />
                          <input type="hidden" name="roleId" value={customer.roleId} />
                          <Select 
                            name="status" 
                            defaultValue={customer.status}
                            onValueChange={(value) => {
                              const form = document.createElement('form');
                              form.method = 'POST';
                              form.innerHTML = `
                                <input type="hidden" name="userId" value="${customer.id}" />
                                <input type="hidden" name="roleId" value="${customer.roleId}" />
                                <input type="hidden" name="status" value="${value}" />
                              `;
                              document.body.appendChild(form);
                              form.submit();
                            }}
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">نشط</SelectItem>
                              <SelectItem value="SUSPENDED">موقوف</SelectItem>
                              <SelectItem value="PENDING_VERIFICATION">قيد التحقق</SelectItem>
                            </SelectContent>
                          </Select>
                        </form>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs">{customer.orders.length} طلب</span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/admin/customers/${customer.id}`}>عرض</a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">👥</div>
              <p className="mt-4 font-bold">لا يوجد عملاء بعد</p>
              <p className="mt-1 text-sm text-slate-500">سيظهر العملاء هنا عند التسجيل</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Packages & Services Quick Edit */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">الباقات النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{pkg.name}</p>
                      <p className="text-sm text-slate-500">{pkg.description}</p>
                      <p className="mt-1 text-sm font-medium text-primary">
                        {Number(pkg.price).toFixed(3)} {pkg.currency} / {pkg.billingInterval.toLowerCase()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/admin/packages">تعديل</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">الخدمات النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-slate-500">{service.category}</p>
                      {service.price && (
                        <p className="mt-1 text-sm font-medium text-primary">
                          {Number(service.price).toFixed(3)} {service.currency}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/admin/services">تعديل</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
