import { prisma } from "@/lib/prisma";
import { calculateSubscriptionDates, formatOrderNumber } from "@/lib/business";

export async function createPackageOrder(userId: string, packageId: string) {
  return prisma.$transaction(async tx => {
    const plan = await tx.package.findFirst({ where: { id: packageId, status: "ACTIVE" } });
    if (!plan) throw new Error("Package is unavailable");
    const year = new Date().getUTCFullYear();
    const counter = await tx.orderCounter.upsert({ where: { year }, create: { year, value: 1 }, update: { value: { increment: 1 } } });
    const dates = calculateSubscriptionDates(new Date(), plan.billingInterval);
    const subscription = await tx.subscription.create({ data: { userId, packageId: plan.id, status: "PENDING", amount: plan.price, currency: plan.currency, billingInterval: plan.billingInterval, ...dates } });
    const order = await tx.order.create({ data: { orderNumber: formatOrderNumber(counter.value), userId, subscriptionId: subscription.id, amount: plan.price, currency: plan.currency, items: { create: { packageId: plan.id, name: plan.name, quantity: 1, unitAmount: plan.price, totalAmount: plan.price } } } });
    await tx.invoice.create({ data: { invoiceNumber: `INV-${year}-${String(counter.value).padStart(6,"0")}`, userId, orderId: order.id, subscriptionId: subscription.id, subtotal: plan.price, total: plan.price, currency: plan.currency } });
    await tx.notification.create({ data: { userId, type: "ORDER", title: "Order created", message: `Order ${order.orderNumber} is awaiting payment.`, link: `/dashboard/orders/${order.id}` } });
    return order;
  });
}
