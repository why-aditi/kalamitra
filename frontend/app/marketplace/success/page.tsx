import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <CheckCircle className="w-20 h-20 text-green-600 mb-6" />
      <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Successful!</h1>
      <p className="text-lg text-green-700 mb-6">Your order has been placed successfully.</p>
      <Link
        href="/buyer/orders"
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
      >
        View My Orders
      </Link>
      <Link
        href="/marketplace"
        className="mt-4 text-green-700 underline"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
