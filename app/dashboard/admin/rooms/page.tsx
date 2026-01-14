// app/dashboard/admin/rooms/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast"; // Switched to hot-toast for consistency
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import RoomFilters from "../../../components/rooms/RoomFilters";
import RoomForm from "../../../components/rooms/RoomForm";
import CheckInForm from "../../../components/rooms/CheckInForm";
import RoomsList from "../../../components/rooms/RoomsList";
import { Grid, List, Plus, Filter } from "lucide-react";
import { auth } from "@/app/lib/firebase"; // Import Auth

type RoomStatus =
  | "available" 
  | "occupied"
  | "reserved"
  | "cleaning"
  | "maintenance";

type RoomType = "single" | "double" | "suite" | "family";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  rate: number;
  amenities: string[];
  maxOccupancy: number;
  floor: number;
}

export default function Rooms() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  // ✅ ADDED: State to track if the form is in View-Only mode
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // ✅ STATE: Initialize empty, fetch from backend
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-in form state
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInRoom, setCheckInRoom] = useState<Room | null>(null);
  const [checkInGuest, setCheckInGuest] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    bookingHistory: [],
  });
  const [checkInErrors, setCheckInErrors] = useState<{ [key: string]: string }>({});

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");

  // New/Edit Room state template
  const [newRoom, setNewRoom] = useState<Room>({
    id: "",
    number: "",
    type: "single",
    status: "available",
    rate: 0,
    amenities: [],
    maxOccupancy: 1,
    floor: 1,
  });

  // ✅ FETCH ROOMS FUNCTION
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return; 

      const token = await user.getIdToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const mappedRooms = data.map((r: any) => ({
            id: r._id,
            number: r.roomNumber, 
            type: r.type,
            status: r.status.toLowerCase(), 
            rate: r.rate,
            amenities: r.amenities,
            maxOccupancy: r.maxOccupancy,
            floor: r.floor
        }));
        
        setRooms(mappedRooms);
      } else {
        console.error("Failed to fetch rooms:", res.statusText);
        toast.error("Failed to load rooms");
      }
    } catch (error) {
      console.error("Failed to fetch rooms", error);
      toast.error("Error loading rooms");
    } finally {
      setLoading(false);
    }
  };

  // ✅ EFFECT: Load rooms on mount / auth change
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            fetchRooms();
        } else {
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);

  const resetRoomForm = () => {
    setNewRoom({
      id: "",
      number: "",
      type: "single",
      status: "available",
      rate: 0,
      amenities: [],
      maxOccupancy: 1,
      floor: 1,
    });
    setEditingRoom(null);
    setIsViewOnly(false); // ✅ RESET view only state
    setErrors({});
  };

  const resetCheckInForm = () => {
    setShowCheckInForm(false);
    setCheckInRoom(null);
    setCheckInGuest({ id: "", name: "", email: "", phone: "", bookingHistory: [] });
    setCheckInErrors({});
  };

  // ✅ HANDLER: Called when RoomForm successfully saves/updates
  const handleRoomSaved = () => {
    fetchRooms(); // Refresh the list from backend
    setShowAddForm(false);
    resetRoomForm();
  };

  const handleCheckIn = (room: Room) => {
    setCheckInRoom(room);
    setShowCheckInForm(true);
  };

  const handleCheckOut = async (room: Room) => {
    if (window.confirm(`Check out guest from Room ${room.number}?`)) {
        handleStatusChange(room.id, "cleaning");
        toast.success(`Guest checked out from Room ${room.number}`);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setNewRoom(room);
    setIsViewOnly(false); // ✅ Ensure editing is allowed
    setShowAddForm(true);
  };

  // ✅ NEW HANDLER: For viewing without editing
  const handleViewRoom = (room: Room) => {
    setEditingRoom(room);
    setNewRoom(room);
    setIsViewOnly(true); // ✅ Set to View Only mode
    setShowAddForm(true);
  };

  const handleDeleteRoom = async (room: Room) => {
    if (window.confirm(`Are you sure you want to delete Room ${room.number}?`)) {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const res = await fetch(`${API_URL}/api/rooms/${room.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            toast.success(`Room ${room.number} deleted successfully`);
            fetchRooms(); // Refresh list
        } else {
            throw new Error("Failed to delete");
        }
      } catch (e) {
        console.error(e);
        toast.error("Could not delete room");
      }
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, status: newStatus } : room
      )
    );

    try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const backendStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

        await fetch(`${API_URL}/api/rooms/${roomId}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ status: backendStatus })
        });
    } catch (error) {
        console.error("Status update failed", error);
        toast.error("Failed to update status on server");
        fetchRooms(); // Revert on failure
    }
  };

  const handleProcessCheckIn = () => {
    const newErrors: { [key: string]: string } = {};
    if (!checkInGuest.name.trim()) newErrors.name = "Guest name is required";
    if (!checkInGuest.email.trim()) newErrors.email = "Email is required";
    if (!checkInGuest.phone.trim())
      newErrors.phone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setCheckInErrors(newErrors);
      return;
    }
    
    toast.success("Guest Checked In!");
    resetCheckInForm();
  };

  // Filter Logic
  const filteredRooms = rooms.filter(
    (room) =>
      (statusFilter === "all" || room.status === statusFilter) &&
      (typeFilter === "all" || room.type === typeFilter) &&
      (floorFilter === "all" || room.floor.toString() === floorFilter) &&
      room.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status Counts (Dynamic)
  const statusCounts = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "reserved", label: "Reserved" },
    { value: "cleaning", label: "Needs Cleaning" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "suite", label: "Suite" },
    { value: "family", label: "Family" },
  ];

  const floorOptions = [
    { value: "all", label: "All Floors" },
    { value: "1", label: "Floor 1" },
    { value: "2", label: "Floor 2" },
    { value: "3", label: "Floor 3" },
  ];

  return (
    <AdminReceptionistLayout role="admin">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Room Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage {statusCounts.total} rooms across the hotel
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-soft text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-soft text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition group"
              onClick={() => {
                  setShowAddForm(true);
                  setIsViewOnly(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Add Room
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="border rounded-lg p-4 text-center shadow-sm hover:shadow-md transition bg-white border-gray-100">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {statusCounts.total}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Rooms</div>
          </div>
          <div className="border rounded-lg p-4 text-center shadow-sm hover:shadow-md transition bg-green-50 border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {statusCounts.available}
            </div>
            <div className="text-sm text-green-700 font-medium">Available</div>
          </div>
          <div className="border rounded-lg p-4 text-center shadow-sm hover:shadow-md transition bg-red-50 border-red-200">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {statusCounts.occupied}
            </div>
            <div className="text-sm text-red-700 font-medium">Occupied</div>
          </div>
          <div className="border rounded-lg p-4 text-center shadow-sm hover:shadow-md transition bg-yellow-50 border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {statusCounts.cleaning}
            </div>
            <div className="text-sm text-yellow-700 font-medium">
              Needs Cleaning
            </div>
          </div>
          <div className="border rounded-lg p-4 text-center shadow-sm hover:shadow-md transition bg-gray-50 border-gray-200">
            <div className="text-3xl font-bold text-gray-600 mb-1">
              {statusCounts.maintenance}
            </div>
            <div className="text-sm text-gray-700 font-medium">Maintenance</div>
          </div>
        </div>

        {/* Filters */}
        <RoomFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          floorFilter={floorFilter}
          setFloorFilter={setFloorFilter}
          statusOptions={statusOptions}
          typeOptions={typeOptions}
          floorOptions={floorOptions}
          onClearFilters={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setTypeFilter("all");
            setFloorFilter("all");
          }}
        />

        {/* Modal: Room Form */}
        {showAddForm && (
          <RoomForm
            newRoom={newRoom}
            setNewRoom={setNewRoom}
            errors={errors}
            setErrors={setErrors}
            editingRoom={editingRoom}
            onClose={() => {
              setShowAddForm(false);
              resetRoomForm();
            }}
            onSave={handleRoomSaved}
            readOnly={isViewOnly} // ✅ PASSED: View-Only Mode status
          />
        )}

        {/* Modal: Check In Form */}
        {showCheckInForm && checkInRoom && (
          <CheckInForm
            room={checkInRoom}
            guest={checkInGuest}
            onCheckIn={handleProcessCheckIn}
          />
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-navy-600 font-medium">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </p>
          <div className="flex items-center space-x-2 text-sm text-navy-500">
            <Filter className="h-4 w-4" />
            <span>
              Filtered by:{" "}
              {statusFilter !== "all" && `Status: ${statusFilter} `}
              {typeFilter !== "all" && `Type: ${typeFilter} `}
              {floorFilter !== "all" && `Floor: ${floorFilter}`}
              {statusFilter === "all" &&
              typeFilter === "all" &&
              floorFilter === "all"
                ? "All"
                : ""}
            </span>
          </div>
        </div>

        {/* Rooms List */}
        {loading ? (
           <div className="text-center py-12">Loading rooms...</div>
        ) : (
          <RoomsList
            rooms={filteredRooms}
            viewMode={viewMode}
            onEdit={handleEditRoom}
            onView={handleViewRoom} // ✅ FIXED: Uses correct view handler
            onStatusChange={handleStatusChange}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onDelete={handleDeleteRoom}
          />
        )}

        {/* Empty State */}
        {!loading && filteredRooms.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No rooms found
            </h3>
            Try adjusting your filters to see more results.
          </div>
        )}
      </div>
    </AdminReceptionistLayout>
  );
}