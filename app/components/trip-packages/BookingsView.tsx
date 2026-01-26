"use client";

import { useEffect, useState } from "react";
import { auth } from "@/app/lib/firebase";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, CheckCheck } from "lucide-react";

export default function BookingsView() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchBookings = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/trips/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (tripId: string, booking: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Check if booking is checked-in
      const bookingStatus = booking.bookingId?.status;
      if (bookingStatus !== 'CheckedIn') {
        toast.error('Trip can only be confirmed after booking is checked-in');
        return;
      }

      const res = await fetch(`${API_URL}/api/trips/requests/${tripId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Confirmed' })
      });

      if (res.ok) {
        toast.success('Trip confirmed successfully');
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to confirm trip');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to confirm trip');
    }
  };

  const handleCancel = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel this trip request?')) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/trips/requests/${tripId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responseNotes: 'Cancelled by admin' })
      });

      if (res.ok) {
        toast.success('Trip cancelled successfully');
        fetchBookings();
      } else {
        toast.error('Failed to cancel trip');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel trip');
    }
  };

  const handleMarkComplete = async (tripId: string, tripDate: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/trips/requests/${tripId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Completed' })
      });

      if (res.ok) {
        toast.success('Trip marked as completed');
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to mark trip as completed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark trip as completed');
    }
  };

  useEffect(() => {
    fetchBookings();
    
    // Listen for refresh events (from parent modal add)
    const handleRefresh = () => fetchBookings();
    window.addEventListener("refreshTripBookings", handleRefresh);
    return () => window.removeEventListener("refreshTripBookings", handleRefresh);
  }, []);

  // Hide completed trip requests for checked-out bookings
  const visibleBookings = bookings.filter((b) => {
    const bookingStatus = b.bookingId?.status;
    const isTripCompleted = b.status === 'Completed';
    const isBookingCheckedOut = bookingStatus === 'CheckedOut';
    return !(isTripCompleted && isBookingCheckedOut);
  });

  // Calculate Real Stats from visible set
  const total = visibleBookings.length;
  const pending = visibleBookings.filter(b => b.status === 'Pending' || b.status === 'Requested').length;
  const confirmed = visibleBookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved').length;
  const completed = visibleBookings.filter(b => b.status === 'Completed').length;

  const stats = [
    { label: "Total Bookings", value: total.toString() },
    { label: "Pending", value: pending.toString() },
    { label: "Confirmed", value: confirmed.toString() },
    { label: "Completed", value: completed.toString() }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
      case "Requested":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if(loading) return <div className="p-8 text-center text-gray-500">Loading bookings...</div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Trip Bookings</h3>
        {visibleBookings.length === 0 ? (
             <div className="p-6 border border-dashed rounded-lg text-center text-gray-500 bg-gray-50">
                 No bookings found.
             </div>
        ) : (
          visibleBookings.map((booking) => {
                const canConfirm = ['Pending', 'Requested', 'Approved'].includes(booking.status);
                const canCancel = !['Cancelled', 'Completed', 'Confirmed', 'Approved'].includes(booking.status);
                const canComplete = booking.status === 'Confirmed' || booking.status === 'Approved';
                const bookingStatus = booking.bookingId?.status;
                
                // Check if trip date is in the past
                const tripDate = new Date(booking.tripDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                tripDate.setHours(0, 0, 0, 0);
                const isDatePassed = tripDate <= today;
                
                return (
            <div key={booking._id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                        {booking.packageName || "Custom Trip"} 
                        {booking.packageId?.name && ` - ${booking.packageId.name}`}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium text-gray-900">{booking.requestedBy?.name}</span> • 
                        {booking.location || booking.packageId?.location} • 
                        {booking.participants} participant{booking.participants > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Date: {booking.tripDate ? format(new Date(booking.tripDate), 'PPP') : 'Date not set'}
                    </p>
                    {bookingStatus && (
                        <p className="text-xs text-gray-400 mt-1">
                            Booking Status: <span className="font-medium">{bookingStatus}</span>
                        </p>
                    )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                    </span>
                    <div className="text-lg font-bold text-gray-900">
                        ${booking.totalPrice?.toLocaleString()}
                    </div>
                    <div className="flex gap-2 mt-2">
                        {canConfirm && (
                            <button
                                onClick={() => handleConfirm(booking._id, booking)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                                title={bookingStatus !== 'CheckedIn' ? 'Booking must be checked-in first' : 'Confirm trip'}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Confirm
                            </button>
                        )}
                        {canComplete && (
                            <button
                                onClick={() => handleMarkComplete(booking._id, booking.tripDate)}
                                disabled={!isDatePassed}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                    isDatePassed 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                title={!isDatePassed ? `Trip date must be past (Trip: ${format(new Date(booking.tripDate), 'MMM d')})` : 'Mark trip as completed'}
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Complete
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => handleCancel(booking._id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
                </div>
            </div>
                );
            })
        )}
      </div>
    </div>
  );
}