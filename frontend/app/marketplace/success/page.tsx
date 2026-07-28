import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <CheckCircle className="w-20 h-20 text-neem mb-6" />
      <h1 className="text-3xl font-bold text-neem mb-2">Payment Successful!</h1>
      <p className="text-lg text-neem mb-6">Your order has been placed successfully.</p>
      <Link
        href="/buyer/orders"
        className="px-6 py-3 bg-neem text-primary-foreground rounded-lg font-semibold shadow hover:bg-neem transition"
      >
        View My Orders
      </Link>
      <Link
        href="/marketplace"
        className="mt-4 text-neem underline"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
