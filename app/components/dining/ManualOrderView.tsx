"use client";

import { useEffect, useState } from "react";
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

interface BookingSummary {
    _id: string;
    roomId: any;
    guestId: any;
    status: string;
}

export default function ManualOrderView() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [bookings, setBookings] = useState<BookingSummary[]>([]);
    const [selectedBookingId, setSelectedBookingId] = useState<string>("");
    const [foodDeals, setFoodDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Selected items state
    const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

    // Fetch Data from Backend
    const fetchData = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Menu Items and Bookings in parallel
            const [menuRes, bookingRes, dealsRes] = await Promise.all([
                fetch(`${API_URL}/api/menu`, { headers }),
                fetch(`${API_URL}/api/bookings`, { headers }),
                fetch(`${API_URL}/api/deals`, { headers })
            ]);

            if (!menuRes.ok) throw new Error("Failed to fetch menu items");

            const menuData = await menuRes.json();
            // Map _id to id
            const formattedMenu = menuData.map((item: any) => ({
                ...item,
                id: item._id || item.id
            }));
            setMenuItems(formattedMenu);

            if (bookingRes.ok) {
                const bookingData = await bookingRes.json();
                const checkedIn = bookingData.filter((b: any) => b.status === 'CheckedIn' || b.status === 'Checked-In');
                setBookings(checkedIn);
            }

            if (dealsRes.ok) {
                const dealsData = await dealsRes.json();
                const today = new Date();
                const activeFoodDeals = (Array.isArray(dealsData) ? dealsData : []).filter((deal: any) => {
                    if (deal.dealType !== 'food') return false;
                    const statusOk = ['Ongoing', 'New', 'Inactive', 'Full'].includes(deal.status);
                    if (!statusOk) return false;
                    const start = new Date(deal.startDate);
                    const end = new Date(deal.endDate);
                    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
                    return start <= today && end >= today;
                });
                setFoodDeals(activeFoodDeals);
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

    const handleAddItem = (menuItem: MenuItem) => {
        if (!menuItem.available) return;
        const deal = getBestDealForItem(menuItem.id);
        const step = deal?.discountType === 'bogo' ? 2 : 1;

        setSelectedItems(prev => {
            const existingItem = prev.find(item => item.menuItemId === menuItem.id);

            if (existingItem) {
                // Increase quantity if item already exists
                return prev.map(item =>
                    item.menuItemId === menuItem.id
                        ? { ...item, quantity: item.quantity + step }
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
                        quantity: step
                    }
                ];
            }
        });
    };

    const handleRemoveItem = (menuItemId: string) => {
        const deal = getBestDealForItem(menuItemId);
        const step = deal?.discountType === 'bogo' ? 2 : 1;

        setSelectedItems(prev => {
            const existingItem = prev.find(item => item.menuItemId === menuItemId);

            if (existingItem && existingItem.quantity > step) {
                // Decrease quantity
                return prev.map(item =>
                    item.menuItemId === menuItemId
                        ? { ...item, quantity: item.quantity - step }
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

    const calculateSubtotal = () => {
        return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const calculateDealDiscount = () => {
        if (selectedItems.length === 0 || foodDeals.length === 0) return 0;
        let discount = 0;

        selectedItems.forEach((item) => {
            const matchingDeals = foodDeals.filter((deal: any) =>
                Array.isArray(deal.menuItemIds) && deal.menuItemIds.includes(item.menuItemId)
            );

            if (matchingDeals.length === 0) return;

            let bestSavings = 0;
            matchingDeals.forEach((deal: any) => {
                let savings = 0;
                if ((deal.discountType || 'percentage') === 'bogo') {
                    const freeItems = Math.floor(item.quantity / 2);
                    savings = freeItems * item.price;
                } else {
                    const pct = Number(deal.discount || 0);
                    savings = item.price * item.quantity * (pct / 100);
                }
                if (savings > bestSavings) bestSavings = savings;
            });

            discount += bestSavings;
        });

        return discount;
    };

    const getItemDealSavings = (item: OrderItem) => {
        if (!foodDeals.length) return 0;
        const matchingDeals = foodDeals.filter((deal: any) =>
            Array.isArray(deal.menuItemIds) && deal.menuItemIds.includes(item.menuItemId)
        );
        if (matchingDeals.length === 0) return 0;

        let bestSavings = 0;
        matchingDeals.forEach((deal: any) => {
            let savings = 0;
            if ((deal.discountType || 'percentage') === 'bogo') {
                const freeItems = Math.floor(item.quantity / 2);
                savings = freeItems * item.price;
            } else {
                const pct = Number(deal.discount || 0);
                savings = item.price * item.quantity * (pct / 100);
            }
            if (savings > bestSavings) bestSavings = savings;
        });

        return bestSavings;
    };

    const getBestDealForItem = (menuItemId: string) => {
        if (!foodDeals.length) return null;
        const matchingDeals = foodDeals.filter((deal: any) =>
            Array.isArray(deal.menuItemIds) && deal.menuItemIds.includes(menuItemId)
        );
        if (matchingDeals.length === 0) return null;
        return matchingDeals.reduce((best: any, deal: any) => {
            if (!best || (deal.discount || 0) > (best.discount || 0)) return deal;
            return best;
        }, null as any);
    };

    const handleCreateOrder = async () => {
        if (!selectedBookingId) {
            alert("Select a checked-in booking before creating an order.");
            return;
        }

        if (selectedItems.length === 0) {
            alert("Please select at least one menu item");
            return;
        }

        try {
            const orderData = {
                bookingId: selectedBookingId,
                items: selectedItems.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity
                }))
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
                                            <span>${(item.price * item.quantity - getItemDealSavings(item)).toFixed(2)}</span>
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
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>${calculateSubtotal().toFixed(2)}</span>
                                </div>
                                {calculateDealDiscount() > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-700">
                                        <span>Deal Discount:</span>
                                        <span>- ${calculateDealDiscount().toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold mt-2">
                                    <span>Total:</span>
                                    <span>${Math.max(0, calculateSubtotal() - calculateDealDiscount()).toFixed(2)}</span>
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
                                const activeDeal = getBestDealForItem(menuItem.id);
                                return (
                                    <div key={menuItem.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-semibold">{menuItem.name}</div>
                                                <div className="text-sm text-gray-600 capitalize">{menuItem.category}</div>
                                                <div className="text-lg font-semibold text-gray-700 mt-1">${menuItem.price}</div>
                                                {activeDeal && (
                                                    <div className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5">
                                                            {activeDeal.discountType === 'bogo'
                                                                ? 'BOGO Deal'
                                                                : `${activeDeal.discount || 0}% OFF`}
                                                        </span>
                                                        <span className="text-gray-500">{activeDeal.dealName}</span>
                                                    </div>
                                                )}
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