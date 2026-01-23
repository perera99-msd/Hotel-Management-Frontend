"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

// Define the menu item interface
interface MenuItem {
    id: string;
    name: string;
    category: string;
    description: string;
    ingredients: string[];
    price: number;
    discount?: number;
    available: boolean;
    image?: string;
}

// Define the order item interface
interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
}

// Define Guest interface
interface Guest {
    _id: string;
    name: string;
    email: string;
}

interface BookingSummary {
    _id: string;
    roomId: any;
    guestId: any;
    status: string;
}

export default function ManualOrderView() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]); // Store guests for the dropdown
    const [bookings, setBookings] = useState<BookingSummary[]>([]);
    const [selectedBookingId, setSelectedBookingId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Form state
    const [formData, setFormData] = useState({
        guestName: "",
        roomNumber: "",
        tableNumber: "",
        specialNotes: ""
    });

    // Selected items state
    const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

    // Fetch Data from Backend
    const fetchData = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Menu Items and Users (Guests) in parallel
            const [menuRes, userRes, bookingRes] = await Promise.all([
                fetch(`${API_URL}/api/menu`, { headers }),
                fetch(`${API_URL}/api/users`, { headers }),
                fetch(`${API_URL}/api/bookings`, { headers })
            ]);

            if (!menuRes.ok) throw new Error("Failed to fetch menu items");
            
            const menuData = await menuRes.json();
            // Map _id to id
            const formattedMenu = menuData.map((item: any) => ({
                ...item,
                id: item._id || item.id
            }));
            setMenuItems(formattedMenu);

            // Load guests if available
            if (userRes.ok) {
                const usersData = await userRes.json();
                // Filter users to show only customers if needed, or show all
                setGuests(usersData);
            }

            if (bookingRes.ok) {
                const bookingData = await bookingRes.json();
                const checkedIn = bookingData.filter((b: any) => b.status === 'CheckedIn' || b.status === 'Checked-In');
                setBookings(checkedIn);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    useEffect(() => {
        if (!selectedBookingId && bookings.length > 0) {
            setSelectedBookingId(bookings[0]._id);
        }
        if (bookings.length === 0 && selectedBookingId) {
            setSelectedBookingId("");
        }
    }, [bookings, selectedBookingId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddItem = (menuItem: MenuItem) => {
        if (!menuItem.available) return;

        setSelectedItems(prev => {
            const existingItem = prev.find(item => item.menuItemId === menuItem.id);

            if (existingItem) {
                // Increase quantity if item already exists
                return prev.map(item =>
                    item.menuItemId === menuItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Add new item
                return [
                    ...prev,
                    {
                        menuItemId: menuItem.id,
                        name: menuItem.name,
                        price: menuItem.price,
                        quantity: 1
                    }
                ];
            }
        });
    };

    const handleRemoveItem = (menuItemId: string) => {
        setSelectedItems(prev => {
            const existingItem = prev.find(item => item.menuItemId === menuItemId);

            if (existingItem && existingItem.quantity > 1) {
                // Decrease quantity
                return prev.map(item =>
                    item.menuItemId === menuItemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            } else {
                // Remove item completely
                return prev.filter(item => item.menuItemId !== menuItemId);
            }
        });
    };

    const getItemQuantity = (menuItemId: string) => {
        const item = selectedItems.find(item => item.menuItemId === menuItemId);
        return item ? item.quantity : 0;
    };

    const calculateTotal = () => {
        return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleCreateOrder = async () => {
        if (!formData.guestName.trim()) {
            alert("Please enter guest name");
            return;
        }

        if (!selectedBookingId) {
            alert("Select a checked-in booking before creating an order.");
            return;
        }

        if (selectedItems.length === 0) {
            alert("Please select at least one menu item");
            return;
        }

        try {
            // Attempt to find a matching guest ID if the name matches exactly
            const matchedGuest = guests.find(g => g.name.toLowerCase() === formData.guestName.toLowerCase());

            const orderData = {
                bookingId: selectedBookingId,
                guestId: matchedGuest?._id, // Send ID if found
                guestName: formData.guestName,
                roomNumber: formData.roomNumber || undefined,
                tableNumber: formData.tableNumber || undefined,
                specialNotes: formData.specialNotes || undefined,
                items: selectedItems.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity
                })),
                totalAmount: calculateTotal()
            };

            const response = await fetch(`${API_URL}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                setFormData({
                    guestName: "",
                    roomNumber: "",
                    tableNumber: "",
                    specialNotes: ""
                });
                setSelectedItems([]);
                alert("Order created successfully!");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create order");
            }

        } catch (err) {
            console.error("Error creating order:", err);
            alert("Failed to create order. Please try again.");
        }
    };

    const availableMenuItems = menuItems.filter(item => item.available);

    const getBookingLabel = (booking: BookingSummary) => {
        const roomNumber = (booking as any).roomNumber || booking.roomId?.roomNumber || booking.roomId?.number || booking.roomId?.name;
        const labelRoom = roomNumber ? `Room ${roomNumber}` : "Room";
        return `${labelRoom} • ${booking._id.slice(-6)}`;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow text-black">
                <h3 className="text-lg font-semibold mb-6">Create Manual Order</h3>
                <div className="flex justify-center items-center h-32">
                    <div className="text-gray-600">Loading menu items...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow text-black">
                <h3 className="text-lg font-semibold mb-6">Create Manual Order</h3>
                <div className="text-center text-red-600">
                    <p className="mb-2">{error}</p>
                    <button
                        onClick={fetchData}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow text-black">
            <h3 className="text-lg font-semibold mb-6">Create Manual Order</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Guest Information */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Checked-in Booking *</label>
                            {bookings.length === 0 ? (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                                    No checked-in bookings available. Check in a guest to place an order.
                                </div>
                            ) : (
                                <select
                                    value={selectedBookingId}
                                    onChange={(e) => setSelectedBookingId(e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-black"
                                >
                                    <option value="">Select booking</option>
                                    {bookings.map((booking) => (
                                        <option key={booking._id} value={booking._id}>
                                            {getBookingLabel(booking)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Guest Name *</label>
                            <input
                                type="text"
                                name="guestName"
                                list="guest-list" // Connects to the datalist below
                                value={formData.guestName}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2 text-black"
                                placeholder="Enter or select guest name"
                                autoComplete="off"
                            />
                            {/* Hidden Datalist to display customers without changing UI structure */}
                            <datalist id="guest-list">
                                {guests.map((guest) => (
                                    <option key={guest._id} value={guest.name}>
                                        {guest.email}
                                    </option>
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Room Number</label>
                            <select
                                name="roomNumber"
                                value={formData.roomNumber}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2 text-black"
                            >
                                <option value="">Select room (optional)</option>
                                {/* In a real app, these rooms would also be fetched from API */}
                                <option value="101">Room 101</option>
                                <option value="102">Room 102</option>
                                <option value="103">Room 103</option>
                                <option value="201">Room 201</option>
                                <option value="202">Room 202</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Table Number</label>
                            <input
                                type="text"
                                name="tableNumber"
                                value={formData.tableNumber}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2 text-black"
                                placeholder="Enter table number (optional)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Special Notes</label>
                            <textarea
                                name="specialNotes"
                                value={formData.specialNotes}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2 text-black"
                                rows={3}
                                placeholder="Any special instructions..."
                            />
                        </div>
                    </div>

                    {/* Selected Items Summary */}
                    {selectedItems.length > 0 && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Order Summary</h4>
                            <div className="space-y-2">
                                {selectedItems.map((item) => (
                                    <div key={item.menuItemId} className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                                            <button
                                                onClick={() => handleRemoveItem(item.menuItemId)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t mt-3 pt-3">
                                <div className="flex justify-between font-semibold">
                                    <span>Total:</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Menu Items Selection */}
                <div className="space-y-6">
                    <h4 className="font-semibold mb-4">Select Menu Items</h4>

                    {availableMenuItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No available menu items found.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {availableMenuItems.map((menuItem) => {
                                const quantity = getItemQuantity(menuItem.id);
                                return (
                                    <div key={menuItem.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-semibold">{menuItem.name}</div>
                                                <div className="text-sm text-gray-600 capitalize">{menuItem.category}</div>
                                                <div className="text-lg font-semibold text-gray-700 mt-1">${menuItem.price}</div>
                                                {quantity > 0 && (
                                                    <div className="text-sm text-blue-600 mt-1">
                                                        Added: {quantity}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {quantity > 0 && (
                                                    <button
                                                        onClick={() => handleRemoveItem(menuItem.id)}
                                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleAddItem(menuItem)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    {quantity > 0 ? '+' : 'Add'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        onClick={handleCreateOrder}
                        disabled={selectedItems.length === 0 || !selectedBookingId}
                        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Order
                    </button>
                </div>
            </div>
        </div>
    );
}