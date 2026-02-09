/* */
"use client";

import { Check, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface DealUpdateModelProps {
  isOpen: boolean;
  onClose: () => void;
  dealData: any;
  onUpdate: (updatedData: any) => void;
  isUpdating: boolean;
}

export default function DealUpdateModel({ isOpen, onClose, dealData, onUpdate }: DealUpdateModelProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<any>({});
  const [isLocalUpdating, setIsLocalUpdating] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tripPackages, setTripPackages] = useState<any[]>([]);
  const [monthlyRatePreview, setMonthlyRatePreview] = useState<number | null>(null);

  const availableRooms = rooms.filter((room) => (room.status || '').toLowerCase() === 'available' || formData.roomIds?.includes(room._id));

  useEffect(() => {
    if (dealData) {
      setFormData({
        id: dealData.id || dealData._id,
        dealName: dealData.dealName || "",
        referenceNumber: dealData.referenceNumber || "",
        description: dealData.description || "",
        dealType: dealData.dealType || "room",
        discountType: dealData.discountType || "percentage",
        roomIds: Array.isArray(dealData.roomIds) ? dealData.roomIds : [],
        menuItemIds: Array.isArray(dealData.menuItemIds) ? dealData.menuItemIds : [],
        tripPackageIds: Array.isArray(dealData.tripPackageIds) ? dealData.tripPackageIds : [],
        discount: dealData.discount || 0,
        startDate: dealData.startDate || "",
        endDate: dealData.endDate || "",
        status: dealData.status || "New",
        reservationsLeft: dealData.reservationsLeft || 50,
        image: dealData.image || "" // ✅ Load image
      });
    }
  }, [dealData]);

  // Calculate monthly rate preview
  useEffect(() => {
    if (formData.roomIds?.length === 1 && formData.startDate) {
      const room = rooms.find(r => r._id === formData.roomIds[0]);
      if (room) {
        const startMonth = new Date(formData.startDate).getMonth();
        const monthlyRates = room.monthlyRates || [];
        const rate = monthlyRates[startMonth] || room.rate || 0;
        setMonthlyRatePreview(rate);
      }
    } else {
      setMonthlyRatePreview(null);
    }
  }, [formData.roomIds, formData.startDate, rooms]);

  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      roomIds: prev.dealType === 'room' ? prev.roomIds : [],
      menuItemIds: prev.dealType === 'food' ? prev.menuItemIds : [],
      tripPackageIds: prev.dealType === 'trip' ? prev.tripPackageIds : []
    }));
  }, [formData.dealType]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!isOpen || !token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };
    const fetchMenu = async () => {
      if (!isOpen || !token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/menu`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch menu items", err);
      }
    };
    const fetchTrips = async () => {
      if (!isOpen || !token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trips`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTripPackages(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch trip packages", err);
      }
    };
    fetchRooms();
    fetchMenu();
    fetchTrips();
  }, [isOpen, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleRoomToggle = (roomId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      roomIds: Array.isArray(prev.roomIds) && prev.roomIds.includes(roomId)
        ? prev.roomIds.filter((id: string) => id !== roomId)
        : [...(prev.roomIds || []), roomId]
    }));
  };

  const handleMenuItemToggle = (menuItemId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      menuItemIds: Array.isArray(prev.menuItemIds) && prev.menuItemIds.includes(menuItemId)
        ? prev.menuItemIds.filter((id: string) => id !== menuItemId)
        : [...(prev.menuItemIds || []), menuItemId]
    }));
  };

  const handleTripPackageToggle = (tripPackageId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tripPackageIds: Array.isArray(prev.tripPackageIds) && prev.tripPackageIds.includes(tripPackageId)
        ? prev.tripPackageIds.filter((id: string) => id !== tripPackageId)
        : [...(prev.tripPackageIds || []), tripPackageId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsLocalUpdating(true);

    if (!formData.dealName || !formData.referenceNumber || !formData.startDate || !formData.endDate) {
      alert("Please fill all required fields");
      setIsLocalUpdating(false);
      return;
    }

    if (formData.dealType === 'room' && (!formData.roomIds || formData.roomIds.length === 0)) {
      alert("Please select at least one room");
      setIsLocalUpdating(false);
      return;
    }

    if (formData.dealType === 'food' && (!formData.menuItemIds || formData.menuItemIds.length === 0)) {
      alert("Please select at least one menu item");
      setIsLocalUpdating(false);
      return;
    }

    if (formData.dealType === 'trip' && (!formData.tripPackageIds || formData.tripPackageIds.length === 0)) {
      alert("Please select at least one trip package");
      setIsLocalUpdating(false);
      return;
    }

    if (formData.discountType === 'percentage' && !formData.discount) {
      alert("Please provide a discount percentage");
      setIsLocalUpdating(false);
      return;
    }

    try {
      // Extract room types from selected rooms
      const selectedRoomTypes = [...new Set(
        formData.roomIds.map((id: string) => rooms.find(r => r._id === id)?.type).filter(Boolean)
      )];

      const updateData = {
        ...formData,
        discount: formData.discountType === 'percentage' ? parseFloat(formData.discount) : 0,
        roomTypes: selectedRoomTypes,
        price: 0, // Price is calculated from monthly rate + discount
        image: formData.image // ✅ Include image
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/deals/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update deal");
      }

      const data = await response.json();
      onUpdate(data);
      onClose();
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error.message || "Failed to update deal");
    } finally {
      setIsLocalUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 z-10 bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">Update Deal</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name <span className="text-red-500">*</span></label>
              <input name="dealName" value={formData.dealName || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Summer Special" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference No <span className="text-red-500">*</span></label>
              <input name="referenceNumber" value={formData.referenceNumber || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. SUM-2026" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type <span className="text-red-500">*</span></label>
              <select
                name="dealType"
                value={formData.dealType || 'room'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="room">Room</option>
                <option value="food">Food</option>
                <option value="trip">Trip</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type <span className="text-red-500">*</span></label>
              <select
                name="discountType"
                value={formData.discountType || 'percentage'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="percentage">Percentage</option>
                <option value="bogo">Buy One Get One</option>
              </select>
              {formData.dealType !== 'food' && formData.discountType === 'bogo' && (
                <p className="text-xs text-amber-600 mt-2">BOGO is best for food deals.</p>
              )}
            </div>
          </div>

          {/* Step 1: Select Targets */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Step 1: Select {formData.dealType === 'room' ? 'Room(s)' : formData.dealType === 'food' ? 'Menu Item(s)' : 'Trip Package(s)'} <span className="text-red-500">*</span>
            </h3>
            {formData.dealType === 'room' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                {availableRooms.length === 0 ? (
                  <div className="col-span-full p-4 bg-gray-50 border border-dashed rounded-lg text-center text-sm text-gray-500">No available rooms</div>
                ) : (
                  availableRooms.map((room) => {
                    const selected = Array.isArray(formData.roomIds) && formData.roomIds.includes(room._id);
                    return (
                      <button
                        key={room._id}
                        type="button"
                        onClick={() => handleRoomToggle(room._id)}
                        className={`p-3 border rounded-lg text-left transition-all relative ${selected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:border-blue-300 bg-white'}`}
                      >
                        {selected && <Check className="h-4 w-4 text-blue-600 absolute top-2 right-2" />}
                        <div className="font-bold text-gray-900 text-sm">Room {room.roomNumber}</div>
                        <div className="text-gray-500 text-xs">{room.type}</div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {formData.dealType === 'food' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {menuItems.length === 0 ? (
                  <div className="col-span-full p-4 bg-gray-50 border border-dashed rounded-lg text-center text-sm text-gray-500">No menu items found</div>
                ) : (
                  menuItems.map((item) => {
                    const selected = Array.isArray(formData.menuItemIds) && formData.menuItemIds.includes(item._id);
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleMenuItemToggle(item._id)}
                        className={`p-3 border rounded-lg text-left transition-all relative ${selected ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'hover:border-emerald-300 bg-white'}`}
                      >
                        {selected && <Check className="h-4 w-4 text-emerald-600 absolute top-2 right-2" />}
                        <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                        <div className="text-gray-500 text-xs capitalize">{item.category}</div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {formData.dealType === 'trip' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {tripPackages.length === 0 ? (
                  <div className="col-span-full p-4 bg-gray-50 border border-dashed rounded-lg text-center text-sm text-gray-500">No trip packages found</div>
                ) : (
                  tripPackages.map((trip) => {
                    const selected = Array.isArray(formData.tripPackageIds) && formData.tripPackageIds.includes(trip._id);
                    return (
                      <button
                        key={trip._id}
                        type="button"
                        onClick={() => handleTripPackageToggle(trip._id)}
                        className={`p-3 border rounded-lg text-left transition-all relative ${selected ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'hover:border-purple-300 bg-white'}`}
                      >
                        {selected && <Check className="h-4 w-4 text-purple-600 absolute top-2 right-2" />}
                        <div className="font-bold text-gray-900 text-sm">{trip.name}</div>
                        <div className="text-gray-500 text-xs">{trip.location}</div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {formData.dealType === 'room' && formData.roomIds?.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">{formData.roomIds.length} room(s) selected</p>
            )}
            {formData.dealType === 'food' && formData.menuItemIds?.length > 0 && (
              <p className="text-sm text-emerald-600 mt-2">{formData.menuItemIds.length} item(s) selected</p>
            )}
            {formData.dealType === 'trip' && formData.tripPackageIds?.length > 0 && (
              <p className="text-sm text-purple-600 mt-2">{formData.tripPackageIds.length} package(s) selected</p>
            )}
          </div>

          {/* Step 2: Time Period */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Step 2: Set Time Period <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" name="endDate" value={formData.endDate || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Step 3: Discount */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Step 3: Apply Discount <span className="text-red-500">*</span></h3>
            {formData.dealType === 'room' && monthlyRatePreview !== null && formData.roomIds?.length === 1 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Current Monthly Rate:</span>
                  <span className="text-lg font-bold text-blue-700">${monthlyRatePreview.toFixed(2)}/night</span>
                </div>
                <p className="text-xs text-gray-500">
                  Month: {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Not set'}
                </p>
              </div>
            ) : formData.dealType === 'room' && formData.roomIds?.length > 1 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700">
                Multiple rooms selected. Discount will apply to each room's monthly rate.
              </div>
            ) : formData.dealType === 'room' ? (
              <div className="bg-gray-50 border border-dashed rounded-lg p-3 mb-4 text-sm text-gray-500">
                Select a room and start date to see the monthly rate
              </div>
            ) : null}
            {formData.discountType === 'percentage' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%) <span className="text-red-500">*</span></label>
                <input
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount || 0}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 15"
                />
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                Buy one get one will apply to matching menu items at checkout.
              </div>
            )}
            {formData.dealType === 'room' && monthlyRatePreview !== null && formData.discount && formData.discountType === 'percentage' && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-gray-600">Discounted Rate:</span>
                <span className="font-bold text-emerald-600">
                  ${(monthlyRatePreview * (1 - parseFloat(formData.discount) / 100)).toFixed(2)}/night
                </span>
                <span className="text-xs text-gray-500">({formData.discount}% off)</span>
              </div>
            )}
          </div>

          {/* Step 4: Description */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Step 4: Description (Optional)</h3>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="Add details about this deal..."
            />
          </div>

          {/* Step 5: Deal Image */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Step 5: Deal Image (Optional)</h3>
            <input
              type="url"
              name="image"
              value={formData.image || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Image URL for the deal"
            />
          </div>

          {/* Status */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select name="status" value={formData.status || "New"} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Ongoing">Ongoing</option>
              <option value="Full">Full</option>
              <option value="Inactive">Inactive</option>
              <option value="New">New</option>
              <option value="Finished">Finished</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium">Cancel</button>
            <button type="submit" disabled={isLocalUpdating} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
              {isLocalUpdating ? "Updating..." : "Update Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}