// app/dashboard/customer/page.tsx
"use client";

import { AuthContext } from "@/app/context/AuthContext";
import { ArrowRight, Bed, Calendar, CheckCircle, Clock, Loader2, Package, Phone, Plus, Utensils, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import HeroSlider from "../../components/dashboard/HeroSlider";
import CustomerLayout from "../../components/layout/CustomerLayout";
import PageCard from "../../components/ui/PageCard";

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
  shortStay?: boolean; // Flag for same-day bookings
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

interface TripPackageData {
  _id: string;
  name: string;
  location: string;
  price: number;
  images?: string[];
}

interface TripRequest {
  _id: string;
  packageName?: string;
  location?: string;
  status: string;
  tripDate?: string;
  participants?: number;
  packageId?: TripPackageData;
  image?: string;
  images?: string[];
}

{/* Active Orders */ }
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const router = useRouter();

  const fetchBookings = useCallback(async () => {
    // Wait for both token and profile to be available
    if (!token || !profile) {
      return;
    }

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
          completedSample: data.completedBookings?.[0],
          tripRequests: data.tripRequests?.[0]
        });
        setBookings(data.bookings || []);
        setCompletedBookings(data.completedBookings || []);
        setOrders(data.orders || []);
        setTripRequests(data.tripRequests || []);
        setDataLoaded(true);
      } else {
        console.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [token, profile]);

  const fetchDeals = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    // Only fetch when we have both token and profile
    if (token && profile) {
      fetchBookings();
      fetchDeals();
    }
  }, [token, profile, fetchBookings, fetchDeals]);

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
        <span className="font-semibold text-gray-800">Call Receptionist</span>
        <span className="text-sm text-gray-600">
          For more details about the deal:
        </span>
        <a href="tel:+94112345678" className="flex items-center gap-2 text-blue-600 font-bold mt-1">
          <Phone className="h-4 w-4" />
          +94 11 234 5678
        </a>
      </div>
    ), {
      duration: 6000,
      icon: '☎️',
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
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        <div className="space-y-4 sm:space-y-8 fade-in-animation">
          {/* 1. HERO SECTION - New Slider */}
          <section className="w-full -mx-2 sm:mx-0">
            <HeroSlider deals={deals} />
          </section>

          {/* 2. OVERVIEW WIDGETS - Redesigned Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Stats Area */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Welcome Card with Stats */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 sm:p-6 rounded-2xl shadow-sm border border-blue-500/20">
                <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                  Welcome back, {profile?.name || user?.displayName || "Guest"}!
                </h2>
                <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base">
                  Manage your bookings and explore our services
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/20">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold">{bookings.length}</div>
                    <div className="text-xs text-blue-100">Total Bookings</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/20">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold">{completedStays}</div>
                    <div className="text-xs text-blue-100">Completed</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/20">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold">{upcomingStays}</div>
                    <div className="text-xs text-blue-100">Active</div>
                  </div>
                </div>
              </div>

              {/* Fresh Activity - Mobile Only */}
              <div className="lg:hidden bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Fresh Activity</h3>
                    <p className="text-xs text-gray-500">Your hotel is buzzing today.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Active Bookings Badge */}
                  <Link
                    href="/dashboard/customer/bookings"
                    className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bed className="h-5 w-5 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-900">{bookings.length}</span>
                    </div>
                    <p className="text-xs font-semibold text-blue-700">Active Bookings</p>
                  </Link>

                  {/* Active Orders Badge */}
                  <Link
                    href="/dashboard/customer/RestaurantMenu"
                    className={`${activeOrders.length > 0 ? "bg-red-50 border-red-400" : "bg-gray-50 border-gray-200"
                      } border-2 rounded-2xl p-4 hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils className={`h-5 w-5 ${activeOrders.length > 0 ? "text-red-600" : "text-gray-400"}`} />
                      <span className={`text-2xl font-bold ${activeOrders.length > 0 ? "text-red-900" : "text-gray-400"}`}>
                        {activeOrders.length}
                      </span>
                    </div>
                    <p className={`text-xs font-semibold ${activeOrders.length > 0 ? "text-red-700" : "text-gray-500"}`}>
                      Active Orders
                    </p>
                  </Link>

                  {/* Active Trips Badge */}
                  <Link
                    href="/dashboard/customer/trip-packages"
                    className={`${activeTrips.length > 0 ? "bg-purple-50 border-purple-400" : "bg-gray-50 border-gray-200"
                      } border-2 rounded-2xl p-4 hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Package className={`h-5 w-5 ${activeTrips.length > 0 ? "text-purple-600" : "text-gray-400"}`} />
                      <span className={`text-2xl font-bold ${activeTrips.length > 0 ? "text-purple-900" : "text-gray-400"}`}>
                        {activeTrips.length}
                      </span>
                    </div>
                    <p className={`text-xs font-semibold ${activeTrips.length > 0 ? "text-purple-700" : "text-gray-500"}`}>
                      Trip Requests
                    </p>
                  </Link>

                  {/* Completed Stays Badge */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-900">{completedStays}</span>
                    </div>
                    <p className="text-xs font-semibold text-green-700">Completed</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Bookings</h3>
                  <Link
                    href="/dashboard/customer/ExploreRooms"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center transition-colors shadow-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">New Booking</span>
                    <span className="sm:hidden">New</span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {bookings.length === 0 && completedBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No bookings yet. Create your first booking!</p>
                    </div>
                  ) : (
                    // Show top 3 most recent bookings
                    [...bookings, ...completedBookings]
                      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
                      .slice(0, 3)
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

                        const isCompleted = booking.status.toLowerCase() === "checkedout" || booking.status.toLowerCase() === "checked-out";

                        let displayAmount = 0;
                        if (isCompleted) {
                          displayAmount = booking.invoiceTotal || 0;
                        } else {
                          displayAmount = booking.roomTotal || booking.totalAmount || (booking.appliedRate ? booking.appliedRate * nights : (room?.rate ? room.rate * nights : 0));
                        }

                        return (
                          <div
                            key={booking._id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                                  {getRoomTypeIcon(room?.type || "standard")}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {room ? `Room ${room.roomNumber}` : `Booking #${booking._id.slice(-6)}`}
                                    </h4>
                                    {booking.shortStay && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                                        Short Stay
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                                    <span className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</span>
                                    <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                                    <span className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-row items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                  <StatusIcon className="h-3 w-3 mr-1.5" />
                                  {status.text}
                                </span>

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

                                {isCancellable && (
                                  <button
                                    onClick={() => handleCancelClick(booking._id)}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
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
            </div>

            {/* Side Panel - Quick Actions & Help (Hidden on mobile, shown on desktop) */}
            <div className="hidden lg:block space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/dashboard/customer/ExploreRooms"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Bed className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Book a Room</div>
                      <div className="text-xs text-gray-500">Explore available rooms</div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/customer/trip-packages"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Trip Packages</div>
                      <div className="text-xs text-gray-500">Explore destinations</div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/customer/RestaurantMenu"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
                  >
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Utensils className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Order Food</div>
                      <div className="text-xs text-gray-500">Browse our menu</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Active Orders Summary */}
              {activeOrders.length > 0 && (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Utensils className="h-5 w-5 text-green-700" />
                    <h4 className="font-bold text-green-900">Active Orders</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-2">
                    You have {activeOrders.length} active {activeOrders.length === 1 ? 'order' : 'orders'}
                  </p>
                  <div className="text-xs text-green-600">
                    {activeOrders[0].status} • Room {activeOrders[0].roomNumber || 'N/A'}
                  </div>
                </div>
              )}

              {/* Active Trips Summary */}
              {activeTrips.length > 0 && (
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-purple-700" />
                    <h4 className="font-bold text-purple-900">Trip Requests</h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">
                    You have {activeTrips.length} active {activeTrips.length === 1 ? 'trip' : 'trips'}
                  </p>
                  <div className="text-xs text-purple-600">
                    {activeTrips[0].status} • {(activeTrips[0].packageId as any)?.name || activeTrips[0].packageName}
                  </div>
                </div>
              )}

              {/* Help Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg">
                <h4 className="font-bold text-lg mb-2">Need Help?</h4>
                <p className="text-gray-300 text-sm mb-4">Contact our front desk 24/7 for assistance.</p>
                <button
                  onClick={handleReceptionContactClick}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Contact Support
                </button>
              </div>
            </div>
          </section>

          {/* 3. ACTIVE ORDERS - Full Width Card */}
          {activeOrders.length > 0 && (
            <section>
              <PageCard title="Active Orders" description="Track your food and beverage orders">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeOrders.map((order) => {
                    const statusColors: Record<string, string> = {
                      Preparing: "bg-yellow-100 text-yellow-800 border-yellow-200",
                      Ready: "bg-green-100 text-green-800 border-green-200",
                      Served: "bg-blue-100 text-blue-800 border-blue-200",
                    };

                    return (
                      <div
                        key={order._id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Utensils className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">
                                Order #{order._id.slice(-6)}
                              </h4>
                              {order.roomNumber && (
                                <p className="text-xs text-gray-500">Room {order.roomNumber}</p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || "bg-gray-100 text-gray-800 border-gray-200"
                              }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            ${order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PageCard>
            </section>
          )}

          {/* 5. TRIP PACKAGES - Full Width Card */}
          {activeTrips.length > 0 && (
            <section>
              <PageCard title="Trip Packages" description="Your adventure bookings and requests">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTrips.map((trip) => {
                    const statusColors: Record<string, string> = {
                      Requested: "bg-blue-100 text-blue-800 border-blue-200",
                      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
                      Confirmed: "bg-green-100 text-green-800 border-green-200",
                      Approved: "bg-purple-100 text-purple-800 border-purple-200",
                    };

                    // Get image from packageId (populated package data)
                    const packageData = trip.packageId as any;
                    const tripImage =
                      packageData?.images && packageData.images.length > 0
                        ? packageData.images[0]
                        : trip.image ||
                        (Array.isArray(trip.images) && trip.images.length > 0 ? trip.images[0] : null);

                    // Get package name and location from packageId
                    const packageName = packageData?.name || trip.packageName || "Trip Request";
                    const packageLocation = packageData?.location || trip.location;

                    return (
                      <div
                        key={trip._id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                      >
                        {/* Trip Image */}
                        {tripImage && (
                          <div className="h-40 bg-gray-100 overflow-hidden">
                            <img
                              src={tripImage}
                              alt={packageName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{packageName}</h4>
                              {packageLocation && (
                                <p className="text-xs text-gray-500 truncate">{packageLocation}</p>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap flex-shrink-0 ${statusColors[trip.status] || "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                            >
                              {trip.status}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {trip.tripDate && (
                              <p className="text-sm text-gray-500">
                                Date: {new Date(trip.tripDate).toLocaleDateString()}
                              </p>
                            )}
                            {trip.participants && (
                              <p className="text-xs text-gray-400">Participants: {trip.participants}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PageCard>
            </section>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}