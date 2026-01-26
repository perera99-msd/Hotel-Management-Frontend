"use client";

import { useState, useEffect, useCallback } from "react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import NewBookingModal from "../../../components/bookings/NewBookingModal";
import ExtendStayModal from "../../../components/bookings/ExtendStayModal";
import BookingCalendar from "../../../components/bookings/BookingCalendar";
import BookingList from "../../../components/bookings/BookingList";
import { Calendar, CheckCircle, UserCheck, LogOut, List } from "lucide-react";
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

export default function BookingsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  
  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [extendStayBooking, setExtendStayBooking] = useState<Booking | null>(null);

  // Fetch Bookings Wrapped in useCallback to use in dependencies
  const fetchBookings = useCallback(async () => {
    try {
      // Don't set loading true if it's a background refresh, but fine for now
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Fetch invoice status for each booking
        const invoicesRes = await fetch(`${API_URL}/api/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
        
        // Map _id to id for frontend compatibility and attach invoice status
        const mappedData = data.map((b: any) => {
          const invoice = invoices.find((inv: any) => 
            (inv.bookingId?._id || inv.bookingId)?.toString() === b._id?.toString()
          );
          return {
            ...b,
            id: b._id,
            invoiceStatus: invoice?.status
          };
        });
        setBookings(mappedData);
      } else {
        console.error("Failed to load bookings");
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

  // Stats Logic
  const stats = {
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => b.status === 'Confirmed' || b.status === 'CheckedIn').length,
    todayCheckIns: bookings.filter(b => {
      const d = new Date(b.checkIn);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length,
    todayCheckOuts: bookings.filter(b => {
      const d = new Date(b.checkOut);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length,
  };

  // Actions
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
          toast.success("Guest Checked Out Successfully");
          // Refetch bookings immediately, then again after small delay to ensure all updates propagate
          await fetchBookings();
          setTimeout(() => fetchBookings(), 800);
        } else {
          const errText = await res.text();
          try {
            const err = JSON.parse(errText);
            toast.error(err.error || `Check-out failed: ${res.status}`);
          } catch {
            toast.error(`Check-out failed: ${res.status} ${res.statusText}`);
          }
        }
      } catch (e) { 
        console.error("Checkout error:", e); 
        toast.error("Check-out error - please try again"); 
      }
  };

  const handleEditBooking = (booking: Booking) => {
    // Pass the full booking object including populated fields
    setEditingBooking(booking);
    setIsNewBookingOpen(true);
  };

  // Called when Modal saves successfully
  const handleUpdateSuccess = () => {
    fetchBookings(); 
    setIsNewBookingOpen(false);
    setEditingBooking(null);
  };

  const handleCloseModal = () => {
    setIsNewBookingOpen(false);
    setEditingBooking(null);
  };

  const handleCancelBooking = async (booking: Booking) => {
    if(!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  
        const res = await fetch(`${API_URL}/api/bookings/${booking.id}`, {
          method: "DELETE", // Or PUT { status: 'Cancelled' } depending on backend
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

  return (
    <AdminReceptionistLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-500">Manage hotel reservations and guests</p>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Calendar className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            New Booking
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Total Bookings</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">All time</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Active</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeBookings}</div>
            <div className="text-sm text-gray-600">Current guests</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Check-ins</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.todayCheckIns}</div>
            <div className="text-sm text-gray-600">Today's arrivals</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Check-outs</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.todayCheckOuts}</div>
            <div className="text-sm text-gray-600">Today's departures</div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="max-w-8xl mx-auto">
          {loading ? (
             <div className="text-center py-12">Loading...</div>
          ) : viewMode === 'calendar' ? (
            <BookingCalendar
              bookings={bookings}
              onBookingClick={handleEditBooking}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Booking List</h2>
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