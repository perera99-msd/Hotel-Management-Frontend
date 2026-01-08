"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

interface OrderItem {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    guestName?: string;
    roomNumber?: string;
    tableNumber?: string;
    specialNotes?: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'Preparing' | 'Ready' | 'Served' | 'Cancelled';
    createdAt: string;
}

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { token } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchOrders = async () => {
    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        if (response.ok) {
            const data = await response.json();
            setOrders(data);
        }
    } catch (error) {
        console.error("Failed to fetch orders", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if(token) {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // 30 sec poll
        return () => clearInterval(interval);
    }
  }, [token]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
        const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            // Optimistic update locally
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus as any } : o));
        } else {
            alert("Failed to update status");
        }
    } catch (error) {
        alert("Failed to update status");
    } finally {
        setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => filterStatus === "All" || o.status === filterStatus);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center text-black">
        <h3 className="font-semibold text-lg">Orders</h3>
        <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="border rounded px-3 py-1 bg-white"
        >
            <option value="All">All Orders</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Served">Served</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border rounded-lg p-4 shadow-sm text-black">
                <div className="flex justify-between mb-2">
                    <div>
                        <div className="font-bold">Order #{order._id.slice(-4)}</div>
                        <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded h-fit font-semibold ${
                        order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Ready' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'
                    }`}>
                        {order.status}
                    </span>
                </div>
                
                <div className="mb-2">
                    <div className="text-sm font-medium">{order.guestName || "Guest"}</div>
                    <div className="text-xs text-gray-500">
                        {order.roomNumber && `Room: ${order.roomNumber}`} 
                        {order.tableNumber && ` • Table: ${order.tableNumber}`}
                    </div>
                </div>

                <div className="border-t border-b py-2 my-2 space-y-1">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {order.specialNotes && (
                    <div className="text-xs bg-red-50 text-red-600 p-2 rounded mb-3">
                        Note: {order.specialNotes}
                    </div>
                )}

                <div className="flex justify-between items-center mt-2">
                    <div className="font-bold">Total: ${order.totalAmount.toFixed(2)}</div>
                    {order.status === 'Preparing' && (
                        <button onClick={() => updateStatus(order._id, 'Ready')} disabled={!!updatingId} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Mark Ready</button>
                    )}
                    {order.status === 'Ready' && (
                        <button onClick={() => updateStatus(order._id, 'Served')} disabled={!!updatingId} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Mark Served</button>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}