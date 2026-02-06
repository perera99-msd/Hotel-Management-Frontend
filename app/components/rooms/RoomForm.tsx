"use client";

import { auth } from "@/app/lib/firebase";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type RoomStatus = "available" | "occupied" | "reserved" | "needs cleaning" | "maintenance" | "out of order";
type RoomType = "single" | "double" | "suite" | "family";
type RoomTier = "Deluxe" | "Normal";

interface Room {
  id: string;
  _id?: string;
  name?: string;
  number: string;
  type: RoomType;
  tier?: RoomTier;
  status: RoomStatus;
  rate: number;
  amenities: string[];
  maxOccupancy: number;
  floor: number;
  images?: string[]; // ✅ Added images field
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
  const [floors, setFloors] = useState<number[]>([0]);

  useEffect(() => {
    const run = async () => {
      try {
        const user = auth.currentUser; if (!user) return;
        const token = await user.getIdToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${API_URL}/api/settings/floors`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          // Always include ground (0) even if backend omits it
          const uniqueFloors = Array.from(new Set([0, ...(data.floors || [])]));
          const list = uniqueFloors.sort((a: number, b: number) => a - b);
          setFloors(list);
          // Ensure selected floor is valid; default to first (ground) if not
          if (newRoom.floor === undefined || newRoom.floor === null || Number.isNaN(newRoom.floor) || !list.includes(newRoom.floor)) {
            setNewRoom({ ...newRoom, floor: list[0] ?? 0 });
          }
        }
      } catch (e) {
        console.error("Failed to fetch floors", e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (readOnly) return; // Prevent save in read-only mode
    if (Object.keys(errors).length > 0) return;

    try {
      if (newRoom.floor === undefined || newRoom.floor === null || Number.isNaN(newRoom.floor)) {
        toast.error("Floor is required.");
        return;
      }
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in.");
        return;
      }
      const token = await user.getIdToken();

      // Convert frontend status to backend format
      const statusMap: { [key: string]: string } = {
        'available': 'Available',
        'occupied': 'Occupied',
        'reserved': 'Reserved',
        'needs cleaning': 'Needs Cleaning',
        'maintenance': 'Maintenance',
        'out of order': 'Out of Order'
      };
      const backendStatus = statusMap[newRoom.status] || 'Available';

      const payload = {
        name: newRoom.name?.trim() || undefined,
        roomNumber: newRoom.number,
        type: newRoom.type,
        tier: newRoom.tier || 'Normal',
        status: backendStatus,
        rate: Number(newRoom.rate),
        floor: Number(newRoom.floor),
        maxOccupancy: Number(newRoom.maxOccupancy),
        amenities: newRoom.amenities,
        images: newRoom.images || [] // ✅ Include images in payload
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
        {/* Room Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
          <input
            type="text"
            disabled={readOnly}
            value={newRoom.name || ""}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
            placeholder="e.g. Ocean View Suite"
          />
        </div>
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

        {/* Room Tier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            disabled={readOnly}
            value={newRoom.tier || "Normal"}
            onChange={(e) => setNewRoom({ ...newRoom, tier: e.target.value as RoomTier })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
          >
            <option value="Normal">Normal</option>
            <option value="Deluxe">Deluxe</option>
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
            <option value="needs cleaning">Needs Cleaning</option>
            <option value="maintenance">Maintenance</option>
            <option value="out of order">Out of Order</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
          <select
            disabled={readOnly}
            value={newRoom.floor ?? 0}
            onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) })}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
          >
            {floors.map((f) => (
              <option key={f} value={f}>{f === 0 ? 'Ground' : `Floor ${f}`}</option>
            ))}
          </select>
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

        {/* Room Images */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Images (Max 4 URLs)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="url"
                  disabled={readOnly}
                  value={newRoom.images?.[index] || ""}
                  onChange={(e) => {
                    const images = [...(newRoom.images || [])];
                    if (e.target.value) {
                      images[index] = e.target.value;
                    } else {
                      images.splice(index, 1);
                    }
                    setNewRoom({ ...newRoom, images: images.filter(Boolean) });
                  }}
                  className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
                  placeholder={`Image URL ${index + 1}`}
                />
                {/* Preview thumbnail */}
                {newRoom.images?.[index] && (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <img
                      src={newRoom.images[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                        (e.target as HTMLImageElement).style.opacity = '0.3';
                      }}
                    />
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const images = [...(newRoom.images || [])];
                          images.splice(index, 1);
                          setNewRoom({ ...newRoom, images: images.filter(Boolean) });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {newRoom.images && newRoom.images.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{newRoom.images.length} image(s) added</p>
          )}
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