// app/dashboard/customer/RestaurantMenu/OrderConfirmationModal.tsx
"use client";

import { useState, useContext, useEffect } from "react";
import { SelectedMenuItem } from "./OrderSelectionModal";
import { AuthContext } from "@/app/context/AuthContext";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface OrderConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItems: SelectedMenuItem[];
    onBack: () => void;
}

export default function OrderConfirmationModal({
    isOpen,
    onClose,
    selectedItems,
    onBack
}: OrderConfirmationModalProps) {
    const { token, user } = useContext(AuthContext);
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeRoomNumber, setActiveRoomNumber] = useState<string | null>(null);
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

    // Auto-detect room number on open
    useEffect(() => {
        if (isOpen && token) {
            const fetchActiveBooking = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/bookings`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const bookings = await res.json();
                        // Find a booking that is actively checked in
                        const active = bookings.find((b: any) => 
                            b.status === 'CheckedIn' || b.status === 'Checked-In'
                        );
                        if (active) {
                            setActiveBookingId(active._id || active.id);
                        }
                        if (active && active.roomId) {
                            // Handle populated object or string
                            const rNum = typeof active.roomId === 'object' ? active.roomId.roomNumber : null;
                            if (rNum) setActiveRoomNumber(rNum);
                        }
                    }
                } catch (e) {
                    console.error("Failed to auto-detect room number", e);
                }
            };
            fetchActiveBooking();
        }
    }, [isOpen, token]);

    if (!isOpen) return null;

    // Calculate totals
    const subtotal = selectedItems.reduce((sum, item) =>
        sum + (item.menuItem.price * item.quantity), 0
    );
    const serviceFee = subtotal * 0.1;
    const total = subtotal + serviceFee;

    const handlePlaceOrder = async () => {
        if (!token) {
            toast.error("You must be logged in to place an order");
            return;
        }

        if (!activeBookingId) {
            toast.error("You need a checked-in booking before ordering.");
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                bookingId: activeBookingId,
                items: selectedItems.map(item => ({
                    menuItemId: item.menuItem._id, // Using _id correctly
                    name: item.menuItem.name,      // Sent as fallback/metadata
                    price: item.menuItem.price,    // Sent as fallback/metadata
                    quantity: item.quantity,
                    category: item.menuItem.category
                })),
                roomNumber: activeRoomNumber, // Auto-detected room number
                specialNotes: specialInstructions, // Mapped to backend 'specialNotes'
            };

            const response = await fetch(`${API_URL}/api/orders`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(orderData),
            });
      
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to place order');
            }
      
            // Show success modal
            setShowSuccess(true);

        } catch (error: any) {
            console.error("Error placing order:", error);
            toast.error(error.message || "Failed to place order");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        onClose();
        setSpecialInstructions("");
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Confirm Order</h2>
                                <p className="text-gray-600 mt-1">
                                    {activeBookingId && activeRoomNumber ? `Delivering to Room ${activeRoomNumber}` : "Requires an active checked-in booking"}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Selected Items */}
                        <div className="space-y-6 mb-6">
                            {selectedItems.map(({ menuItem, quantity }) => (
                                <div key={menuItem._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{menuItem.name}</h3>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900">${(menuItem.price * quantity).toFixed(2)}</div>
                                            <span className="text-sm text-gray-600 capitalize">{menuItem.category}</span>
                                        </div>
                                    </div>

                                    {menuItem.description && (
                                        <p className="text-gray-700 text-sm mb-3">{menuItem.description}</p>
                                    )}

                                    {menuItem.ingredients && menuItem.ingredients.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {menuItem.ingredients.map((ingredient, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                                                >
                                                    {ingredient}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Quantity: {quantity}</span>
                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                            {menuItem.available ? "Available" : "Pre-order"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pricing Summary */}
                        <div className="border-t border-gray-200 pt-6 space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sub Total:</span>
                                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Service Fee (10%):</span>
                                <span className="font-medium text-gray-900">${serviceFee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between font-bold text-lg">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-gray-900">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Special Instructions */}
                        <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3">Special Instructions:</h4>
                            <textarea
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 resize-none"
                                rows={3}
                                placeholder="Any special requests, allergies, or delivery notes..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4">
                            <button
                                onClick={onBack}
                                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading || !activeBookingId}
                                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Placing Order..." : "Place Order"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Confirmation Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center">
                        {/* Success Icon */}
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Confirmation Text */}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                Order Confirmed!
                            </h3>
                            <p className="text-gray-700 mb-2">
                                Your order has been successfully placed.
                            </p>
                            <p className="text-gray-700">
                                Kitchen has been notified.
                            </p>
                        </div>

                        {/* Got it Button */}
                        <button
                            onClick={handleSuccessClose}
                            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}