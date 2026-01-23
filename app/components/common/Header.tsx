"use client";

import { useState } from "react"; // Added for dropdown state
import { Bell, LogOut, Menu, X, Check, Trash2 } from "lucide-react"; // Added X and Check icons
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/context/NotificationContext"; // Import the Notification Hook

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
      ? "bg-white border-b border-gray-200 px-6 py-4"
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
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">HM</span>
               </div>
               <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                HotelManager
               </span>
            </div>
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
              className="relative p-3 rounded-xl hover:bg-gray-100 transition-colors group outline-none"
            >
              <Bell className={`h-5 w-5 ${showNotifDropdown ? 'text-blue-600' : 'text-gray-600'} group-hover:text-blue-600`} />
              
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
                
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                                          ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })
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

          <div className="flex items-center space-x-3 bg-gray-100 rounded-xl p-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{initials}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">View Profile</p>
            </div>
            {/* LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}