"use client";

import { useState, useEffect, useCallback } from "react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import NewBookingModal from "../../../components/bookings/NewBookingModal";
import ExtendStayModal from "../../../components/bookings/ExtendStayModal";
import BookingCalendar from "../../../components/bookings/BookingCalendar";
import BookingList from "../../../components/bookings/BookingList";
import {
  Calendar,
  CheckCircle,
  UserCheck,
  Users,
  LogOut,
  List,
} from "lucide-react";
import { auth } from "@/app/lib/firebase";
import toast from "react-hot-toast";

// Matches Backend Response Structure
export interface Booking {
  id: string;
  _id?: string;
  guestId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  } | string;
  roomId: {
    _id: string;
    roomNumber: string;
    type: string;
    rate: number;
  } | string;
  checkIn: string;
  checkOut: string;
  status: 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
  source: string;
  totalAmount: number;
}

export default function Bookings() {
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  
  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [extendStayBooking, setExtendStayBooking] = useState<Booking | null>(null);

  // --- 1. FETCH BOOKINGS ---
  const fetchBookings = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Map _id to id for frontend compatibility
        const mappedData = data.map((b: any) => ({
          ...b,
          id: b._id, 
        }));
        setBookings(mappedData);
      } else {
        console.error("Failed to load bookings");
        toast.error("Failed to load bookings");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchBookings();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchBookings]);

  // --- 2. STATS CALCULATION ---
  const getBookingStats = () => {
    const today = new Date();
    
    // Helper to check if dates match (ignoring time)
    const isSameDate = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() && 
      d1.getMonth() === d2.getMonth() && 
      d1.getFullYear() === d2.getFullYear();

    const todayCheckIns = bookings.filter((b) => {
      const checkIn = new Date(b.checkIn);
      // Count if check-in is today (regardless of status, though usually Pending/Confirmed)
      return isSameDate(checkIn, today);
    }).length;

    const todayCheckOuts = bookings.filter((b) => {
      const checkOut = new Date(b.checkOut);
      return isSameDate(checkOut, today);
    }).length;

    const confirmedBookings = bookings.filter(
      (b) => b.status === "Confirmed"
    ).length;
    const checkedInBookings = bookings.filter(
      (b) => b.status === "CheckedIn"
    ).length;

    return {
      total: bookings.length,
      confirmed: confirmedBookings,
      checkedIn: checkedInBookings,
      todayCheckIns,
      todayCheckOuts,
    };
  };

  const stats = getBookingStats();

  // --- 3. HANDLERS ---

  // Handle edit booking - opens modal with existing booking data
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsNewBookingOpen(true);
  };

  // Called when Modal saves successfully (Create or Update)
  const handleUpdateSuccess = () => {
    fetchBookings(); 
    setIsNewBookingOpen(false);
    setEditingBooking(null);
  };

  // Check In Handler (API)
  const handleCheckIn = async (booking: Booking) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${API_URL}/api/bookings/${booking.id}/checkin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Guest Checked In");
        fetchBookings();
      } else {
        const err = await res.json();
        toast.error(err.error || "Check-in failed");
      }
    } catch (e) { console.error(e); }
  };

  // Check Out Handler (API)
  const handleCheckOut = async (booking: Booking) => {
    try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  
        const res = await fetch(`${API_URL}/api/bookings/${booking.id}/checkout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
  
        if (res.ok) {
          toast.success("Guest Checked Out");
          fetchBookings();
        } else {
          const err = await res.json();
          toast.error(err.error || "Check-out failed");
        }
      } catch (e) { console.error(e); }
  };

  // Cancel Handler (API)
  const handleCancelBooking = async (booking: Booking) => {
    if(!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  
        const res = await fetch(`${API_URL}/api/bookings/${booking.id}`, {
          method: "DELETE", 
          headers: { Authorization: `Bearer ${token}` }
        });
  
        if (res.ok) {
          toast.success("Booking Cancelled");
          fetchBookings();
        } else {
          toast.error("Cancellation failed");
        }
      } catch (e) { console.error(e); }
  };

  const handleExtendStay = (booking: Booking) => {
    setExtendStayBooking(booking);
  };

  // Helper functions that were missing
  const handleNewBookingClick = () => {
    setEditingBooking(null);
    setIsNewBookingOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewBookingOpen(false);
    setEditingBooking(null);
  };

  const handleDateClick = (date: Date) => {
    // Handle date click - could open new booking modal for that date
    handleNewBookingClick();
  };

  const handleBookingClick = (booking: Booking) => {
    handleEditBooking(booking);
  };

  return (
    <AdminReceptionistLayout>
      <div className="p-8 min-h-screen bg-gray-50">
        {/* Header with View Toggle and New Booking Button */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bookings & Reservations
            </h1>
            <p className="text-gray-600">
              Manage guest reservations and check-ins
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Toggle Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === "calendar"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="Calendar View"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleNewBookingClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              New Booking
            </button>
          </div>
        </div>

        {/* 5 Cards Section (Preserved UI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Card 1 - Total Bookings */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>

          {/* Card 2 - Confirmed */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.confirmed}
            </div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>

          {/* Card 3 - Checked-in */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.checkedIn}
            </div>
            <div className="text-sm text-gray-600">Checked-in</div>
          </div>

          {/* Card 4 - Today's Check-ins */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.todayCheckIns}
            </div>
            <div className="text-sm text-gray-600">Today's Check-ins</div>
          </div>

          {/* Card 5 - Today's Check-outs */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.todayCheckOuts}
            </div>
            <div className="text-sm text-gray-600">Today's Check-outs</div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="max-w-8xl mx-auto">
          {loading ? (
             <div className="text-center py-12">Loading...</div>
          ) : viewMode === "calendar" ? (
            <BookingCalendar
              bookings={bookings}
              onDateClick={handleDateClick}
              onBookingClick={handleBookingClick}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Booking List
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Showing {bookings.length} bookings
                  </p>
                </div>
              </div>
              <BookingList
                bookings={bookings}
                onEdit={handleEditBooking}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onCancel={handleCancelBooking}
                onExtend={handleExtendStay}
              />
            </div>
          )}
        </div>
      </div>

      {/* New Booking Modal (Backend Integrated) */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={handleCloseModal}
        editingBooking={editingBooking}
        onUpdateBooking={handleUpdateSuccess}
      />

      <ExtendStayModal
        isOpen={!!extendStayBooking}
        onClose={() => setExtendStayBooking(null)}
        booking={extendStayBooking}
        onExtendSuccess={fetchBookings}
      />
    </AdminReceptionistLayout>
  );
}