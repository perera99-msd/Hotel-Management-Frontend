"use client";

import { useState, useEffect } from "react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import OrdersView from "../../../components/dining/OrdersView";
import ManualOrderView from "../../../components/dining/ManualOrderView";
import MenuManagement from "../../../components/dining/MenuManagement";
import NewMenuItemPopup from "../../../components/dining/NewMenuItemPopup";
import { ClipboardList, Plus, Utensils } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

type ActiveView = "orders" | "manual-order" | "menu";

export default function Dining() {
  const [activeView, setActiveView] = useState<ActiveView>("orders");
  const [showNewMenuPopup, setShowNewMenuPopup] = useState(false);
  
  // Logic from Admin Dashboard: Fetch Real Data Counts
  const [counts, setCounts] = useState({ orders: 0, menu: 0 });
  const { token } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchCounts = async () => {
    if (!token) return;
    try {
      const [ordersRes, menuRes] = await Promise.all([
        fetch(`${API_URL}/api/orders`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${API_URL}/api/menu`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);

      if (ordersRes.ok && menuRes.ok) {
        const ordersData = await ordersRes.json();
        const menuData = await menuRes.json();
        setCounts({
          orders: ordersData.length,
          menu: menuData.length
        });
      }
    } catch (error) {
      console.error("Failed to fetch counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [token, API_URL]);

  return (
    <AdminReceptionistLayout role="receptionist">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Dining & Menu</h2>
          <p className="text-gray-600">
            Manage menu items and track food orders
          </p>
        </div>
        <button
          onClick={() => setShowNewMenuPopup(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Menu Item
        </button>
      </div>

      {/* Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          className={`flex items-center space-x-2 pb-2 px-1 ${
            activeView === "orders"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveView("orders")}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Orders ({counts.orders})</span>
        </button>
        <button
          className={`flex items-center space-x-2 pb-2 px-1 ${
            activeView === "manual-order"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveView("manual-order")}
        >
          <Plus className="w-4 h-4" />
          <span>Manual Order</span>
        </button>
        <button
          className={`flex items-center space-x-2 pb-2 px-1 ${
            activeView === "menu"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveView("menu")}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu ({counts.menu})</span>
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === "orders" && <OrdersView />}
      {activeView === "manual-order" && <ManualOrderView />}
      {activeView === "menu" && <MenuManagement />}

      {/* New Menu Item Popup */}
      {showNewMenuPopup && (
        <NewMenuItemPopup
          isOpen={showNewMenuPopup}
          onClose={() => {
            setShowNewMenuPopup(false);
            fetchCounts(); // Refresh counts when a new item is added
          }}
        />
      )}
    </AdminReceptionistLayout>
  );
}