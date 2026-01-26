// app/dashboard/customer/page.tsx
"use client";

import { useState, useEffect, useContext } from "react";
import CustomerLayout from "../../components/layout/CustomerLayout";
import { Calendar, CheckCircle, Clock, Plus, Bed, Loader2, Phone, XCircle, ArrowRight } from "lucide-react";
import { AuthContext } from "@/app/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  rate: number;
}

interface Booking {
  _id: string;
  roomId: Room | string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount?: number; // Optional to handle cases where it's missing
  invoiceTotal?: number; // Added for completed bookings
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  roomNumber?: string;
  createdAt: string;
}

interface TripRequest {
  _id: string;
  packageName?: string;
  location?: string;
  status: string;
  tripDate?: string;
  participants?: number;
}

          {/* Active Orders */}
// Helper functions
const getBookingStatus = (status: string) => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "confirmed":
      return {
        text: "Confirmed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      };
    case "pending":
      return {
        text: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      };
    case "checkedout":
    case "checked-out":
      return {
        text: "Completed",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle,
      };
    case "checkedin":
    case "checked-in":
      return {
        text: "Checked In",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: CheckCircle,
      };
    case "cancelled":
      return {
        text: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      };
    default:
      return {
        text: status,
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Calendar,
      };
  }
};

const getRoomTypeIcon = (type: string) => {
  const normalized = type?.toLowerCase() || "";
  if (normalized.includes("suite") || normalized.includes("deluxe")) {
    return <Calendar className="h-4 w-4 text-blue-600" />;
  }
  return <Bed className="h-4 w-4 text-blue-600" />;
};

