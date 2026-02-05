// app/dashboard/customer/bookings/page.tsx
"use client";

import { auth } from "@/app/lib/firebase";
import { Calendar, CheckCircle, ChevronDown, Clock, Loader2, Phone, Star, X, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import FeedbackDisplay from "../../../components/feedback/FeedbackDisplay";
import FeedbackForm from "../../../components/feedback/FeedbackForm";
import CustomerLayout from "../../../components/layout/CustomerLayout";

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingFeedback, setBookingFeedback] = useState<any>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
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

  const handleOpenFeedback = async (booking: any) => {
    setSelectedBooking(booking);
    setFeedbackLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      // Fetch existing feedback if any
      const res = await fetch(`${API_URL}/api/feedback/booking/${booking._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const feedback = await res.json();
        setBookingFeedback(feedback);
      } else {
        setBookingFeedback(null);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      setBookingFeedback(null);
    } finally {
      setFeedbackLoading(false);
      setShowFeedbackModal(true);
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
    setSelectedBooking(null);
    setBookingFeedback(null);
  };

  const handleFeedbackSuccess = async () => {
    handleCloseFeedback();
    toast.success(bookingFeedback ? "Feedback updated!" : "Feedback submitted!");
    // Refresh bookings
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/users/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const allBookings = [
          ...(data.bookings || []),
          ...(data.completedBookings || [])
        ].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
        setBookings(allBookings);
      }
    }
  };

  const handleFeedbackDeleted = async () => {
    setBookingFeedback(null);
    toast.success("Feedback deleted!");
  };

  return (
    <CustomerLayout>
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">View and manage your reservations</p>
          </div>
          <Link href="/dashboard/customer/ExploreRooms" className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-xs sm:text-sm flex items-center shadow-sm w-full sm:w-auto justify-center">
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
            <p className="text-sm">No bookings found.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                      const isExpanded = expandedBookingId === booking._id;
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
                        <React.Fragment key={booking._id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <div>
                                  {room ? `Room ${room.roomNumber}` : `Booking #${booking._id.slice(-6)}`}
                                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                                    ID: {booking._id}
                                  </div>
                                  <div className="text-xs text-gray-500 font-normal capitalize">
                                    {room?.type || "Standard Room"}
                                  </div>
                                </div>
                                {booking.shortStay && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 whitespace-nowrap">
                                    Short Stay
                                  </span>
                                )}
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
                              <div className="flex justify-end gap-2 items-center">
                                <button
                                  onClick={() => setExpandedBookingId(isExpanded ? null : booking._id)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="View rate breakdown"
                                >
                                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isCancellable && (
                                  <button
                                    onClick={() => handleCancelClick(booking._id)}
                                    className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                                  >
                                    Cancel
                                  </button>
                                )}
                                {/* ✅ Show "Leave Feedback" button only for Checked Out bookings */}
                                {(booking.status?.toLowerCase() === "checkedout" ||
                                  booking.status?.toLowerCase() === "checked-out") && (
                                    <button
                                      onClick={() => handleOpenFeedback(booking)}
                                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                    >
                                      <Star className="h-3 w-3" />
                                      {bookingFeedback?.bookingId === booking._id ? "Edit Feedback" : "Leave Feedback"}
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                          {/* Rate Breakdown Row */}
                          {isExpanded && booking.rateBreakdown && (
                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="space-y-4">
                                  {/* Monthly Breakdown */}
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Rate Breakdown by Month</h4>
                                    <div className="space-y-2">
                                      {booking.rateBreakdown.monthlyBreakdowns?.map((month: any, idx: number) => (
                                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <p className="font-medium text-gray-900">
                                                {month.monthName} {month.year}
                                              </p>
                                              <p className="text-sm text-gray-600">{month.days} nights</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-semibold text-gray-900">${month.subtotal?.toFixed(2) || '0.00'}</p>
                                              <p className="text-sm text-gray-600">@ ${month.rate?.toFixed(2) || '0.00'}/night</p>
                                            </div>
                                          </div>
                                          {/* Deal Info */}
                                          {month.dealDays && month.dealDays > 0 && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded p-2 mt-2">
                                              <p className="text-xs font-medium text-emerald-900">
                                                {month.dealName}
                                              </p>
                                              <p className="text-xs text-emerald-700">
                                                {month.dealDays} nights @ ${(month.rate - (month.rate * (month.dealDiscount || 0) / 100))?.toFixed(2) || '0.00'}/night
                                                <span className="ml-2 font-semibold">-${month.dealAmount?.toFixed(2) || '0.00'}</span>
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Summary */}
                                  <div className="border-t-2 border-gray-200 pt-3">
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium text-gray-900">${booking.rateBreakdown.subtotal?.toFixed(2) || '0.00'}</span>
                                      </div>
                                      {booking.rateBreakdown.totalDealDiscount > 0 && (
                                        <div className="flex justify-between text-sm bg-emerald-50 border border-emerald-200 rounded p-2">
                                          <span className="text-emerald-700 font-medium">Deal Discount:</span>
                                          <span className="font-semibold text-emerald-700">-${booking.rateBreakdown.totalDealDiscount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-base font-bold bg-blue-100 rounded p-2">
                                        <span className="text-gray-900">Total Amount:</span>
                                        <span className="text-blue-600">${booking.rateBreakdown.total?.toFixed(2) || displayAmount?.toFixed(2) || '0.00'}</span>
                                      </div>
                                      {booking.rateBreakdown.dealApplied && booking.rateBreakdown.dealName && (
                                        <p className="text-xs text-emerald-700 font-medium italic">✓ {booking.rateBreakdown.dealName} applied</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {bookings.map((booking) => {
                const room = typeof booking.roomId === 'object' ? booking.roomId : null;
                const status = getBookingStatus(booking.status);
                const StatusIcon = status.icon;
                const isCancellable = ["confirmed", "pending"].includes(booking.status.toLowerCase());
                const dealInfo = typeof booking.appliedDealId === 'object' ? booking.appliedDealId : null;
                const hasDiscount = booking.appliedDiscount && booking.appliedDiscount > 0;

                const checkIn = new Date(booking.checkIn);
                const checkOut = new Date(booking.checkOut);
                const nights = Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;

                const isCompleted = booking.status?.toLowerCase() === "checkedout" || booking.status?.toLowerCase() === "checked-out";
                const displayAmount = isCompleted && booking.invoiceTotal
                  ? booking.invoiceTotal
                  : (booking.roomTotal || booking.totalAmount || (booking.appliedRate ? booking.appliedRate * nights : (room?.rate ? room.rate * nights : 0)));

                const canLeaveFeedback = isCompleted;
                const isExpanded = expandedBookingId === booking._id;

                return (
                  <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">
                              {room ? `Room ${room.roomNumber}` : `Booking #${booking._id.slice(-6)}`}
                            </h3>
                            {booking.shortStay && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                                Short Stay
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{room?.type || 'Room'}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.text}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Dates */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Check In</p>
                          <p className="font-semibold text-sm text-gray-900">{checkIn.toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">{checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="px-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-500">Check Out</p>
                          <p className="font-semibold text-sm text-gray-900">{checkOut.toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">{checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            {isCompleted ? "Total Paid" : `Amount (${nights} ${nights === 1 ? 'night' : 'nights'})`}
                          </span>
                          <span className="text-lg font-bold text-gray-900">${displayAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                        {hasDiscount && dealInfo && (
                          <p className="text-xs text-emerald-600 font-medium mt-1">💰 {(dealInfo as any).dealName}</p>
                        )}
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking._id)}
                        className="w-full flex items-center justify-center gap-2 text-xs text-blue-600 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-gray-200 space-y-3">
                          {booking.rateBreakdown && (
                            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                              <p className="text-xs font-semibold text-gray-700">Rate Breakdown</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Base Rate ({nights} nights)</span>
                                  <span className="font-medium">${booking.rateBreakdown.baseRate?.toFixed(2) || '0.00'}</span>
                                </div>
                                {booking.rateBreakdown.discountAmount > 0 && (
                                  <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span>-${booking.rateBreakdown.discountAmount?.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold pt-1 border-t border-blue-200">
                                  <span>Total</span>
                                  <span className="text-blue-600">${booking.rateBreakdown.total?.toFixed(2) || displayAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {isCancellable && (
                          <button
                            onClick={() => handleCancelClick(booking._id)}
                            className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Cancel Booking
                          </button>
                        )}
                        {canLeaveFeedback && (
                          <button
                            onClick={() => handleOpenFeedback(booking)}
                            className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Star className="h-4 w-4" />
                            Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ✅ Feedback Form/Display Modal */}
        {showFeedbackModal && selectedBooking && (
          feedbackLoading ? (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-2xl">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </div>
          ) : bookingFeedback ? (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Your Feedback</h2>
                  <button
                    onClick={handleCloseFeedback}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  <FeedbackDisplay
                    feedback={bookingFeedback}
                    canEdit={true}
                    canDelete={true}
                    onEdit={() => {
                      setBookingFeedback(null);
                      // This will trigger showing the form
                    }}
                    onDelete={handleFeedbackDeleted}
                  />
                  {bookingFeedback.isEdited && (
                    <button
                      onClick={() => {
                        setBookingFeedback(null);
                      }}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <FeedbackForm
              bookingId={selectedBooking._id}
              onSuccess={handleFeedbackSuccess}
              onCancel={handleCloseFeedback}
            />
          )
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