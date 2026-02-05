"use client";

import { auth } from "@/app/lib/firebase";
import { Calendar, MapPin, Search, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AddTripBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTripBookingModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTripBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchGuest, setSearchGuest] = useState("");

  const [formData, setFormData] = useState({
    guestId: "",
    bookingId: "",
    packageId: "",
    tripDate: "",
    participants: 1,
    status: "Pending",
    notes: ""
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      setLoading(true);

      // Parallel requests with 5-second timeout to prevent hanging
      const fetchWithTimeout = (url: string, options: RequestInit) =>
        Promise.race([
          fetch(url, options),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          )
        ]);

      try {
        // Fetch users (customers only for trip bookings)
        const usersRes = await fetchWithTimeout(`${API_URL}/api/users?role=customer`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (usersRes.ok) {
          const data = await usersRes.json();
          setGuests(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to load guests", e);
        toast.error("Load guests failed");
      }

      try {
        // Fetch only active trip packages
        const tripsRes = await fetchWithTimeout(`${API_URL}/api/trips?status=active`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (tripsRes.ok) {
          const data = await tripsRes.json();
          setPackages(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to load packages", e);
        toast.error("Load packages failed");
      }

      try {
        // Fetch only confirmed/checked-in bookings to reduce payload
        const bookingsRes = await fetchWithTimeout(`${API_URL}/api/bookings?status=confirmed,checked-in`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to load bookings", e);
        toast.error("Load bookings failed");
      }
    } catch (e) {
      console.error("Failed to load data", e);
      toast.error("Load data failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation with user-friendly messages
    if (!formData.guestId) {
      toast.error("Select guest");
      return;
    }

    if (!formData.bookingId) {
      toast.error("Select booking");
      return;
    }

    if (!formData.packageId) {
      toast.error("Select package");
      return;
    }

    if (!formData.tripDate) {
      toast.error("Pick trip date");
      return;
    }

    // Validate trip date is within booking period
    if (selectedBooking) {
      const tripDate = new Date(formData.tripDate);
      const checkIn = new Date(selectedBooking.checkIn);
      const checkOut = new Date(selectedBooking.checkOut);

      if (tripDate < checkIn || tripDate > checkOut) {
        toast.error("Date outside booking");
        return;
      }
    }

    if (!formData.participants || formData.participants < 1) {
      toast.error("Min 1 participant");
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const res = await fetch(`${API_URL}/api/trips/requests/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Booking created");
        onSuccess();
        onClose();
        // Reset
        setFormData({ guestId: "", bookingId: "", packageId: "", tripDate: "", participants: 1, status: "Pending", notes: "" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Create failed");
      }
    } catch (e: any) {
      console.error("Error creating booking:", e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchGuest.toLowerCase()) ||
    g.email.toLowerCase().includes(searchGuest.toLowerCase())
  );

  const eligibleBookings = bookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    const matchesGuest = formData.guestId ? (b.guestId?._id === formData.guestId || b.guestId === formData.guestId) : true;
    const statusAllowed = status === 'confirmed' || status === 'checkedin' || status === 'checked-in';
    return matchesGuest && statusAllowed;
  });

  const selectedBooking = eligibleBookings.find(b => b._id === formData.bookingId);
  const bookingCheckedIn = selectedBooking ? ['checkedin', 'checked-in'].includes((selectedBooking.status || '').toLowerCase()) : false;

  useEffect(() => {
    // Auto-select first eligible booking for the chosen guest
    const firstBookingId = eligibleBookings[0]?._id || "";
    setFormData((prev) => {
      if (prev.bookingId === firstBookingId) return prev;
      return { ...prev, bookingId: firstBookingId };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.guestId, bookings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">New Trip Booking</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-4">

          {/* 1. Select Guest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Guest</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search guest..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.guestId ? (guests.find(g => g._id === formData.guestId)?.name || searchGuest) : searchGuest}
                onChange={(e) => {
                  setFormData({ ...formData, guestId: "" });
                  setSearchGuest(e.target.value);
                }}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            {searchGuest && !formData.guestId && (
              <div className="mt-1 border rounded-lg max-h-32 overflow-y-auto bg-white absolute z-10 w-full max-w-[calc(100%-3rem)] shadow-lg">
                {filteredGuests.map(g => (
                  <div
                    key={g._id}
                    className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                    onClick={() => {
                      setFormData({ ...formData, guestId: g._id, bookingId: "" });
                      setSearchGuest("");
                    }}
                  >
                    <div className="font-medium text-gray-900">{g.name}</div>
                    <div className="text-xs text-gray-500">{g.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1b. Select Booking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Booking</label>
            {eligibleBookings.length === 0 ? (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                Choose a guest with a confirmed or checked-in booking to add a trip.
              </div>
            ) : (
              <select
                className="w-full p-2 border rounded-lg text-sm outline-none"
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              >
                {eligibleBookings.map((booking) => {
                  const status = booking.status;
                  const room = booking.roomId?.roomNumber || booking.roomId?.number || booking.roomNumber;
                  const labelRoom = room ? `Room ${room}` : "Booking";
                  return (
                    <option key={booking._id} value={booking._id}>
                      {labelRoom} • {status}
                    </option>
                  );
                })}
              </select>
            )}
            {selectedBooking && !bookingCheckedIn && (
              <p className="text-xs text-amber-700 mt-1">You can confirm only after this booking is checked-in.</p>
            )}
          </div>

          {/* 2. Select Package */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Trip Package</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {packages.map(pkg => (
                <div
                  key={pkg._id}
                  onClick={() => setFormData({ ...formData, packageId: pkg._id })}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.packageId === pkg._id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'hover:border-gray-300'
                    }`}
                >
                  <div className="font-medium text-gray-900 text-sm truncate">{pkg.name}</div>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {pkg.location}
                  </div>
                  <div className="text-sm font-semibold text-blue-600 mt-1">${pkg.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-9 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.tripDate}
                  onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                  min={selectedBooking?.checkIn ? new Date(selectedBooking.checkIn).toISOString().slice(0, 10) : undefined}
                  max={selectedBooking?.checkOut ? new Date(selectedBooking.checkOut).toISOString().slice(0, 10) : undefined}
                />
              </div>
              {selectedBooking?.checkIn && selectedBooking?.checkOut && (
                <p className="text-xs text-gray-500 mt-1">
                  Booking: {new Date(selectedBooking.checkIn).toLocaleDateString()} - {new Date(selectedBooking.checkOut).toLocaleDateString()}
                </p>
              )}
              {formData.tripDate && (
                <>
                  {(new Date(formData.tripDate) < new Date(selectedBooking?.checkIn || new Date())) && (
                    <p className="text-xs text-orange-600 mt-1">Date before check-in. Extend booking to use earlier dates.</p>
                  )}
                  {(new Date(formData.tripDate) > new Date(selectedBooking?.checkOut || new Date())) && (
                    <p className="text-xs text-orange-600 mt-1">Date after check-out. Extend booking to use later dates.</p>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  className="w-full pl-9 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full p-2 border rounded-lg text-sm outline-none"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Confirmed" disabled={!bookingCheckedIn}>Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.bookingId}
            className="px-4 py-2 text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}