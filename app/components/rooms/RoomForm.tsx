"use client";

import { X, Save } from "lucide-react";
import { auth } from "@/app/lib/firebase"; 
import toast from "react-hot-toast";

type RoomStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
type RoomType = "single" | "double" | "suite" | "family";

interface Room {
  id: string;
  _id?: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  rate: number;
  amenities: string[];
  maxOccupancy: number;
  floor: number;
}

interface RoomFormProps {
  newRoom: Room;
  setNewRoom: (room: Room) => void;
  errors: { [key: string]: string };
  setErrors: (errors: { [key: string]: string }) => void;
  editingRoom: Room | null;
  onClose: () => void;
  onSave: () => void;
  readOnly?: boolean; // ✅ ADDED: Optional prop for View-Only mode
}

const amenitiesList = ["WiFi", "TV", "AC", "Mini Bar", "Balcony", "Jacuzzi", "Kitchenette", "Safe"];

export default function RoomForm({
  newRoom,
  setNewRoom,
  errors,
  setErrors,
  editingRoom,
  onClose,
  onSave,
  readOnly = false, // ✅ ADDED: Default to false
}: RoomFormProps) {

  const handleSave = async () => {
    if (readOnly) return; // Prevent save in read-only mode
    if (Object.keys(errors).length > 0) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in.");
        return;
      }
      const token = await user.getIdToken();

      const backendStatus = newRoom.status.charAt(0).toUpperCase() + newRoom.status.slice(1);

      const payload = {
        roomNumber: newRoom.number, 
        type: newRoom.type,
        status: backendStatus, 
        rate: Number(newRoom.rate),
        floor: Number(newRoom.floor),
        maxOccupancy: Number(newRoom.maxOccupancy),
        amenities: newRoom.amenities
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const roomId = editingRoom?.id || editingRoom?._id;

      // Use PUT for editing (full update)
      const url = editingRoom 
        ? `${API_URL}/api/rooms/${roomId}` 
        : `${API_URL}/api/rooms`;
      
      const method = editingRoom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `API Error: ${response.status}`);
      }

      toast.success(editingRoom ? "Room updated!" : "Room created!");
      onSave(); 

    } catch (error: any) {
      console.error("Failed to save room:", error);
      toast.error(error.message || "Failed to save room.");
    }
  };

  return (
    <div className="card bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {readOnly ? "Room Details" : editingRoom ? "Edit Room" : "Add New Room"}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Room Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
          <input
            type="text"
            disabled={readOnly}
            value={newRoom.number || ""}
            onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
            placeholder="e.g. 101"
          />
        </div>

        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
          <select
            disabled={readOnly}
            value={newRoom.type || "single"}
            onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as RoomType })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
          >
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="suite">Suite</option>
            <option value="family">Family</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            disabled={readOnly}
            value={newRoom.status || "available"}
            onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value as RoomStatus })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="cleaning">Cleaning</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Night ($)</label>
          <input
            type="number"
            disabled={readOnly}
            value={newRoom.rate || ""}
            onChange={(e) => setNewRoom({ ...newRoom, rate: parseFloat(e.target.value) || 0 })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
            min="0"
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <input
            type="number"
            disabled={readOnly}
            value={newRoom.floor || ""}
            onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) || 1 })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
            min="1"
          />
        </div>

        {/* Max Occupancy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Occupancy</label>
          <input
            type="number"
            disabled={readOnly}
            value={newRoom.maxOccupancy || ""}
            onChange={(e) => setNewRoom({ ...newRoom, maxOccupancy: parseInt(e.target.value) || 1 })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
            min="1"
          />
        </div>

        {/* Amenities */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {amenitiesList.map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={newRoom.amenities?.includes(amenity) || false}
                  onChange={(e) => {
                    if (readOnly) return;
                    const current = newRoom.amenities || [];
                    const updated = e.target.checked
                      ? [...current, amenity]
                      : current.filter((a) => a !== amenity);
                    setNewRoom({ ...newRoom, amenities: updated });
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 disabled:text-gray-400"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ✅ FIXED: Hide Save button in read-only mode */}
        {!readOnly && (
          <div className="md:col-span-3 flex justify-end">
             <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center font-medium"
             >
               <Save className="w-4 h-4 mr-2" />
               {editingRoom ? "Update Room" : "Save Room"}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}