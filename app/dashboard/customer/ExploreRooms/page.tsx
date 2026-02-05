// app/dashboard/customer/ExploreRooms/page.tsx
"use client";

import { AuthContext } from "@/app/context/AuthContext";
import {
  Bed,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Loader2,
  Maximize2,
  Star,
  Tv,
  Users,
  Wifi,
  Wind,
  X
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import CustomerLayout from "../../../components/layout/CustomerLayout";
import NewBookingModal from "../NewBooking/NewBookingModal";

// --- Types (Matched to your Backend src/models/room.ts) ---
interface Room {
  _id: string;
  name?: string; // Added name field
  roomNumber: string;
  type: string;
  rate: number;
  status: string;
  amenities: string[];
  maxOccupancy: number;
  floor: number;
  tier?: 'Deluxe' | 'Normal';
  images?: string[];
  applicableRate?: number;
  bookingMonth?: number;
}

// --- Helper Components ---

const AmenityIcon = ({ name }: { name: string }) => {
  const n = name.toLowerCase();
  if (n.includes("wifi") || n.includes("internet")) return <Wifi className="w-4 h-4" />;
  if (n.includes("tv") || n.includes("television")) return <Tv className="w-4 h-4" />;
  if (n.includes("ac") || n.includes("air") || n.includes("cool")) return <Wind className="w-4 h-4" />;
  if (n.includes("coffee") || n.includes("tea") || n.includes("bar")) return <Coffee className="w-4 h-4" />;
  if (n.includes("view") || n.includes("balcony")) return <Maximize2 className="w-4 h-4" />;
  return <Check className="w-4 h-4" />;
};

const CustomerRoomCard = ({
  room,
  onBook,
  onViewPhotos
}: {
  room: Room;
  onBook: (room: Room) => void;
  onViewPhotos: (room: Room) => void;
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images = room.images && room.images.length > 0 ? room.images : [];
  const hasMultipleImages = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Determine Rate Display
  const finalRate = room.applicableRate || room.rate;
  const isDeluxe = room.tier === 'Deluxe';

  // Determine Display Name
  // Use room.name if available, otherwise capitalize room.type
  const displayName = room.name || (room.type.charAt(0).toUpperCase() + room.type.slice(1) + " Room");

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Gallery Section */}
      <div className="relative h-40 sm:h-48 w-full bg-gray-200 overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[currentImgIndex]}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          // Fallback if no images
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
            <Bed className="w-20 h-20 mb-3" />
            <span className="text-sm font-medium uppercase tracking-widest text-slate-400">No Photos</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 right-3 flex gap-2 flex-wrap justify-end">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            {room.type}
          </span>
        </div>

        {/* Tier Badge - Bottom Left */}
        {isDeluxe && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current" /> Deluxe
            </span>
          </div>
        )}

        {/* Photo Count Badge - Top Left */}
        {images.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-black/80 transition-colors" onClick={() => onViewPhotos(room)}>
            {images.length} photos
          </div>
        )}

        {/* Photo Count Badge - Top Left */}
        {images.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-black/80 transition-colors" onClick={() => onViewPhotos(room)}>
            {images.length} photos
          </div>
        )}

        {/* Navigation Arrows (Visible on Hover) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        {/* Room Title & ID */}
        <div className="mb-2 sm:mb-3">
          <h3 className="text-base sm:text-xl font-bold text-gray-900">{displayName}</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Room {room.roomNumber}</p>
        </div>

        {/* Room Details Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500 font-semibold">Guests</p>
              <p className="text-sm font-bold text-gray-900">{room.maxOccupancy}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Bed className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500 font-semibold">Floor</p>
              <p className="text-sm font-bold text-gray-900">{room.floor === 0 ? "Ground" : room.floor}</p>
            </div>
          </div>
        </div>

        {/* Amenities List */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="mb-3 sm:mb-5">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Amenities</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {room.amenities.slice(0, 4).map((amenity, idx) => (
                <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                  <Check className="w-3 h-3 mr-1.5 text-blue-600" />
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 4 && (
                <span className="text-xs text-gray-500 px-2.5 py-1 font-medium">+{room.amenities.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Price and Button */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Price per night</p>
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-gray-900">${finalRate}</span>
              <span className="text-sm font-normal text-gray-500 ml-1">/night</span>
            </div>
          </div>
          <button
            onClick={() => onBook(room)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-200 whitespace-nowrap"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---

export default function ExploreRoomsPage() {
  const { token } = useContext(AuthContext);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("");

  // Gallery Modal State
  const [photoGalleryRoom, setPhotoGalleryRoom] = useState<Room | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  // Fetch Rooms from Backend
  useEffect(() => {
    const fetchRooms = async () => {
      // Don't fetch if no token (user logged out)
      if (!token) {
        setRooms([]);
        return;
      }

      // Clear rooms if dates are cleared
      if (!checkIn || !checkOut) {
        setRooms([]);
        return;
      }

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
    // Map data for the modal
    const roomForModal = {
      ...room,
      id: room._id,
      number: room.roomNumber
    };
    setSelectedRoom(roomForModal);
    setIsBookingModalOpen(true);
  };

  const handleBookingComplete = () => {
    setIsBookingModalOpen(false);
    setSelectedRoom(null);
  };

  const handleViewAllPhotos = (room: Room) => {
    if (room.images && room.images.length > 0) {
      setPhotoGalleryRoom(room);
      setCurrentGalleryIndex(0);
    }
  };

  const handleCloseGallery = () => {
    setPhotoGalleryRoom(null);
    setCurrentGalleryIndex(0);
  };

  const handleGalleryNext = () => {
    if (photoGalleryRoom?.images) {
      setCurrentGalleryIndex((prev) => (prev + 1) % photoGalleryRoom.images!.length);
    }
  };

  const handleGalleryPrev = () => {
    if (photoGalleryRoom?.images) {
      setCurrentGalleryIndex((prev) => (prev - 1 + photoGalleryRoom.images!.length) % photoGalleryRoom.images!.length);
    }
  };

  return (
    <CustomerLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Explore Our Rooms</h1>
            <p className="text-sm text-gray-600 mt-1">Find the perfect space for your stay</p>
          </div>

          {/* Search / Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="Check In"
            />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              disabled={!checkIn}
              min={checkIn}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Check Out"
            />
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            >
              <option value="">Any type</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
              <option value="family">Family</option>
            </select>
            {(checkIn || checkOut || roomType) && (
              <button
                onClick={() => {
                  setCheckIn('');
                  setCheckOut('');
                  setRoomType('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900 underline lg:text-left text-center py-2"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        {!checkIn || !checkOut ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-600 px-4">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm sm:text-base">Select check-in and check-out dates to see availability.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48 sm:h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg border border-gray-200 shadow-sm px-4">
            <Bed className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">No rooms available</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
              We are fully booked at the moment. Please check back later or contact reception.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {rooms.map((room) => (
              <CustomerRoomCard
                key={room._id}
                room={room}
                onBook={handleBookNow}
                onViewPhotos={handleViewAllPhotos}
              />
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {isBookingModalOpen && (
          <NewBookingModal
            onClose={() => setIsBookingModalOpen(false)}
            onComplete={handleBookingComplete}
            selectedRoom={selectedRoom}
            defaultCheckIn={checkIn}
            defaultCheckOut={checkOut}
          />
        )}

        {/* Full Screen Photo Gallery */}
        {photoGalleryRoom && photoGalleryRoom.images && photoGalleryRoom.images.length > 0 && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full h-full flex flex-col p-4 md:p-8">

              {/* Gallery Header */}
              <div className="flex justify-between items-center mb-6 text-white w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 px-5 py-2.5 rounded-xl backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold">{photoGalleryRoom.name || `Room ${photoGalleryRoom.roomNumber}`}</h2>
                  </div>
                  <span className="text-white/40 text-base font-mono tracking-widest">
                    {currentGalleryIndex + 1} / {photoGalleryRoom.images.length}
                  </span>
                </div>
                <button
                  onClick={handleCloseGallery}
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:rotate-90"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              {/* Main Image Stage */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden rounded-3xl w-full max-w-7xl mx-auto mb-6 group">
                <img
                  src={photoGalleryRoom.images[currentGalleryIndex]}
                  alt={`Gallery ${currentGalleryIndex}`}
                  className="max-w-full max-h-[80vh] object-contain drop-shadow-2xl rounded-xl"
                />

                {/* Navigation Arrows */}
                {photoGalleryRoom.images.length > 1 && (
                  <>
                    <button
                      onClick={handleGalleryPrev}
                      className="absolute left-6 md:left-10 bg-black/50 hover:bg-white text-white hover:text-black p-5 rounded-full backdrop-blur-md transition-all border border-white/10 hover:scale-110"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                      onClick={handleGalleryNext}
                      className="absolute right-6 md:right-10 bg-black/50 hover:bg-white text-white hover:text-black p-5 rounded-full backdrop-blur-md transition-all border border-white/10 hover:scale-110"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {photoGalleryRoom.images.length > 1 && (
                <div className="h-28 flex gap-4 overflow-x-auto justify-center items-center pb-2 w-full max-w-7xl mx-auto px-4">
                  {photoGalleryRoom.images.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentGalleryIndex(idx)}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${idx === currentGalleryIndex ? 'border-blue-500 scale-110 shadow-lg z-10 opacity-100' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                        }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumb ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}