export default function CustomerDashboard() {
  const { user, profile, token } = useContext(AuthContext);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBookings = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard Data:', {
          activeBookings: data.bookings?.length,
          completedBookings: data.completedBookings?.length,
          completedSample: data.completedBookings?.[0]
        });
        setBookings(data.bookings || []);
        setCompletedBookings(data.completedBookings || []);
        setOrders(data.orders || []);
        setTripRequests(data.tripRequests || []);
      } else {
        console.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/deals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const today = new Date();
      const active = data.filter((d: any) => {
        const start = new Date(d.startDate);
        const end = new Date(d.endDate);
        const statusOk = ['Ongoing', 'New', 'Inactive', 'Full'].includes(d.status);
        return statusOk && start <= today && end >= today;
      });
      setDeals(active);
    } catch (err) {
      console.error('Failed to load deals', err);
    }
  };

  const fetchOrders = async () => {
    // This function is now handled by fetchBookings
  };

  const fetchTrips = async () => {
    // This function is now handled by fetchBookings
  };

  useEffect(() => {
    fetchBookings();
    fetchDeals();
  }, [token]);

  // Calculate Real Stats from fetched data
  const completedStays = completedBookings.length;

  const upcomingStays = bookings.length;

  const handleCancelClick = (bookingId: string) => {
    // UX: Display Reception Number instead of direct cancellation
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

  const handleReceptionContactClick = () => {
    toast((t) => (
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-gray-800">Contact Reception</span>
        <span className="text-sm text-gray-600">
          Please call reception to apply a deal:
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

  const activeOrders = orders.filter((o) => o.status !== 'Cancelled' && o.status !== 'Completed');
  const activeTrips = tripRequests.filter((t) => t.status !== 'Cancelled' && t.status !== 'Rejected');

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {profile?.name || user?.displayName || "Guest"}!
            </h2>
            <p className="text-blue-100">
              Manage your bookings and explore our services
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {bookings.length}
              </div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {completedStays}
              </div>
              <div className="text-sm text-gray-600">Completed Stays</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{upcomingStays}</div>
              <div className="text-sm text-gray-600">Active & Upcoming</div>
            </div>
          </div>

          {/* Current Deals */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Current Deals</h3>
                <p className="text-sm text-gray-600">To apply a deal, please contact reception.</p>
              </div>
              <button
                onClick={handleReceptionContactClick}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call Reception
              </button>
            </div>
            {deals.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p>No active deals at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.map((deal) => {
                  const statusColors: Record<string, string> = {
                    Ongoing: "bg-green-100 text-green-800 border-green-200",
                    New: "bg-blue-100 text-blue-800 border-blue-200",
                    Inactive: "bg-gray-100 text-gray-800 border-gray-200",
                    Full: "bg-yellow-100 text-yellow-800 border-yellow-200",
                  };
                  const start = deal.startDate ? new Date(deal.startDate) : null;
                  const end = deal.endDate ? new Date(deal.endDate) : null;

                  return (
                    <div
                      key={deal._id || deal.referenceNumber || deal.dealName}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <h4 className="font-semibold text-gray-900">{deal.dealName}</h4>
                          <p className="text-xs text-gray-500">
                            Valid {start ? start.toLocaleDateString() : "-"} - {end ? end.toLocaleDateString() : "-"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Rooms: {Array.isArray(deal.roomType)
                              ? (deal.roomType.length ? deal.roomType.join(', ') : 'All types')
                              : (deal.roomType || 'All types')}
                          </p>
                          <div className="bg-emerald-50 border border-emerald-200 rounded p-2 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 font-bold text-lg">{deal.discount}%</span>
                              <div>
                                <p className="text-xs font-semibold text-emerald-900">Discount on monthly rate</p>
                                <p className="text-xs text-emerald-700">Applied automatically during booking</p>
                              </div>
                            </div>
                          </div>
                          {deal.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-2">{deal.description}</p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                            statusColors[deal.status] || "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          {deal.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Bookings
              </h3>
              <Link
                href="/dashboard/customer/ExploreRooms"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Link>
            </div>
            <div className="space-y-4">
              {bookings.length === 0 && completedBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No bookings yet. Create your first booking!</p>
                </div>
              ) : (
                // Combine active and completed bookings, sort by check-in date (most recent first)
                [...bookings, ...completedBookings]
                  .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
                  .slice(0, 5)
                  .map((booking) => {
                  const room = typeof booking.roomId === 'object' ? (booking.roomId as unknown as Room) : null;
                  const status = getBookingStatus(booking.status);
                  const StatusIcon = status.icon;
                  const isCancellable = ["confirmed", "pending"].includes(booking.status.toLowerCase());

                  // Check for deal info
                  const dealInfo = typeof booking.appliedDealId === 'object' ? booking.appliedDealId : null;
                  const hasDiscount = booking.appliedDiscount && booking.appliedDiscount > 0;

                  // Calculate Price Logic
                  const checkIn = new Date(booking.checkIn);
                  const checkOut = new Date(booking.checkOut);
                  const nights = Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                  
                  // For completed bookings, use invoice total; otherwise use appliedRate or calculate
                  const isCompleted = booking.status.toLowerCase() === "checkedout" || booking.status.toLowerCase() === "checked-out";
                  
                  let displayAmount = 0;
                  if (isCompleted) {
                    // Use invoice total for completed bookings
                    displayAmount = booking.invoiceTotal || 0;
                    console.log('💰 Completed Booking:', {
                      id: booking._id.slice(-6),
                      status: booking.status,
                      invoiceTotal: booking.invoiceTotal,
                      displayAmount
                    });
                  } else {
                    // Use roomTotal if available, otherwise calculate from appliedRate or room rate
                    displayAmount = booking.roomTotal || booking.totalAmount || (booking.appliedRate ? booking.appliedRate * nights : (room?.rate ? room.rate * nights : 0));
                  }

                  return (
                    <div
                      key={booking._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left Side: Room Info */}
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                            {getRoomTypeIcon(room?.type || "standard")}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {room
                                ? `Room ${room.roomNumber}`
                                : `Booking #${booking._id.slice(-6)}`}
                              <span className="ml-2 text-xs text-gray-400 font-normal">#{booking._id}</span>
                            </h4>
                            <p className="text-sm text-gray-500 mt-1 flex items-center">
                              <span className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</span>
                              <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                              <span className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Right Side: Status, Price & Actions */}
                        <div className="flex flex-row items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 mt-2 sm:mt-0">
                           
                           {/* Status Badge */}
                           <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}
                            >
                              <StatusIcon className="h-3 w-3 mr-1.5" />
                              {status.text}
                            </span>

                            {/* Price - Show "Total Paid" label for completed bookings */}
                            {displayAmount > 0 && (
                                <div className="text-right">
                                  {isCompleted && <div className="text-xs text-gray-500">Total Paid</div>}
                                  <div className="text-sm font-bold text-gray-900">
                                    ${displayAmount.toFixed(2)}
                                  </div>
                                  {hasDiscount && dealInfo && (
                                    <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                      💰 {(dealInfo as any).dealName}
                                    </div>
                                  )}
                                </div>
                            )}

                          {/* Cancel Button */}
                          {isCancellable && (
                                <button
                                    onClick={() => handleCancelClick(booking._id)}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-red-100 ml-2"
                                    title="Cancel Booking"
                                >
                                    Cancel
                                </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Completed Bookings Section */}
          {completedBookings.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Completed Bookings
                </h3>
              </div>
              <div className="space-y-4">
                {completedBookings.slice(0, 5).map((booking) => {
                  const room = typeof booking.roomId === 'object' ? (booking.roomId as unknown as Room) : null;
                  const status = getBookingStatus(booking.status);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div
                      key={booking._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left Side: Room Info */}
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                            {getRoomTypeIcon(room?.type || "standard")}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {room
                                ? `Room ${room.roomNumber}`
                                : `Booking #${booking._id.slice(-6)}`}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1 flex items-center">
                              <span className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</span>
                              <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                              <span className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Right Side: Status & Total Paid */}
                        <div className="flex flex-row items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 mt-2 sm:mt-0">
                           {/* Status Badge */}
                           <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}
                            >
                              <StatusIcon className="h-3 w-3 mr-1.5" />
                              {status.text}
                            </span>

                            {/* Total Paid from Invoice */}
                            {booking.invoiceTotal && booking.invoiceTotal > 0 && (
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">Total Paid</div>
                                  <div className="text-sm font-bold text-gray-900">
                                    ${booking.invoiceTotal.toFixed(2)}
                                  </div>
                                </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Active Orders
              </h3>
              <div className="space-y-3">
                {activeOrders.map((order) => {
                  const statusColors: Record<string, string> = {
                    Preparing: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    Ready: "bg-green-100 text-green-800 border-green-200",
                    Served: "bg-blue-100 text-blue-800 border-blue-200",
                  };
                  
                  return (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Order #{order._id.slice(-6)}
                            {order.roomNumber && (
                              <span className="ml-2 text-sm text-gray-500">
                                Room {order.roomNumber}
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                              statusColors[order.status] || "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {order.status}
                          </span>
                          <p className="text-sm font-bold text-gray-900 mt-2">
                            ${order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Trip Requests Section */}
          {activeTrips.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Trip Packages
              </h3>
              <div className="space-y-3">
                {activeTrips.map((trip) => {
                  const statusColors: Record<string, string> = {
                    Requested: "bg-blue-100 text-blue-800 border-blue-200",
                    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    Confirmed: "bg-green-100 text-green-800 border-green-200",
                    Approved: "bg-purple-100 text-purple-800 border-purple-200",
                  };
                  
                  return (
                    <div
                      key={trip._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {trip.packageName || trip.location || 'Trip Request'}
                          </h4>
                          {trip.tripDate && (
                            <p className="text-sm text-gray-500 mt-1">
                              Date: {new Date(trip.tripDate).toLocaleDateString()}
                            </p>
                          )}
                          {trip.participants && (
                            <p className="text-xs text-gray-400 mt-1">
                              Participants: {trip.participants}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            statusColors[trip.status] || "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}