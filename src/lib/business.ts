import type { BillingInterval, Coupon, PaymentStatus } from "@prisma/client";

export function calculateSubscriptionDates(start: Date, interval: BillingInterval) {
  const renewsAt = new Date(start);
  if (interval === "MONTHLY") renewsAt.setMonth(renewsAt.getMonth() + 1);
  else if (interval === "QUARTERLY") renewsAt.setMonth(renewsAt.getMonth() + 3);
  else if (interval === "YEARLY") renewsAt.setFullYear(renewsAt.getFullYear() + 1);
  else return { startsAt: start, renewsAt: null, expiresAt: null };
  return { startsAt: start, renewsAt, expiresAt: new Date(renewsAt) };
}

export function formatOrderNumber(sequence: number, date = new Date()) {
  return `NX-${date.getUTCFullYear()}-${String(sequence).padStart(6, "0")}`;
}

export function calculateCouponDiscount(coupon: Pick<Coupon,"discountType"|"discountValue"|"minimumAmount"|"maximumDiscount"|"isActive"|"startsAt"|"expiresAt">, subtotal: number, now = new Date()) {
  if (!coupon.isActive) throw new Error("Coupon is disabled");
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Coupon is not active yet");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("Coupon has expired");
  if (coupon.minimumAmount && subtotal < Number(coupon.minimumAmount)) throw new Error("Minimum order amount not met");
  const raw = coupon.discountType === "PERCENTAGE" ? subtotal * Number(coupon.discountValue) / 100 : Number(coupon.discountValue);
  return Math.max(0, Math.min(raw, Number(coupon.maximumDiscount ?? raw), subtotal));
}

export interface PaymentAdapter {
  readonly provider: string;
  createPayment(input: { amount: number; currency: string; orderId: string }): Promise<{ status: PaymentStatus; reference?: string }>;
  verifyPayment(reference: string): Promise<PaymentStatus>;
  refundPayment(reference: string, amount?: number): Promise<PaymentStatus>;
}

export class ManualPaymentAdapter implements PaymentAdapter {
  readonly provider = "manual";
  async createPayment() { return { status: "PENDING" as const }; }
  async verifyPayment() { return "PENDING" as const; }
  async refundPayment() { return "PENDING" as const; }
}
