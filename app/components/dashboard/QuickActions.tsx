"use client";

import React, { useState } from "react";
import { Plus, CheckCircle, Users, Utensils, LucideIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import NewBookingModal from "../../components/bookings/NewBookingModal";

interface Action {
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "success" | "warning";
  onClick?: () => void;
}

interface QuickActionsProps {
  actions?: Action[]; // Allow passing actions from parent
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Determine if we're in admin or receptionist dashboard
  const dashboardRole = pathname.includes('/admin') ? 'admin' : 'receptionist';

  const handleNewBookingClick = () => {
    setIsNewBookingOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewBookingOpen(false);
  };

  const handleCheckInClick = () => {
    router.push(`/dashboard/${dashboardRole}/bookings`);
  };

  const handleRoomManagementClick = () => {
    router.push(`/dashboard/${dashboardRole}/rooms`);
  };

  const handleNewOrderClick = () => {
    router.push(`/dashboard/${dashboardRole}/dining`);
  };

  // Default actions if parent doesn't pass any
  const defaultActions: Action[] = [
    {
      label: "New Booking",
      icon: Plus,
      variant: "primary",
      onClick: handleNewBookingClick,
    },
    {
      label: "Check-In",
      icon: CheckCircle,
      variant: "secondary",
      onClick: handleCheckInClick,
    },
    {
      label: "Room Management",
      icon: Users,
      variant: "success",
      onClick: handleRoomManagementClick,
    },
    {
      label: "New Order",
      icon: Utensils,
      variant: "warning",
      onClick: handleNewOrderClick,
    },
  ];

  const buttonActions = actions ?? defaultActions;

  const getButtonClasses = (variant?: Action["variant"]) => {
    switch (variant) {
      case "primary":
        return "bg-blue-700 hover:bg-blue-800 text-white";
      case "success":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "warning":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "secondary":
      default:
        return "bg-teal-600 hover:bg-teal-700 text-white";
    }
  };

  return (
    <div className="card p-4 bg-white rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {buttonActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`${getButtonClasses(
                action.variant
              )} flex flex-col items-center justify-center w-full h-24 rounded-lg transition-all duration-200 hover:-translate-y-1`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal integration */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={handleCloseModal}
        editingBooking={null}
        onUpdateBooking={() => {
          setIsNewBookingOpen(false);
          // Refresh the page to show updated stats
          window.location.reload();
        }}
      />
    </div>
  );
}
