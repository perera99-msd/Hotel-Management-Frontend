// app/dashboard/customer/ExploreRooms/page.tsx
"use client";

import { useState, useEffect, useContext } from "react";
import CustomerLayout from "../../../components/layout/CustomerLayout";
import NewBookingModal from "../NewBooking/NewBookingModal";
import { AuthContext } from "@/app/context/AuthContext";
import { Loader2, Users, Bed, Check } from "lucide-react";

// Matches your src/models/room.ts + applicableRate from backend for this booking month
interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  rate: number;
  status: string;
  amenities: string[];
  maxOccupancy: number;
  floor: number;
  applicableRate?: number; // Rate for the booking month
  bookingMonth?: number; // Month index (0-11)
}

export default function ExploreRoomsPage() {
  const { token } = useContext(AuthContext);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("");

  // Fetch Rooms from Backend
  useEffect(() => {
    const fetchRooms = async () => {
      if (!token || !checkIn || !checkOut) return;

      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const params = new URLSearchParams({ checkIn, checkOut });
        if (roomType) params.append('type', roomType);

        const response = await fetch(`${API_URL}/api/rooms/available?${params.toString()}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
            const data = await response.json();
            setRooms(data);
        } else {
            console.error("Failed to fetch rooms");
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [token, checkIn, checkOut, roomType]);

  const handleBookNow = (room: Room) => {
    // Map roomNumber to 'number' if the Modal expects 'number'
    const roomForModal = {
        ...room,
        id: room._id,        // Ensure ID is accessible as 'id' or '_id'
        number: room.roomNumber // Map for Modal display compatibility
    };
    setSelectedRoom(roomForModal);
    setIsBookingModalOpen(true);
  };

  const handleBookingComplete = () => {
    setIsBookingModalOpen(false);
    setSelectedRoom(null);
  };

  return (
    <CustomerLayout>
      {/* Kept the wide layout w-[98%] as requested */}
      <div className="p-6 w-[98%] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Explore Our Rooms</h1>
                <p className="text-gray-500 mt-1">Find the perfect space for your stay</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm text-black"
              />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm text-black"
              />
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm text-black"
              >
                <option value="">Any type</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="family">Family</option>
              </select>
            </div>
        </div>

        {!checkIn || !checkOut ? (
           <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-600">
              Select check-in and check-out dates to see availability.
           </div>
        ) : loading ? (
           <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
           </div>
        ) : rooms.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Bed className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No rooms available</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-1">
                We are fully booked at the moment. Please check back later or contact reception.
              </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
                {/* Changed: Height h-48 is the "sweet spot" - bigger than h-32, smaller than h-64 */}
                <div className="h-48 w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center relative group">
                    <Bed className="w-12 h-12 text-blue-200 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-blue-900 text-3xl font-bold tracking-tight">{room.roomNumber}</span>
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-blue-700 text-xs font-bold px-2 py-1 rounded text-uppercase tracking-wider shadow-sm">
                        {room.type}
                    </span>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Room {room.roomNumber}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                            <span className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {room.maxOccupancy} Guests
                            </span>
                            <span>•</span>
                            <span>Floor {room.floor}</span>
                        </div>
                    </div>
                  </div>

                  {/* Amenities List */}
                  {room.amenities && room.amenities.length > 0 && (
                      <div className="mb-5 flex-grow">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-2">
                              {room.amenities.slice(0, 5).map((amenity, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100">
                                      <Check className="w-3 h-3 mr-1.5 text-green-500" />
                                      {amenity}
                                  </span>
                              ))}
                              {room.amenities.length > 5 && (
                                  <span className="text-xs text-gray-400 py-1 font-medium">+ {room.amenities.length - 5} more</span>
                              )}
                          </div>
                      </div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <span className="text-2xl font-bold text-gray-900">${room.applicableRate || room.rate}</span>
                        <span className="text-sm font-normal text-gray-500 ml-1">/night</span>
                    </div>
                    <button
                      onClick={() => handleBookNow(room)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm focus:ring-4 focus:ring-blue-100"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isBookingModalOpen && (
          <NewBookingModal
            onClose={() => setIsBookingModalOpen(false)}
            onComplete={handleBookingComplete}
            selectedRoom={selectedRoom}
            defaultCheckIn={checkIn}
            defaultCheckOut={checkOut}
          />
        )}
      </div>
    </CustomerLayout>
  );
}