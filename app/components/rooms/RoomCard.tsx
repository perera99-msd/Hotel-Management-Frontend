"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bed,
  Users,
  Wifi,
  Tv,
  Wind,
  Coffee,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Eye,
  Trash2,
  LogIn,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "@/app/lib/firebase";

// --- Type Definitions ---
export interface Room {
  id: string;
  _id?: string; // Added fallback for Mongo
  number: string;
  roomNumber?: string; // Added fallback
  type: "single" | "double" | "suite" | "family";
  status: "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
  rate: number;
  amenities: string[];
  maxOccupancy: number;
  floor: number;
  needsCleaning?: boolean;
  cleaningNotes?: string;
  lastCleaned?: Date;
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Helper to get token
  const getToken = async () => {
    const user = auth.currentUser;
    if(!user) throw new Error("Not authenticated");
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
      if(!booking) {
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
      if(!booking) {
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
      const backendStatus = status.charAt(0).toUpperCase() + status.slice(1);
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
      toast.success(`Status updated to ${status}`);

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
    if(onView) {
        onView(room);
        return;
    }
    toast.success("View action triggered");
  };


  // handleEdit Function
  const handleEdit = async (room: Room) => {
    if(onEdit) {
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
          color: "border-red-500 text-red-700",
          icon: Users,
          text: "Occupied",
          bg: "bg-red-50 border-red-200",
        };
      case "reserved":
        return {
          color: "border-yellow-500 text-yellow-700",
          icon: Clock,
          text: "Reserved",
          bg: "bg-yellow-50 border-yellow-200",
        };
      case "cleaning":
        return {
          color: "border-yellow-500 text-yellow-700",
          icon: AlertTriangle,
          text: "Cleaning",
          bg: "bg-yellow-50 border-yellow-200",
        };
      case "maintenance":
        return {
          color: "border-blue-500 text-blue-700",
          icon: AlertTriangle,
          text: "Maintenance",
          bg: "bg-blue-50 border-blue-200",
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi": return <Wifi className="h-3 w-3" />;
      case "tv": return <Tv className="h-3 w-3" />;
      case "ac": return <Wind className="h-3 w-3" />;
      case "mini bar": return <Coffee className="h-3 w-3" />;
      default: return null;
    }
  };

  const statusConfig = getStatusConfig(room.status);
  const StatusIcon = statusConfig.icon;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  return (
    <div className={`room-card ${statusConfig.bg} group p-4 rounded-lg border-2 border-gray-800 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl">
            {getRoomTypeIcon(room.type)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Room {roomNum}
            </h3>
            <p className="text-sm text-gray-600 font-medium capitalize">
              {room.type} • Floor {room.floor}
            </p>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color} cursor-pointer`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.text}
            <ChevronDown className="ml-1 h-3 w-3" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-32 bg-white border rounded-lg shadow-md z-10">
              {["available", "occupied", "reserved", "cleaning", "maintenance"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                     handleStatusChange(roomId!, status);
                     setShowDropdown(false);
                  }}
                  className="block w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 capitalize"
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Guest Information */}
      {guest && room.status === "occupied" && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-4 w-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-900">Current Guest</span>
          </div>
          <div className="text-sm text-gray-600 space-y-0.5">
            <div className="font-medium">{guest.name}</div>
            <div className="text-xs px-1 py-0.5 bg-white rounded-full inline-block">{guest.email}</div>
          </div>
        </div>
      )}

      {/* Room Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="font-medium">Rate per night</span>
          <span className="font-bold text-gray-900">${room.rate}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="font-medium">Max occupancy</span>
          <span className="font-bold text-gray-900">{room.maxOccupancy} guests</span>
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
          <span className="font-semibold">Amenities</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {room.amenities.slice(0, 3).map((amenity, index) => (
            <div key={index} className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {getAmenityIcon(amenity)}
              <span>{amenity}</span>
            </div>
          ))}
          {room.amenities.length > 3 && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              +{room.amenities.length - 3} more
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center space-x-2">
        <div className="flex-1 flex justify-center">
          
          {/* ✅ REMOVED: LogIn (Green Enter Icon) button */}
          
          {room.status === "occupied" && onCheckOut && (
            <button onClick={() => handleCheckOut(room)} className="bg-yellow-100 text-yellow-600 p-2 rounded-lg hover:bg-yellow-200 flex-1 max-w-[50px] flex justify-center">
              <LogOut className="h-4 w-4" />
            </button>
          )}

          {/* ✅ RESTORED: "Make Available" button */}
          {room.status === "cleaning" && onStatusChange && (
            <button onClick={() => handleStatusChange(roomId!, "available")} className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200 flex-1 max-w-[50px] flex justify-center">
              <CheckCircle className="h-4 w-4" />
            </button>
          )}

          {/* ✅ RESTORED: "Mark as Cleaning" button */}
          {room.status === "available" && onStatusChange && (
            <button onClick={() => handleStatusChange(roomId!, "cleaning")} className="bg-yellow-100 text-yellow-600 p-2 rounded-lg hover:bg-yellow-200 flex-1 max-w-[50px] flex justify-center">
              <AlertTriangle className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-center space-x-2">
          {onView && (
            <button onClick={() => handleView(room)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 flex-1 max-w-[50px] flex justify-center">
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button onClick={() => handleEdit(room)} className="bg-purple-100 text-purple-600 p-2 rounded-lg hover:bg-purple-200 flex-1 max-w-[50px] flex justify-center">
              <Edit className="h-4 w-4" />
            </button>
          )}
          {/* Delete Button */}
          {onDelete && (
            <button onClick={() => handleDelete(room)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 flex-1 max-w-[50px] flex justify-center">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomCard;