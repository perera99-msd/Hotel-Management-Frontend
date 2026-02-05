"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/context/NotificationContext"; // Import the Notification Hook
import { auth } from "@/app/lib/firebase";
import { signOut } from "firebase/auth";
import { Bell, Check, LogOut, Menu, Trash2, X } from "lucide-react"; // Added X and Check icons
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react"; // Added for dropdown state

interface HeaderProps {
  dashboardType?: "customer" | "admin" | "receptionist";
  onSidebarToggle?: () => void;
}

export default function Header({
  dashboardType,
  onSidebarToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useAuth();

  // --- Notification Logic Start ---
  const { notifications, unreadCount, markAsRead, deleteNotification, clearOldNotifications } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  // --- Notification Logic End ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const titleMap: Record<string, string> = {
    "/dashboard/admin": "Dashboard",
    "/dashboard/admin/rooms": "Room Management",
    "/dashboard/admin/bookings": "Bookings & Reservations",
    "/dashboard/admin/dining": "Dining & Menu",
    "/dashboard/admin/trip-packages": "Hotel Management",
    "/dashboard/admin/inventory": "Inventory Management",
    "/dashboard/admin/billing": "Billing",
    "/dashboard/admin/reports": "Reports & Analytics",
    "/dashboard/admin/settings": "Settings",
    "/dashboard/receptionist": "Dashboard",
    "/dashboard/receptionist/rooms": "Room Management",
    "/dashboard/receptionist/bookings": "Bookings & Reservations",
    "/dashboard/receptionist/dining": "Dining & Menu",
    "/dashboard/receptionist/trip-packages": "Hotel Management",
    "/dashboard/receptionist/billing": "Billing",
  };

  const title = titleMap[pathname] || "Hotel Management";

  const displayName = profile?.name || user?.displayName || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const wrapperClasses =
    dashboardType === "customer"
      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 border-b border-white/20 px-4 py-3 md:px-6 md:py-4 md:bg-white md:border-gray-200"
      : "bg-white border-b border-gray-200 px-6 py-4 lg:py-6";

  const isStaffDashboard = dashboardType !== "customer";

  return (
    <header className={wrapperClasses}>
      <div className="flex items-center justify-between">

        {/* Left side: Title or Logo */}
        <div className="flex items-center gap-4">
          {dashboardType !== "customer" && (
            <button
              onClick={onSidebarToggle}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
          )}

          {dashboardType === "customer" ? (
            <Link href="/dashboard/customer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {/* Desktop Logo */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
                  <span className="text-white font-bold text-sm">HM</span>
                </div>
                <span className="text-xl font-bold text-white">
                  Grand Hotel
                </span>
              </div>
              {/* Mobile Hotel Name */}
              <div className="md:hidden">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
                    <span className="text-white font-bold text-xs">HM</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block leading-tight">Grand Hotel</span>
                    <span className="text-[10px] text-white/80 leading-tight">Luxury Experience</span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-gray-700">{title}</h1>
              <p className="text-sm text-gray-500">Welcome back, {displayName.split(' ')[0]}</p>
            </div>
          )}
        </div>

        {/* Right side: Notifications & Profile/Logout */}
        <div className="flex items-center space-x-4">

          {/* --- NOTIFICATION DROPDOWN START --- */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className={`relative p-2 md:p-3 rounded-xl transition-all group outline-none ${dashboardType === "customer"
                ? "hover:bg-white/20 md:hover:bg-gray-100"
                : "hover:bg-gray-100"
                }`}
            >
              <Bell className={`h-5 w-5 ${dashboardType === "customer"
                ? "text-white md:text-gray-600"
                : "text-gray-600"
                } ${showNotifDropdown ? (dashboardType === "customer" ? "md:text-blue-600" : "text-blue-600") : ""} group-hover:scale-110 transition-transform`} />

              {/* Real-time Red Dot */}
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotifDropdown && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifDropdown(false)}
                />

                <div className="fixed top-16 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:top-auto md:absolute md:right-0 md:mt-3 w-screen md:w-96 max-w-[calc(100vw-2rem)] md:max-w-none mx-auto md:mx-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-700">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {unreadCount} New
                        </span>
                      )}
                      <button onClick={() => setShowNotifDropdown(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Bell className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            // Optional: Close dropdown on click? 
                            // setShowNotifDropdown(false);
                          }}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3
                                ${!notif.read ? 'bg-blue-50/40' : 'bg-white'}
                            `}
                        >
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />

                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-0.5">
                              <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>
                                {notif.title}
                              </p>
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {/* Format timestamp safely */}
                                  {notif.createdAt?.seconds
                                    ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Just now'
                                  }
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                  className="text-gray-300 hover:text-gray-500 transition-colors"
                                  title="Delete notification"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => notifications.forEach(n => markAsRead(n.id))}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                        >
                          <Check size={12} /> Mark all as read
                        </button>
                        {isStaffDashboard && (
                          <button
                            onClick={() => clearOldNotifications(30)}
                            className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center justify-center gap-1"
                            title="Remove notifications older than 30 days"
                          >
                            <Trash2 size={12} /> Clear old
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {/* --- NOTIFICATION DROPDOWN END --- */}

          {dashboardType === "customer" ? (
            // Customer Dashboard - Profile Icon for Mobile
            <div className="flex items-center gap-2">
              {/* Mobile: Just Profile Icon */}
              <Link href="/dashboard/customer/Profile" className="md:hidden">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all">
                  <span className="text-white text-sm font-bold">{initials}</span>
                </div>
              </Link>
              {/* Desktop: Full Profile Section with Logout */}
              <div className="hidden md:flex items-center space-x-3 bg-gray-100 rounded-xl p-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">View Profile</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ) : (
            // Admin/Receptionist - Keep Original
            <div className="flex items-center space-x-3 bg-gray-100 rounded-xl p-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{initials}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">View Profile</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
                title="Logout"
              >
                <LogOut className="h-4 w-4 text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}