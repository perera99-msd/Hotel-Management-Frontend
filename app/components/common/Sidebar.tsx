/* */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext"; 
import {
  Bed,
  LogOut,
  LayoutDashboard,
  Calendar,
  Utensils,
  Navigation,
  FileText,
  Package,
  BarChart3,
  Settings,
  X,
  User as UserIcon,
  Tags,
  DollarSign,
  UserCheck,
} from "lucide-react";

type Role = "admin" | "receptionist";

interface SidebarProps {
  role: Role;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({
  role,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, token } = useAuth();
  
  // State for dynamic badges
  const [counts, setCounts] = useState({
    bookings: 0,
    dining: 0,
    inventory: 0
  });

  // Fetch real-time counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!token || role !== 'admin') return; // Only fetch for admins generally or extend logic
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reports/sidebar-counts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar counts", error);
      }
    };

    fetchCounts();
    // Optional: Poll every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [token, role]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName = profile?.name || user?.displayName || "Staff Member";

  const links = {
    admin: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard, badge: null },
      { name: "Rooms", href: "/dashboard/admin/rooms", icon: Bed, badge: null },
      { name: "Bookings", href: "/dashboard/admin/bookings", icon: Calendar, badge: counts.bookings > 0 ? String(counts.bookings) : null },
      { name: "Dining", href: "/dashboard/admin/dining", icon: Utensils, badge: counts.dining > 0 ? String(counts.dining) : null },
      { name: "Trip Packages", href: "/dashboard/admin/trip-packages", icon: Navigation, badge: null },
      { name: "Inventory", href: "/dashboard/admin/inventory", icon: Package, badge: counts.inventory > 0 ? String(counts.inventory) : null },
      { name: "Billing", href: "/dashboard/admin/billing", icon: FileText, badge: null },
      { name: "Reports", href: "/dashboard/admin/reports", icon: BarChart3, badge: null },
      { name: "Settings", href: "/dashboard/admin/settings", icon: Settings, badge: null },
      { name: "Guest", href: "/dashboard/admin/guest", icon: UserIcon, badge: null },
      { name: "Deals", href: "/dashboard/admin/deals", icon: Tags, badge: null },
      // ✅ Removed Duplicate "Room" link here
      { name: "Rate", href: "/dashboard/admin/rate", icon: DollarSign, badge: null },
      { name: "Front desk", href: "/dashboard/admin/frontdesk", icon: UserCheck, badge: null },
    ],
    receptionist: [
      { name: "Dashboard", href: "/dashboard/receptionist", icon: LayoutDashboard, badge: null },
      { name: "Rooms", href: "/dashboard/receptionist/rooms", icon: Bed, badge: null },
      { name: "Bookings", href: "/dashboard/receptionist/bookings", icon: Calendar, badge: null },
      { name: "Dining", href: "/dashboard/receptionist/dining", icon: Utensils, badge: null },
      { name: "Trip Packages", href: "/dashboard/receptionist/trip-packages", icon: Navigation, badge: null },
      { name: "Billing", href: "/dashboard/receptionist/billing", icon: FileText, badge: null },
    ],
  };

  const roleLinks = links[role] || [];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[998] lg:hidden"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[1000] w-64 bg-white text-gray-900 shadow-lg border-r border-gray-200 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-auto`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200">
          <h2 className="text-lg font-bold">Menu</h2>
          <button onClick={() => setSidebarOpen && setSidebarOpen(false)}>
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
              <Bed className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Grand Hotel</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {roleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 mr-3 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <span className="truncate">{link.name}</span>
                    {link.badge && (
                      <span
                        className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-blue-200 text-blue-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 capitalize truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}