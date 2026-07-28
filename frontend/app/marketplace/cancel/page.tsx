import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelled() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <XCircle className="w-20 h-20 text-destructive mb-6" />
      <h1 className="text-3xl font-bold text-destructive mb-2">Payment Cancelled</h1>
      <p className="text-lg text-destructive mb-6">Your payment was not completed.</p>
      <Link
        href="/marketplace"
        className="px-6 py-3 bg-destructive text-primary-foreground rounded-lg font-semibold shadow hover:bg-destructive transition"
      >
        Return to Marketplace
      </Link>
      <Link
        href="/buyer/orders"
        className="mt-4 text-destructive underline"
      >
        View My Orders
      </Link>
    </div>
  );
}