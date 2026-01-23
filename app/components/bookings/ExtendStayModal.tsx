"use client";

import { useState } from "react";
import { X, Calendar } from "lucide-react";
import { auth } from "@/app/lib/firebase";
import toast from "react-hot-toast";

interface ExtendStayModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    _id?: string;
    checkIn: string;
    checkOut: string;
    roomId: any;
    status: string;
  } | null;
  onExtendSuccess?: () => void;
}

export default function ExtendStayModal({
  isOpen,
  onClose,
  booking,
  onExtendSuccess
}: ExtendStayModalProps) {
  const [newCheckOut, setNewCheckOut] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  if (!isOpen || !booking) return null;

  const handleExtend = async () => {
    if (!newCheckOut) {
      toast.error("Please select a new check-out date");
      return;
    }

    const newDate = new Date(newCheckOut);
    const currentDate = new Date(booking.checkOut);
    const checkInDate = new Date(booking.checkIn);

    if (newDate <= checkInDate) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const bookingId = booking.id || booking._id;

      const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          checkOut: newCheckOut
        })
      });

      if (res.ok) {
        const action = newDate > currentDate ? "extended" : "rescheduled (early checkout)";
        toast.success(`Stay ${action} successfully! Bill will auto-update with ${newDate < currentDate ? "penalty" : "new charges"}.`);
        if (onExtendSuccess) onExtendSuccess();
        onClose();
        setNewCheckOut("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update checkout date");
      }
    } catch (error: any) {
      console.error("Error updating checkout:", error);
      toast.error(error.message || "Failed to update checkout date");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCheckOut = new Date(booking.checkOut).toISOString().split('T')[0];
  const checkInDate = new Date(booking.checkIn).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Modify Check-out Date</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 font-medium">
              {new Date(booking.checkIn).toLocaleDateString()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Check-out Date
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 font-medium">
              {new Date(booking.checkOut).toLocaleDateString()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Check-out Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                min={checkInDate}
                max="2099-12-31"
                value={newCheckOut}
                onChange={(e) => setNewCheckOut(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select a date after {new Date(booking.checkIn).toLocaleDateString()}
            </p>
          </div>

          {newCheckOut && (
            <div className={`rounded-lg p-3 ${new Date(newCheckOut) > new Date(booking.checkOut) ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              {new Date(newCheckOut) > new Date(booking.checkOut) ? (
                <p className="text-sm text-green-800">
                  <strong>✓ Extended:</strong> Room cost will increase based on additional nights.
                </p>
              ) : (
                <p className="text-sm text-orange-800">
                  <strong>⚠ Early Checkout:</strong> A penalty of +1 day will be added to cover early checkout.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleExtend}
            disabled={isSubmitting || !newCheckOut}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update Date"}
          </button>
        </div>
      </div>
    </div>
  );
}
