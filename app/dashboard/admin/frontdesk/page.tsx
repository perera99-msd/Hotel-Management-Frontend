"use client";

import { Calendar, ChevronLeft, ChevronRight, Filter, Plus, Search, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import NewBookingModal from "../../../components/bookings/NewBookingModal";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import { useAuth } from "../../../context/AuthContext";

type StatusFilter = "all" | "reserved" | "due-in" | "checked-in" | "due-out" | "checked-out";

interface RoomRow {
  id: string;
  roomNumber: string;
  type: "single" | "double" | "suite" | "family";
  tier?: string;
  floor?: number;
  computedStatus?: string;
}

interface BookingRow {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomId: string;
  roomNumber: string;
  status: "Pending" | "Confirmed" | "CheckedIn" | "CheckedOut" | "Cancelled";
  checkIn: Date;
  checkOut: Date;
  adults?: number;
  children?: number;
  source?: string;
}

const STATUS_STYLES: Record<string, string> = {
  reserved: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  "due-in": "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  "checked-in": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "due-out": "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  "checked-out": "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  cleaning: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
};

const ROOM_TYPE_ORDER = ["single", "double", "suite", "family"] as const;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatMonthValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseMonthValue = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function FrontDeskPage() {
  const { token } = useAuth();
  const scrollableRef = useRef<HTMLDivElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  const monthStart = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1),
    [selectedMonth]
  );

  const today = useMemo(() => new Date(), []);

  const minMonth = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1, date.getMonth(), 1);
    return date;
  }, []);

  const maxMonth = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1, date.getMonth(), 1);
    return date;
  }, []);

  const daysInMonth = useMemo(() => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
  }, [monthStart]);

  const fetchRooms = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedRooms: RoomRow[] = data.map((room: any) => ({
          id: room._id || room.id,
          roomNumber: room.roomNumber || room.number || "N/A",
          type: (room.type || "single") as RoomRow["type"],
          tier: room.tier,
          floor: room.floor,
          computedStatus: room.computedStatus || room.status,
        }));
        const sorted = mappedRooms.sort((a, b) => {
          const typeOrder = ROOM_TYPE_ORDER.indexOf(a.type) - ROOM_TYPE_ORDER.indexOf(b.type);
          if (typeOrder !== 0) return typeOrder;
          return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: "base" });
        });
        setRooms(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    }
  };

  const fetchBookings = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedBookings: BookingRow[] = data.map((booking: any) => ({
          id: booking._id,
          guestName: booking.guestId?.name || "Guest",
          guestEmail: booking.guestId?.email,
          guestPhone: booking.guestId?.phone,
          roomId: booking.roomId?._id || booking.roomId || "",
          roomNumber: booking.roomId?.roomNumber || booking.roomId?.number || "N/A",
          status: booking.status,
          checkIn: new Date(booking.checkIn),
          checkOut: new Date(booking.checkOut),
          adults: booking.adults,
          children: booking.children,
          source: booking.source,
        }));
        setBookings(mappedBookings);
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [token]);

  const handleBookingCreated = () => {
    fetchRooms();
    fetchBookings();
    setIsNewBookingOpen(false);
  };

  const getBookingStatusForDay = (booking: BookingRow, date: Date) => {
    if (booking.status === "CheckedOut") return "checked-out";
    if (booking.status === "CheckedIn") {
      return isSameDay(normalizeDate(date), normalizeDate(booking.checkOut)) ? "due-out" : "checked-in";
    }
    if (booking.status === "Confirmed") {
      return isSameDay(normalizeDate(date), normalizeDate(booking.checkIn)) ? "due-in" : "reserved";
    }
    return "reserved";
  };

  const bookingMatchesDay = (booking: BookingRow, date: Date) => {
    const start = normalizeDate(booking.checkIn);
    const end = normalizeDate(booking.checkOut);
    const day = normalizeDate(date);
    return day >= start && day <= end;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!booking.guestName.toLowerCase().includes(query) && !booking.roomNumber.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, searchQuery]);

  const getBookingForRoomDay = (roomId: string, date: Date) => {
    const match = filteredBookings.find((booking) => booking.roomId === roomId && bookingMatchesDay(booking, date));
    if (!match) return null;
    const status = getBookingStatusForDay(match, date);
    if (activeTab !== "all" && status !== activeTab) return null;
    return { booking: match, status };
  };

  const monthLabel = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const monthInputValue = formatMonthValue(monthStart);

  const gridTemplateColumns = useMemo(() => {
    return `240px repeat(${daysInMonth.length}, 64px)`;
  }, [daysInMonth.length]);

  return (
    <AdminReceptionistLayout role="admin">
      <div className="absolute inset-0 flex flex-col bg-gray-50/50">
        {/* Header Section - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-4 shadow-sm z-30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Front Desk</h1>
              <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-medium text-gray-900 w-36 text-center">{monthLabel}</span>
                <button
                  onClick={() => setSelectedMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));

                  // Scroll to today's column
                  setTimeout(() => {
                    if (scrollableRef.current) {
                      const todayElement = scrollableRef.current.querySelector('[data-date-today="true"]');
                      if (todayElement) {
                        todayElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }
                    }
                  }, 100);
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Jump to Today
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest or room..."
                  className="w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                />
              </div>
              <div className="relative">
                <input
                  ref={monthInputRef}
                  type="month"
                  value={monthInputValue}
                  min={formatMonthValue(minMonth)}
                  max={formatMonthValue(maxMonth)}
                  onChange={(e) => setSelectedMonth(parseMonthValue(e.target.value))}
                  className="w-10 h-9 opacity-0 absolute inset-0 pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (monthInputRef.current?.showPicker) {
                      monthInputRef.current.showPicker();
                    } else {
                      monthInputRef.current?.focus();
                      monthInputRef.current?.click();
                    }
                  }}
                  aria-label="Select month"
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                  <Calendar className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <button
                onClick={() => setIsNewBookingOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                New Booking
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Filter className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
            {["all", "reserved", "due-in", "checked-in", "due-out", "checked-out"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as StatusFilter)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize whitespace-nowrap border ${activeTab === tab
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid Area */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">

            {/* Color Scheme Guide / Legend */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 p-1.5 rounded-md">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-gray-700">Color Guide</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {Object.entries(STATUS_STYLES).map(([key, styleClass]) => {
                    const bgColor = styleClass.split(' ')[0];
                    const textColor = styleClass.split(' ')[1];
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-md ${bgColor} ${textColor} border ${styleClass.split(' ')[2]} text-xs font-medium`}>
                          {key.replace("-", " ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-auto" ref={scrollableRef}>
              <div className="min-w-max">
                {/* Header Row */}
                <div
                  className="grid sticky top-0 z-20 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  style={{ gridTemplateColumns }}
                >
                  <div className="sticky left-0 z-30 bg-white px-6 py-4 border-r border-gray-200 flex items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Room Details</span>
                  </div>
                  {daysInMonth.map((date) => {
                    const isToday = isSameDay(date, today);
                    return (
                      <div
                        key={date.toISOString()}
                        data-date-today={isToday ? "true" : "false"}
                        className={`px-1 py-3 text-center border-r border-gray-100 flex flex-col justify-center ${isToday ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className={`text-xs font-bold mb-0.5 ${isToday ? 'text-blue-600' : 'text-gray-400'} uppercase`}>
                          {DAY_NAMES[date.getDay()]}
                        </div>
                        <div className={`text-sm font-semibold ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-900'} w-7 h-7 mx-auto rounded-full flex items-center justify-center`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Room Rows */}
                <div className="divide-y divide-gray-100">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="grid hover:bg-gray-50/30 transition-colors group"
                      style={{ gridTemplateColumns }}
                    >
                      {/* Room Info Column */}
                      <div className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/30 border-r border-gray-200 px-6 py-3 flex flex-col justify-center shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-800">{room.roomNumber}</span>
                            {room.tier && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">
                                {room.tier}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-500 capitalize">{room.type}</span>
                          {room.floor !== undefined && (
                            <span className="text-gray-400">FL {room.floor}</span>
                          )}
                        </div>
                        {room.computedStatus && (
                          <div className={`mt-1.5 inline-flex text-[10px] font-medium ${room.computedStatus.toLowerCase().includes('clean') ? 'text-orange-600' : 'text-gray-400'}`}>
                            {room.computedStatus}
                          </div>
                        )}
                      </div>

                      {/* Days Columns */}
                      {daysInMonth.map((date) => {
                        const bookingMatch = getBookingForRoomDay(room.id, date);
                        const isToday = isSameDay(date, today);
                        const showCleaning = isToday && room.computedStatus === "Needs Cleaning" && !bookingMatch;

                        return (
                          <div
                            key={`${room.id}-${date.toISOString()}`}
                            className={`border-r border-gray-100 p-1 flex items-center justify-center ${isToday ? "bg-blue-50/30" : ""}`}
                          >
                            {bookingMatch ? (
                              <button
                                type="button"
                                onClick={() => setSelectedBooking(bookingMatch.booking)}
                                className={`w-full h-full text-left rounded-md px-2 py-1.5 text-[11px] leading-snug transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer border ${STATUS_STYLES[bookingMatch.status]
                                  }`}
                                title={`${bookingMatch.booking.guestName} • ${bookingMatch.booking.roomNumber}`}
                              >
                                <div className="font-bold truncate">{bookingMatch.booking.guestName}</div>
                                <div className="opacity-75 text-[9px] uppercase tracking-wide truncate">
                                  {bookingMatch.status.replace("-", " ")}
                                </div>
                              </button>
                            ) : showCleaning ? (
                              <div className={`w-full h-full flex items-center justify-center rounded-md border border-dashed border-orange-200 bg-orange-50 text-[10px] text-orange-600 font-medium`}>
                                Cleaning
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <NewBookingModal
          isOpen={isNewBookingOpen}
          onClose={() => setIsNewBookingOpen(false)}
          editingBooking={null}
          onUpdateBooking={handleBookingCreated}
        />

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBooking(null)} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
                  <p className="text-sm text-gray-500">ID: #{selectedBooking.id.slice(-6).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Guest Info Card */}
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900">{selectedBooking.guestName}</h4>
                    <div className="text-sm text-gray-500 flex flex-col mt-1 space-y-0.5">
                      {selectedBooking.guestEmail && <span>{selectedBooking.guestEmail}</span>}
                      {selectedBooking.guestPhone && <span>{selectedBooking.guestPhone}</span>}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[selectedBooking.status.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {selectedBooking.status.replace("-", " ")}
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Booking Details Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Room</label>
                    <div className="font-semibold text-gray-900 text-base">{selectedBooking.roomNumber}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Guests</label>
                    <div className="font-semibold text-gray-900 text-base">
                      {selectedBooking.adults || 0} Adults, {selectedBooking.children || 0} Children
                    </div>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Check In</label>
                      <div className="font-semibold text-gray-900">{selectedBooking.checkIn.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Check Out</label>
                      <div className="font-semibold text-gray-900">{selectedBooking.checkOut.toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-end">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminReceptionistLayout>
  );
}