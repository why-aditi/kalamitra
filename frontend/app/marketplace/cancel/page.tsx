import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelled() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <XCircle className="w-20 h-20 text-red-600 mb-6" />
      <h1 className="text-3xl font-bold text-red-800 mb-2">Payment Cancelled</h1>
      <p className="text-lg text-red-700 mb-6">Your payment was not completed.</p>
      <Link
        href="/marketplace"
        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition"
      >
        Return to Marketplace
      </Link>
      <Link
        href="/buyer/orders"
        className="mt-4 text-red-700 underline"
      >
        View My Orders
      </Link>
    </div>
  );
}