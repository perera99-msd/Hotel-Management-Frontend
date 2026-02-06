"use client";

import { auth } from "@/app/lib/firebase";
import { Calendar, CheckCircle, List, LogOut, UserCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import BookingCalendar from "../../../components/bookings/BookingCalendar";
import BookingList from "../../../components/bookings/BookingList";
import ExtendStayModal from "../../../components/bookings/ExtendStayModal";
import NewBookingModal from "../../../components/bookings/NewBookingModal";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";

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
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

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

  const isEditableBooking = (booking: Booking) =>
    booking.status === "Confirmed" || booking.status === "Pending";

  const handleCalendarBookingClick = (booking: Booking) => {
    if (isEditableBooking(booking)) {
      handleEditBooking(booking);
      return;
    }
    setViewingBooking(booking);
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
    if (!confirm("Are you sure you want to cancel this booking?")) return;

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
              onBookingClick={handleCalendarBookingClick}
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

      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity"
            onClick={() => setViewingBooking(null)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
                <p className="text-sm text-gray-500">
                  ID: #{(viewingBooking.id || viewingBooking._id || "").toString().slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">
                    {typeof viewingBooking.guestId === "object" && viewingBooking.guestId !== null
                      ? viewingBooking.guestId.name
                      : "Guest"}
                  </h4>
                  <div className="text-sm text-gray-500 flex flex-col mt-1 space-y-0.5">
                    {typeof viewingBooking.guestId === "object" && viewingBooking.guestId !== null && (
                      <span>{viewingBooking.guestId.email}</span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold border bg-gray-100 text-gray-600 border-gray-200">
                  {viewingBooking.status}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Room</label>
                  <div className="font-semibold text-gray-900 text-base">
                    {typeof viewingBooking.roomId === "object" && viewingBooking.roomId !== null
                      ? viewingBooking.roomId.roomNumber
                      : "-"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Amount</label>
                  <div className="font-semibold text-gray-900 text-base">
                    ${Number(viewingBooking.totalAmount || 0).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Check In</label>
                    <div className="font-semibold text-gray-900">{new Date(viewingBooking.checkIn).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Check Out</label>
                    <div className="font-semibold text-gray-900">{new Date(viewingBooking.checkOut).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-end">
              <button
                onClick={() => setViewingBooking(null)}
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminReceptionistLayout>
  );
}