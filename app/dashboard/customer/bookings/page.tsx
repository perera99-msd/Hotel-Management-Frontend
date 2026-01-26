// app/dashboard/customer/bookings/page.tsx
"use client";

import { useState, useEffect, useContext } from "react";
import CustomerLayout from "../../../components/layout/CustomerLayout";
import { auth } from "@/app/lib/firebase";
import Link from "next/link";
import { Calendar, CheckCircle, Clock, Phone, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Helper for consistent status styling
const getBookingStatus = (status: string) => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "confirmed":
      return {
        text: "Confirmed",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      };
    case "pending":
      return {
        text: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      };
    case "checkedout":
    case "checked-out":
      return {
        text: "Completed",
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      };
    case "checkedin":
    case "checked-in":
      return {
        text: "Checked In",
        color: "bg-purple-100 text-purple-800",
        icon: CheckCircle,
      };
    case "cancelled":
      return {
        text: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      };
    default:
      return {
        text: status,
        color: "bg-gray-100 text-gray-800",
        icon: Calendar,
      };
  }
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        // Fetch from dashboard endpoint which includes invoice totals
        const response = await fetch(`${API_URL}/api/users/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Combine active and completed bookings
          const allBookings = [
            ...(data.bookings || []),
            ...(data.completedBookings || [])
          ].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
          
          setBookings(allBookings);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
       if (user) fetchBookings();
    });
    return () => unsubscribe();
  }, []);

  const handleCancelClick = (bookingId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-gray-800">Request Cancellation</span>
        <span className="text-sm text-gray-600">
          Please call reception to cancel this booking:
        </span>
        <a href="tel:+94112345678" className="flex items-center gap-2 text-blue-600 font-bold mt-1">
          <Phone className="h-4 w-4" />
          +94 11 234 5678
        </a>
      </div>
    ), {
      duration: 6000,
      icon: 'ℹ️',
      style: {
        border: '1px solid #3b82f6',
        padding: '16px',
        color: '#1f2937',
      },
    });
  };

  return (
    <CustomerLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <Link href="/dashboard/customer/ExploreRooms" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center shadow-sm">
                <PlusIcon className="w-4 h-4 mr-2" /> New Booking
            </Link>
        </div>

        {loading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
             </div>
        ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No bookings found.</p>
            </div>
        ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => {
                                const room = typeof booking.roomId === 'object' ? booking.roomId : null;
                                const status = getBookingStatus(booking.status);
                                const StatusIcon = status.icon;
                                const isCancellable = ["confirmed", "pending"].includes(booking.status.toLowerCase());
                                
                                // Check if deal was applied
                                const dealInfo = typeof booking.appliedDealId === 'object' ? booking.appliedDealId : null;
                                const hasDiscount = booking.appliedDiscount && booking.appliedDiscount > 0;
                                
                                // Calculate price
                                const checkIn = new Date(booking.checkIn);
                                const checkOut = new Date(booking.checkOut);
                                const nights = Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                                
                                // Use appliedRate if available, otherwise use booking total or calculate from room rate
                                const isCompleted = booking.status?.toLowerCase() === "checkedout" || 
                                                   booking.status?.toLowerCase() === "checked-out";
                                const displayAmount = isCompleted && booking.invoiceTotal 
                                  ? booking.invoiceTotal 
                                  : (booking.roomTotal || booking.totalAmount || (booking.appliedRate ? booking.appliedRate * nights : (room?.rate ? room.rate * nights : 0)));

                                return (
                                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {room ? `Room ${room.roomNumber}` : `Booking #${booking._id.slice(-6)}`}
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                                                ID: {booking._id}
                                            </div>
                                            <div className="text-xs text-gray-500 font-normal capitalize">
                                                {room?.type || "Standard Room"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(booking.checkIn).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(booking.checkOut).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {isCompleted && booking.invoiceTotal ? (
                                              <div>
                                                <div className="text-xs text-gray-500 font-normal">Total Paid</div>
                                                <div>${displayAmount.toFixed(2)}</div>
                                                {hasDiscount && dealInfo && (
                                                  <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                                    {dealInfo.dealName} ({booking.appliedDiscount}% off)
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <div>
                                                <div>${displayAmount.toFixed(2)}</div>
                                                {hasDiscount && dealInfo && (
                                                  <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                                    💰 {dealInfo.dealName}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                <StatusIcon className="h-3 w-3 mr-1.5" />
                                                {status.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {isCancellable && (
                                                <button 
                                                    onClick={() => handleCancelClick(booking._id)}
                                                    className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </CustomerLayout>
  );
}

function PlusIcon(props: any) {
    return (
        <svg 
            {...props}
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}