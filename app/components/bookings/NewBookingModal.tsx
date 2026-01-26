"use client";

import { useState, useEffect } from "react";
import { auth } from "@/app/lib/firebase";
import toast from "react-hot-toast";
import { Search, Plus, X, User as UserIcon, Calendar, Check, Percent } from "lucide-react";

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

interface Deal {
  _id: string;
  dealName: string;
  roomType: string[];
  price: number;
  discount: number;
  startDate: string;
  endDate: string;
  status: 'Ongoing' | 'Full' | 'Inactive' | 'New' | 'Finished';
  description?: string;
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
  const [deals, setDeals] = useState<Deal[]>([]);
  
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

      const [usersRes, roomsRes, dealsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/rooms`, { headers }),
        fetch(`${API_URL}/api/deals`, { headers })
      ]);

      if (usersRes.ok) setGuests(await usersRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (dealsRes.ok) setDeals(await dealsRes.json());
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

      const payload: Record<string, any> = {
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

  const selectedRoom = rooms.find((r) => r._id === formData.roomId);

  const dealStatusAllowed = ['Ongoing', 'New', 'Inactive', 'Full'];
  const dateForDeal = formData.checkIn ? new Date(formData.checkIn) : new Date();
  const filteredDeals = selectedRoom
    ? deals.filter((d) => {
        const start = d.startDate ? new Date(d.startDate) : null;
        const end = d.endDate ? new Date(d.endDate) : null;
        const inWindow = start && end ? start <= dateForDeal && end >= dateForDeal : true;
        const statusOk = dealStatusAllowed.includes(d.status);
        const typeOk = Array.isArray(d.roomType) ? d.roomType.some((t) => t.toLowerCase() === selectedRoom.type.toLowerCase()) : false;
        return inWindow && statusOk && typeOk;
      })
    : [];

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
                    {availableRooms.map(room => {
                      const checkInMonth = formData.checkIn ? new Date(formData.checkIn).getMonth() : 0;
                      const monthlyRates = (room as any).monthlyRates || [];
                      const displayRate = monthlyRates[checkInMonth] || room.rate || 0;
                      
                      return (
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
                            <div className="text-gray-500 text-xs">{room.type} • ${displayRate.toFixed(2)}/night</div>
                        </button>
                      );
                    })}
                </div>
             )}
           </div>

           {/* Auto-Applied Deal Display */}
           {selectedRoom && filteredDeals.length > 0 && (
             <div className="border-t pt-4">
               <div className="flex items-center gap-2 mb-3">
                 <Percent className="h-4 w-4 text-emerald-600" />
                 <p className="text-sm font-medium text-gray-800">Active Deal (Auto-Applied)</p>
               </div>
               {(() => {
                 // Find best deal (lowest final rate)
                 const checkInMonth = formData.checkIn ? new Date(formData.checkIn).getMonth() : 0;
                 const monthlyRates = (selectedRoom as any).monthlyRates || [];
                 const monthRate = monthlyRates[checkInMonth] || selectedRoom.rate || 0;
                 
                 const bestDeal = filteredDeals.reduce<{ deal: Deal | null; rate: number }>((best, deal) => {
                   const discountPercent = deal.discount || 0;
                   const dealPrice = deal.price;
                   // Only use dealPrice if it's explicitly set and greater than 0
                   const rateWithDeal = typeof dealPrice === 'number' && !isNaN(dealPrice) && dealPrice > 0
                     ? dealPrice
                     : monthRate * (1 - discountPercent / 100);
                   
                   if (best.deal === null || rateWithDeal < best.rate) {
                     return { deal, rate: rateWithDeal };
                   }
                   return best;
                 }, { deal: null, rate: monthRate });

                 if (bestDeal.deal) {
                   const deal = bestDeal.deal;
                   const startLabel = deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "";
                   const endLabel = deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "";
                   
                   return (
                     <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                       <div className="flex items-center justify-between gap-2 mb-2">
                         <div className="text-sm font-semibold text-emerald-900">{deal.dealName}</div>
                         <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{deal.status}</span>
                       </div>
                       <div className="text-xs text-emerald-700 mb-1">Discount {deal.discount}%</div>
                       {(startLabel || endLabel) && (
                         <div className="text-xs text-emerald-600 mb-1">Valid: {startLabel} - {endLabel}</div>
                       )}
                       {deal.description && <p className="text-xs text-emerald-700 mt-2 line-clamp-2">{deal.description}</p>}
                       <div className="mt-3 flex items-center gap-2 text-sm text-emerald-800">
                         <Check className="h-4 w-4" />
                         <span className="font-medium">This deal will be automatically applied</span>
                       </div>
                     </div>
                   );
                 }
                 return null;
               })()}
             </div>
           )}

           {/* Pricing Summary */}
           {selectedRoom && formData.checkIn && formData.checkOut && (
             <div className="border-t pt-4">
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                 <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                   <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                   </svg>
                   Pricing Summary
                 </h4>
                 {(() => {
                   const checkInDate = new Date(formData.checkIn);
                   const checkOutDate = new Date(formData.checkOut);
                   const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
                   const checkInMonth = checkInDate.getMonth();
                   const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                   const monthlyRates = (selectedRoom as any).monthlyRates || [];
                   const monthRate = monthlyRates[checkInMonth] || selectedRoom.rate || 0;
                   
                   // Find best deal (auto-applied)
                   const bestDeal = filteredDeals.reduce<{ deal: Deal | null; rate: number }>((best, deal) => {
                     const discountPercent = deal.discount || 0;
                     const dealPrice = deal.price;
                     // Only use dealPrice if it's explicitly set and greater than 0
                     const rateWithDeal = typeof dealPrice === 'number' && !isNaN(dealPrice) && dealPrice > 0
                       ? dealPrice
                       : monthRate * (1 - discountPercent / 100);
                     
                     if (best.deal === null || rateWithDeal < best.rate) {
                       return { deal, rate: rateWithDeal };
                     }
                     return best;
                   }, { deal: null, rate: monthRate });

                   const appliedDeal = bestDeal.deal;
                   const discountPercent = appliedDeal?.discount || 0;
                   const dealPrice = appliedDeal?.price;
                   
                   let finalRate = monthRate;
                   if (appliedDeal) {
                     // Only use dealPrice if it's explicitly set and greater than 0
                     finalRate = typeof dealPrice === 'number' && !isNaN(dealPrice) && dealPrice > 0
                       ? dealPrice 
                       : monthRate * (1 - discountPercent / 100);
                   }
                   
                   const subtotal = monthRate * nights;
                   const discount = (monthRate - finalRate) * nights;
                   const total = finalRate * nights;
                   
                   return (
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between items-center text-gray-700">
                         <span>Room {selectedRoom.roomNumber} • {selectedRoom.type}</span>
                         <span className="font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
                       </div>
                       <div className="flex justify-between items-center text-gray-700">
                         <span>{monthNames[checkInMonth]} Rate</span>
                         <span className="font-medium">${monthRate.toFixed(2)}/night</span>
                       </div>
                       {appliedDeal && (
                         <>
                           <div className="flex justify-between items-center text-emerald-600">
                             <span className="flex items-center gap-1">
                               <Percent className="h-3 w-3" />
                               {appliedDeal.dealName} ({discountPercent}% off)
                             </span>
                             <span className="font-medium">-${discount.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center text-gray-700">
                             <span>Discounted Rate</span>
                             <span className="font-medium">${finalRate.toFixed(2)}/night</span>
                           </div>
                         </>
                       )}
                       <div className="border-t border-blue-200 pt-2 mt-2">
                         <div className="flex justify-between items-center">
                           <span className="font-semibold text-gray-900">Total Amount</span>
                           <span className="text-lg font-bold text-blue-600">${total.toFixed(2)}</span>
                         </div>
                       </div>
                     </div>
                   );
                 })()}
               </div>
             </div>
           )}

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