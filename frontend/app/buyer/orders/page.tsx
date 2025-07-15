"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { api } from "@/lib/api-client";

interface Order {
  _id: string;
  productTitle: string;
  status: string;
  createdAt: string;
  quantity: number;
  totalAmount: number;
  productImage?: string;
}

export default function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) return;
      
      try {
        const response = await api.get<{ orders: Order[] }>(`api/orders?email=${user.email}`);
        setOrders(response.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.email]);

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
                {order.productImage && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={order.productImage}
                      alt={order.productTitle}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold capitalize">{order.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Quantity:</span>
                      <span>{order.quantity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount:</span>
                      <span>₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Ordered on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
