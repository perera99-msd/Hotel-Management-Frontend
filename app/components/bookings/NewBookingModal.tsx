"use client";

import { useState, useEffect } from "react";
import { auth } from "@/app/lib/firebase";
import toast from "react-hot-toast";
import { Search, Plus, X, User as UserIcon, Calendar, Check } from "lucide-react";

interface Booking {
  id?: string;
  _id?: string;
  roomId: string | { _id: string; roomNumber: string; [key: string]: any };
  guestId: string | { _id: string; name: string; email: string; [key: string]: any };
  checkIn: string;
  checkOut: string;
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBooking?: Booking | null;
  onUpdateBooking?: () => void;
}

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  rate: number;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function NewBookingModal({
  isOpen,
  onClose,
  editingBooking,
  onUpdateBooking,
}: NewBookingModalProps) {
  const [formData, setFormData] = useState({
    roomId: "",
    checkIn: "",
    checkOut: "",
    guestId: "", 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "new">("search");
  
  const [guests, setGuests] = useState<UserProfile[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, roomsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/rooms`, { headers })
      ]);

      if (usersRes.ok) setGuests(await usersRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    if (editingBooking && isOpen) {
      const getID = (field: any) => (typeof field === 'object' && field !== null ? field._id : field);
      const safeDate = (dateStr: string) => {
        try { return dateStr ? new Date(dateStr).toISOString().split('T')[0] : ""; } 
        catch (e) { return ""; }
      };

      const gId = getID(editingBooking.guestId);
      setFormData({
        roomId: getID(editingBooking.roomId) || "",
        checkIn: safeDate(editingBooking.checkIn),
        checkOut: safeDate(editingBooking.checkOut),
        guestId: gId || "",
      });

      if (gId && guests.length > 0) {
        const found = guests.find(g => g._id === gId);
        if (found) setSearchQuery(found.name);
      }
      setActiveTab('search');
    } else if (!isOpen) {
        setFormData({ roomId: "", checkIn: "", checkOut: "", guestId: "" });
        setSearchQuery("");
        setNewGuest({ name: "", email: "", phone: "" });
        setAvailableRooms([]);
        setActiveTab('search');
    }
  }, [editingBooking, isOpen, guests]);

  useEffect(() => {
    if (!searchQuery || formData.guestId) {
      setFilteredGuests([]);
      return;
    }
    const lower = searchQuery.toLowerCase();
    setFilteredGuests(
      guests.filter(g => 
        g.name.toLowerCase().includes(lower) || 
        g.email.toLowerCase().includes(lower)
      )
    );
  }, [searchQuery, guests, formData.guestId]);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut && rooms.length > 0) {
        checkAvailability();
    }
  }, [formData.checkIn, formData.checkOut, rooms]);

  const checkAvailability = async () => {
    try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        const res = await fetch(`${API_URL}/api/bookings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
            const bookings: any[] = await res.json();
            const start = new Date(formData.checkIn).getTime();
            const end = new Date(formData.checkOut).getTime();

            const occupiedIds = new Set();
            bookings.forEach(b => {
                const bId = b._id || b.id;
                const editId = editingBooking?._id || editingBooking?.id;
                if (editId && bId === editId) return;
                if (b.status === 'Cancelled' || b.status === 'CheckedOut') return;

                const bStart = new Date(b.checkIn).getTime();
                const bEnd = new Date(b.checkOut).getTime();

                if (start < bEnd && end > bStart) {
                    const rId = typeof b.roomId === 'object' ? b.roomId._id : b.roomId;
                    occupiedIds.add(rId);
                }
            });
            setAvailableRooms(rooms.filter(r => !occupiedIds.has(r._id)));
        }
    } catch (e) {
        console.error("Availability check failed", e);
    }
  };

  const handleConfirmBooking = async () => {
    const isNewGuest = activeTab === 'new';

    // Validation
    if(!formData.roomId || !formData.checkIn || !formData.checkOut) {
        toast.error("Please select dates and a room");
        return;
    }

    if (isNewGuest && (!newGuest.name || !newGuest.email)) {
        toast.error("Name and Email are required for new guests");
        return;
    }

    if (!isNewGuest && !formData.guestId) {
        toast.error("Please select an existing guest");
        return;
    }

    try {
      setIsSubmitting(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      let finalGuestId = formData.guestId;

      // ---------------------------------------------------------
      // STEP 1: If New Guest, Create User Profile First
      // ---------------------------------------------------------
      if (isNewGuest) {
          const guestRes = await fetch(`${API_URL}/api/users/guest`, {
             method: 'POST',
             headers: { 
                 "Content-Type": "application/json", 
                 Authorization: `Bearer ${token}` 
             },
             body: JSON.stringify(newGuest)
          });

          if (!guestRes.ok) {
              const err = await guestRes.json();
              throw new Error(err.error || "Failed to create new guest profile");
          }

          const guestData = await guestRes.json();
          finalGuestId = guestData._id || guestData.id;
      }

      // ---------------------------------------------------------
      // STEP 2: Create Booking with Resolved Guest ID
      // ---------------------------------------------------------
      const isEdit = !!editingBooking;
      const bookingId = editingBooking?.id || editingBooking?._id;
      const endpoint = isEdit ? `${API_URL}/api/bookings/${bookingId}` : `${API_URL}/api/bookings`;

      const payload = {
        roomId: formData.roomId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guestId: finalGuestId, // Always send a valid ID now
        source: 'Local',
        status: 'Confirmed'
      };

      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEdit ? "Booking updated" : "Booking created successfully");
        if (onUpdateBooking) onUpdateBooking();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save booking");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "An error occurred while saving booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-visible flex flex-col">
        
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {editingBooking ? "Edit Booking" : "New Booking"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
           {/* Date Selection */}
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type="date" 
                        className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.checkIn}
                        onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                    />
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type="date" 
                        className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.checkOut}
                        onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                    />
                </div>
             </div>
           </div>

           {/* Room Selection */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Select Room</label>
             {!formData.checkIn || !formData.checkOut ? (
                <div className="p-4 bg-gray-50 border border-dashed rounded-lg text-center text-sm text-gray-500">Select dates to see available rooms</div>
             ) : availableRooms.length === 0 ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center text-sm text-red-600">No rooms available for these dates</div>
             ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1 max-h-48 overflow-y-auto">
                    {availableRooms.map(room => (
                        <button
                            key={room._id}
                            onClick={() => setFormData({...formData, roomId: room._id})}
                            className={`p-3 border rounded-lg text-left transition-all relative ${
                                formData.roomId === room._id 
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                                : 'hover:border-blue-300 bg-white'
                            }`}
                        >
                            {formData.roomId === room._id && (
                                <div className="absolute top-2 right-2 text-blue-600">
                                    <Check className="h-4 w-4" />
                                </div>
                            )}
                            <div className="font-bold text-gray-900">Room {room.roomNumber}</div>
                            <div className="text-gray-500 text-xs">{room.type} • ${room.rate}/night</div>
                        </button>
                    ))}
                </div>
             )}
           </div>

           {/* Guest Selection */}
           <div className="border-t pt-4 relative">
             <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Guest Details</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => { setActiveTab('search'); setFormData({...formData, guestId: ""}); }}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'search' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >Search Existing</button>
                    <button 
                        onClick={() => { setActiveTab('new'); setFormData({...formData, guestId: ""}); }}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'new' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >New Guest</button>
                </div>
             </div>

             {activeTab === 'search' ? (
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search guest by name or email..."
                        className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (formData.guestId && e.target.value !== guests.find(g => g._id === formData.guestId)?.name) {
                                setFormData({...formData, guestId: ""});
                            }
                        }}
                    />
                    {searchQuery && !formData.guestId && (
                        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                            {filteredGuests.length > 0 ? filteredGuests.map(guest => (
                                <button
                                    key={guest._id}
                                    type="button"
                                    onClick={() => {
                                        setFormData({...formData, guestId: guest._id});
                                        setSearchQuery(guest.name);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                                >
                                    <div className="font-semibold text-sm text-gray-900">{guest.name}</div>
                                    <div className="text-xs text-gray-500">{guest.email}</div>
                                </button>
                            )) : (
                                <div className="p-4 text-center text-sm text-gray-500">No customers found</div>
                            )}
                        </div>
                    )}
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border">
                    <input 
                        placeholder="Full Name *"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newGuest.name}
                        onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
                    />
                    <input 
                        placeholder="Email Address *"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newGuest.email}
                        onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
                    />
                    <input 
                        placeholder="Phone Number"
                        className="sm:col-span-2 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newGuest.phone}
                        onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 sm:col-span-2 mt-1">* Required fields</p>
                </div>
             )}
           </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all"
          >
            {isSubmitting ? "Processing..." : (editingBooking ? "Update Booking" : "Confirm Booking")}
          </button>
        </div>
      </div>
    </div>
  );
}