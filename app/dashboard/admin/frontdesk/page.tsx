"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import FrontDeskModal from "../../../components/frontdesk/frontdeskmodel";
import { useAuth } from "../../../context/AuthContext";
import dayjs from "dayjs";

type Status = "due-in" | "checked-out" | "due-out" | "checked-in" | "all";

interface GuestBooking {
  id: string;
  name: string;
  roomNumber: string;
  status: Status;
  startDate: Date;
  endDate: Date;
  colorClass: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FrontDeskPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Status>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [guestBookings, setGuestBookings] = useState<GuestBooking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const fetchGuestBookings = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Map Backend Data to UI Format
        const mappedData: GuestBooking[] = data.map((b: any) => {
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            const today = new Date();
            today.setHours(0,0,0,0);

            // Determine Status Logic
            let uiStatus: Status = 'due-in';
            let color = "bg-yellow-100 text-yellow-800";

            if (b.status === 'CheckedOut') {
                uiStatus = 'checked-out';
                color = "bg-blue-100 text-blue-800";
            } else if (b.status === 'CheckedIn') {
                // If checked in and checkout date is today, it's "Due Out"
                if (checkOut.toDateString() === today.toDateString()) {
                    uiStatus = 'due-out';
                    color = "bg-rose-100 text-rose-800";
                } else {
                    uiStatus = 'checked-in';
                    color = "bg-emerald-100 text-emerald-800";
                }
            } else if (b.status === 'Confirmed') {
                uiStatus = 'due-in';
                color = "bg-yellow-100 text-yellow-800";
            }

            return {
                id: b._id,
                name: b.guestId?.name || 'Guest',
                roomNumber: b.roomId?.number || 'N/A',
                status: uiStatus,
                startDate: checkIn,
                endDate: checkOut,
                colorClass: color
            };
        });

        setGuestBookings(mappedData);
      }
    } catch (error) {
      console.error("Failed to fetch guest bookings", error);
    }
  };

  useEffect(() => {
    fetchGuestBookings();
  }, [token]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(currentYear, currentMonth, day));
    return days;
  };

  const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToPreviousYear = () => setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
  const goToNextYear = () => setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const getBookingsForDate = (date: Date | null) => {
    if (!date) return [];
    return guestBookings.filter(booking => {
      if (activeTab !== "all" && booking.status !== activeTab) return false;
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      // Filter by Search Query
      if (searchQuery && !booking.name.toLowerCase().includes(searchQuery.toLowerCase()) && !booking.roomNumber.includes(searchQuery)) {
          return false;
      }

      return date >= start && date <= end;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  const calendarDays = generateCalendarDays();

  return (
    <AdminReceptionistLayout role="admin">
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm text-gray-400 mb-2">Front desk</h2>
            <div className="flex items-center gap-2">
              {["all", "due-in", "checked-out", "due-out", "checked-in"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as Status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition capitalize ${
                    activeTab === tab 
                    ? "bg-gray-200 text-gray-900 border border-gray-300"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest or room"
                className="text-black w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {/* Removed Create Booking Button */}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={goToToday} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">Today</button>
              <div className="flex items-center gap-2">
                <button onClick={goToPreviousYear} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="h-4 w-4 text-gray-600" /></button>
                <div className="text-xl font-bold text-gray-800 w-24 text-center">{currentYear}</div>
                <button onClick={goToNextYear} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="h-4 w-4 text-gray-600" /></button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="h-4 w-4 text-gray-600" /></button>
                <div className="text-2xl font-bold text-gray-800 w-40 text-center">{MONTHS[currentMonth]}</div>
                <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="h-4 w-4 text-gray-600" /></button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-100 border-b">
              {DAYS_OF_WEEK.map((day) => <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const bookings = getBookingsForDate(date);
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b p-2 ${date ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'} ${date && isToday(date) ? 'bg-blue-50' : ''} ${date && isSelected(date) ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className={`text-sm font-medium ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>{date.getDate()}</div>
                          {isToday(date) && <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Today</div>}
                        </div>
                        <div className="space-y-1">
                          {bookings.slice(0, 3).map((booking) => (
                            <div key={booking.id} className={`${booking.colorClass} rounded px-2 py-1 text-xs truncate`} title={booking.name}>
                              <div className="font-medium truncate">{booking.name}</div>
                              <div className="text-xs opacity-75">{booking.roomNumber}</div>
                            </div>
                          ))}
                          {bookings.length > 3 && <div className="text-xs text-gray-500 text-center">+{bookings.length - 3} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Selected Date</h3>
                <p className="text-lg font-semibold text-gray-900">{selectedDate.toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Bookings</h3>
                <p className="text-lg font-semibold text-gray-900">{getBookingsForDate(selectedDate).length}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
                {getBookingsForDate(selectedDate).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div><span className="text-black font-medium">{booking.name}</span> <span className="text-sm text-gray-600">({booking.roomNumber})</span></div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${booking.colorClass}`}>{booking.status.replace('-', ' ')}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <FrontDeskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchGuestBookings();
          }}
        />
      </div>
    </AdminReceptionistLayout>
  );
}