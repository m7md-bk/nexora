import { prisma } from "@/lib/prisma";

export async function reviewManualPayment(paymentId: string, reviewerId: string, decision: "APPROVE"|"REJECT", note?: string, reference?: string) {
  return prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment || payment.status !== "PENDING") throw new Error("Payment cannot be reviewed");
    const approved = decision === "APPROVE";
    const updated = await tx.payment.update({ where: { id: paymentId }, data: { status: approved ? "PAID" : "FAILED", paidAt: approved ? new Date() : null, reviewedAt: new Date(), adminNote: note, transactionReference: reference } });
    if (payment.orderId) {
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: updated.status, status: approved ? "PROCESSING" : "PENDING" } });
      await tx.invoice.updateMany({ where: { orderId: payment.orderId }, data: { status: updated.status, paidAt: approved ? new Date() : null } });
      if (approved && payment.order?.subscriptionId) await tx.subscription.update({ where: { id: payment.order.subscriptionId }, data: { status: "ACTIVE" } });
    }
    await tx.notification.create({ data: { userId: payment.userId, type: "PAYMENT", title: approved ? "Payment approved" : "Payment needs attention", message: approved ? "Your payment was verified successfully." : "Your payment could not be verified. Please review the details.", link: "/dashboard/payments" } });
    await tx.auditLog.create({ data: { userId: reviewerId, action: approved ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED", entity: "Payment", entityId: paymentId, after: { status: updated.status } } });
    return updated;
  });
}
