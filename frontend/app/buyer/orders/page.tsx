"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface Order {
  _id: string;
  productTitle: string;
  status: string;
  createdAt: string;
}

export default function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call
    // Simulate loading
    setTimeout(() => {
      setOrders([]); // No orders yet
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : orders.length === 0 ? (
          <Card className="border-orange-200">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order._id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{order.productTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">Status: <span className="font-semibold">{order.status}</span></div>
                  <div className="text-xs text-gray-500">Ordered on {new Date(order.createdAt).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
