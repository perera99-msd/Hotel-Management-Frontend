"use client";

import { auth } from "@/app/lib/firebase";
import {
  AlertTriangle,
  Bed,
  CheckCircle,
  Clock,
  Coffee,
  Edit,
  Eye,
  LogOut,
  Trash2,
  Tv,
  User,
  Users,
  Wifi,
  Wind
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

// --- Type Definitions ---
export interface Room {
  id: string;
  _id?: string; // Added fallback for Mongo
  name?: string;
  number: string;
  roomNumber?: string; // Added fallback
  type: "single" | "double" | "suite" | "family";
  tier?: "Deluxe" | "Normal";
  status: "available" | "occupied" | "reserved" | "needs cleaning" | "maintenance" | "out of order";
  rate: number;
  amenities: string[];
  maxOccupancy: number;
  floor: number;
  images?: string[]; // ✅ Added images field
  computedStatus?: string; // ✅ Added computed status from backend
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  preferences?: string[];
  bookingHistory: string[];
}

export interface Booking {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled";
  package: "room-only" | "bed-breakfast" | "half-board" | "full-board";
  source: string;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
}

interface RoomCardProps {
  room: Room;
  onEdit?: (room: Room) => void;
  onDuplicate?: (room: Room) => void;
  onStatusChange?: (roomId: string, status: any) => void;
  onView?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  onCheckIn?: (room: Room) => void;
  onCheckOut?: (room: Room) => void;
  guest?: Guest | null;
  booking?: Booking | null;
}

function RoomCard({
  room,
  onEdit,
  onDuplicate,
  onStatusChange,
  onView,
  onDelete,
  onCheckIn,
  onCheckOut,
  guest,
  booking,
}: RoomCardProps): React.ReactElement {

  // Safe ID and Number extraction
  const roomId = room.id || room._id;
  const roomNum = room.number || room.roomNumber;
  const roomName = room.name || roomNum;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Helper to get token
  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    return await user.getIdToken();
  };

  // handleCheckIn Function
  const handleCheckIn = async (room: Room) => {
    if (onCheckIn) {
      onCheckIn(room);
      return;
    }
    // Fallback internal logic
    try {
      if (!booking) {
        toast.error("No booking found to check in.");
        return;
      }
      const token = await getToken();
      const endpoint = `${API_URL}/api/bookings/${booking.id}/checkin`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      toast.success("Guest Checked In");
      window.location.reload();

    } catch (error) {
      console.error("Failed to check in:", error);
      toast.error("Failed to check in.");
    }
  };


  // handleCheckOut Function
  const handleCheckOut = async (room: Room) => {
    if (onCheckOut) {
      onCheckOut(room);
      return;
    }
    // Fallback internal logic
    try {
      if (!booking) {
        handleStatusChange(roomId!, 'cleaning');
        return;
      }
      const token = await getToken();
      const endpoint = `${API_URL}/api/bookings/${booking.id}/checkout`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      toast.success("Guest Checked Out");
      window.location.reload();

    } catch (error) {
      console.error("Failed to check out:", error);
      toast.error("Failed to check out.");
    }
  };


  // handleStatusChange Function
  const handleStatusChange = async (rId: string, status: string) => {
    // Delegate to parent if available
    if (onStatusChange) {
      onStatusChange(rId, status);
      return;
    }

    try {
      const token = await getToken();
      // Convert frontend status to backend format
      const statusMap: { [key: string]: string } = {
        'available': 'Available',
        'occupied': 'Occupied',
        'reserved': 'Reserved',
        'needs cleaning': 'Needs Cleaning',
        'maintenance': 'Maintenance',
        'out of order': 'Out of Order'
      };
      const backendStatus = statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
      const endpoint = `${API_URL}/api/rooms/${rId}/status`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: backendStatus
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      toast.success(`Status updated to ${backendStatus}`);

    } catch (error) {
      console.error("Failed to update room status:", error);
      toast.error("Failed to update room status.");
    }
  };

  // handleDelete Function
  const handleDelete = async (room: Room) => {
    // Delegate to parent if available (Stops double delete)
    if (onDelete) {
      onDelete(room);
      return;
    }

    // Only run this if NO parent handler is provided
    if (!confirm(`Are you sure you want to delete Room ${roomNum}?`)) return;

    try {
      const token = await getToken();
      const endpoint = `${API_URL}/api/rooms/${roomId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      toast.success("Room deleted successfully");

    } catch (error) {
      console.error("Failed to delete room:", error);
      toast.error("Failed to delete room.");
    }
  };


  // handleView Function
  const handleView = async (room: Room) => {
    if (onView) {
      onView(room);
      return;
    }
    toast.success("View action triggered");
  };


  // handleEdit Function
  const handleEdit = async (room: Room) => {
    if (onEdit) {
      onEdit(room);
      return;
    }
    toast.success("Edit action triggered");
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || 'available';
    switch (s) {
      case "available":
        return {
          color: "border-green-500 text-green-700",
          icon: CheckCircle,
          text: "Available",
          bg: "bg-green-50 border-green-200",
        };
      case "occupied":
        return {
          color: "border-blue-500 text-blue-700",
          icon: Users,
          text: "Occupied",
          bg: "bg-blue-50 border-blue-200",
        };
      case "reserved":
        return {
          color: "border-amber-500 text-amber-700",
          icon: Clock,
          text: "Reserved",
          bg: "bg-amber-50 border-amber-200",
        };
      case "needs cleaning":
      case "cleaning":
        return {
          color: "border-red-500 text-red-700",
          icon: AlertTriangle,
          text: "Needs Cleaning",
          bg: "bg-red-50 border-red-200",
        };
      case "maintenance":
        return {
          color: "border-purple-500 text-purple-700",
          icon: AlertTriangle,
          text: "Maintenance",
          bg: "bg-purple-50 border-purple-200",
        };
      case "out of order":
        return {
          color: "border-gray-500 text-gray-700",
          icon: AlertTriangle,
          text: "Out of Order",
          bg: "bg-gray-50 border-gray-200",
        };
      default:
        return {
          color: "border-green-500 text-green-700",
          icon: CheckCircle,
          text: "Available",
          bg: "bg-green-50 border-green-200",
        };
    }
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case "single": return <Bed className="h-4 w-4 text-gray-900" />;
      case "double": return <Users className="h-4 w-4 text-gray-900" />;
      case "suite": return <Bed className="h-4 w-4 text-gray-900" />;
      case "family": return <Users className="h-4 w-4 text-gray-900" />;
      default: return <Bed className="h-4 w-4 text-gray-900" />;
    }
  };

  const getTierConfig = (tier?: string) => {
    const t = (tier || "Normal").toLowerCase();
    return t === "deluxe"
      ? { label: "Deluxe", classes: "bg-amber-100 text-amber-800 border-amber-200" }
      : { label: "Normal", classes: "bg-gray-100 text-gray-800 border-gray-200" };
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi": return <Wifi className="h-3 w-3" />;
      case "tv": return <Tv className="h-3 w-3" />;
      case "ac": return <Wind className="h-3 w-3" />;
      case "mini bar": return <Coffee className="h-3 w-3" />;
      default: return null;
    }
  };

  // ✅ Use computedStatus if available, otherwise use status
  // Normalize to lowercase for consistent comparison
  const displayStatus = (room.computedStatus || room.status).toLowerCase();
  const statusConfig = getStatusConfig(displayStatus);
  const StatusIcon = statusConfig.icon;
  const tierConfig = getTierConfig(room.tier);

  // ✅ Get first image for display
  const roomImage = room.images && room.images.length > 0 ? room.images[0] : null;

  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    if (showDropdown || showStatusMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, showStatusMenu]);

  // Quick status change handler with toast
  const quickStatusChange = async (status: string) => {
    setShowStatusMenu(false);
    // Normalize to lowercase for frontend
    const normalizedStatus = status.toLowerCase();
    await handleStatusChange(roomId!, normalizedStatus);
    // No reload needed - parent component will handle state update
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-visible flex flex-col h-full">
      {/* ✅ Room Image Header */}
      <div className="relative h-36 w-full bg-gray-200 overflow-hidden">
        {roomImage ? (
          <img
            src={roomImage}
            alt={roomName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Bed className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Room Type Badge */}
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
          {room.type}
        </div>

        {/* Tier Badge */}
        {room.tier === "Deluxe" && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
            ⭐ Deluxe
          </div>
        )}

        {/* Image Count Badge */}
        {room.images && room.images.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium">
            {room.images.length} photos
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-3 right-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color} bg-white/95 backdrop-blur-sm flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.text}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Room Title & Number */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{roomName}</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Room {roomNum} • Floor {room.floor === 0 ? "Ground" : room.floor} • ID: {roomId?.slice(0, 8)}...
          </p>
        </div>

        {/* Room Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
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
              <p className="text-xs text-gray-500 font-semibold">Type</p>
              <p className="text-sm font-bold text-gray-900 capitalize">{room.type}</p>
            </div>
          </div>
        </div>

        {/* Amenities List */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 4).map((amenity, idx) => (
                <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-700 border border-gray-200">
                  {getAmenityIcon(amenity)}
                  <span className="ml-1">{amenity}</span>
                </span>
              ))}
              {room.amenities.length > 4 && (
                <span className="text-xs text-gray-500 px-2.5 py-1 font-medium">+{room.amenities.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Guest Information - if occupied */}
        {guest && displayStatus === "occupied" && (
          <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-1">
              <User className="h-4 w-4 text-gray-700" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Current Guest</span>
            </div>
            <div className="text-sm text-gray-900 font-semibold">{guest.name}</div>
            <div className="text-xs text-gray-600 mt-1">{guest.email}</div>
          </div>
        )}

        {/* Price and Actions */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Rate per night</p>
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-gray-900">${room.rate}</span>
                <span className="text-xs font-normal text-gray-500 ml-1">/night</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Make Available Button - Only show when NOT available */}
            {displayStatus !== "available" && displayStatus !== "occupied" && (
              <button
                onClick={() => quickStatusChange("Available")}
                className="bg-green-100 hover:bg-green-200 text-green-800 border border-green-200 px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition"
                title="Mark as Available"
              >
                <CheckCircle className="h-4 w-4" />
                Make Available
              </button>
            )}

            {/* Quick Status Change Dropdown */}
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition"
                title="Change Status"
              >
                <AlertTriangle className="h-4 w-4" />
                Change Status
              </button>
              {showStatusMenu && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => quickStatusChange("Available")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-700 font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Available
                    </button>
                    <button
                      onClick={() => quickStatusChange("Reserved")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 text-amber-700 font-medium flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Reserved
                    </button>
                    <button
                      onClick={() => quickStatusChange("Needs Cleaning")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-orange-50 text-orange-700 font-medium flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Needs Cleaning
                    </button>
                    <button
                      onClick={() => quickStatusChange("Maintenance")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-purple-700 font-medium flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Maintenance
                    </button>
                    <button
                      onClick={() => quickStatusChange("Out of Order")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-700 font-medium flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Out of Order
                    </button>
                  </div>
                </div>
              )}
            </div>

            {displayStatus === "occupied" && onCheckOut && (
              <button
                onClick={() => handleCheckOut(room)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition"
              >
                <LogOut className="h-4 w-4" />
                Check Out
              </button>
            )}

            <button
              onClick={() => handleView(room)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
              View
            </button>

            <button
              onClick={() => handleEdit(room)}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition"
              title="Edit Room"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>

            {onDelete && (
              <button
                onClick={() => handleDelete(room)}
                className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 p-2 rounded-lg flex items-center justify-center transition"
                title="Delete Room"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomCard;