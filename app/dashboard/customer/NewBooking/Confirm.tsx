"use client";

import { useAuth } from "@/app/context/AuthContext";
import { auth } from "@/app/lib/firebase";
import { Loader2, Percent } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BookingData } from "./NewBookingModal";

interface ConfirmProps {
  data: BookingData;
  updateData: (section: keyof BookingData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  totalSteps: number;
  onComplete?: () => void;
}

export default function Confirm({ data, prevStep, onComplete }: ConfirmProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [rateBreakdown, setRateBreakdown] = useState<any>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

  const { user, profile } = useAuth();

  // Fetch rate breakdown when component loads with booking data
  useEffect(() => {
    const fetchRateBreakdown = async () => {
      if (!data.roomId || !data.bookingDetails.checkIn || !data.bookingDetails.checkOut) {
        return;
      }

      try {
        setIsLoadingBreakdown(true);
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const token = await firebaseUser.getIdToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const res = await fetch(`${API_URL}/api/bookings/calculate-charges`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            roomId: data.roomId,
            checkIn: new Date(data.bookingDetails.checkIn).toISOString(),
            checkOut: new Date(data.bookingDetails.checkOut).toISOString()
          })
        });

        if (res.ok) {
          const result = await res.json();
          console.log('Rate breakdown response:', result);
          setRateBreakdown(result.rateBreakdown || result);
        } else {
          try {
            const error = await res.json();
            console.error(`Rate calculation error (${res.status}):`, error.error || error.message || error);
          } catch {
            console.error(`Rate calculation error (${res.status}): Failed to parse error response`, res.statusText);
          }
        }
      } catch (error) {
        console.error('Error fetching rate breakdown:', error);
      } finally {
        setIsLoadingBreakdown(false);
      }
    };

    fetchRateBreakdown();
  }, [data.roomId, data.bookingDetails.checkIn, data.bookingDetails.checkOut]);

  const handleConfirm = async () => {
    if (!agreeToTerms) {
      toast.error("Please agree to the terms.");
      return;
    }

    if (!data.roomId) {
      toast.error("Select an available room before confirming.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to book.");
      }

      const guestId = profile?._id || (user as any).mongoId;

      if (!guestId) {
        throw new Error("User profile not fully loaded. Please refresh the page.");
      }

      const token = await user.getIdToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      // 1. Prepare Payload
      // Simplified: only required fields
      const payload = {
        roomId: data.roomId,
        guestId: guestId,
        checkIn: data.bookingDetails.checkIn,
        checkOut: data.bookingDetails.checkOut,
        status: "Confirmed",
        source: "Online",
        adults: data.bookingDetails.adults,
      };

      console.log("Booking Payload:", payload);

      // 2. Call Backend
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create booking");
      }

      setIsConfirmed(true);
      toast.success("Booking successful!");
      if (onComplete) onComplete();

    } catch (err: any) {
      console.error("Booking error:", err);
      setError(err.message || "Failed to confirm booking.");
      toast.error(err.message || "Failed to confirm booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not selected";
    return new Date(dateString).toLocaleDateString();
  };

  const handleGotIt = () => {
    if (onComplete) onComplete();
  };

  if (isConfirmed) {
    return (
      <div className="bg-white p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-8">Your room has been successfully reserved.</p>
        <button onClick={handleGotIt} className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700">
          Got it
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Review Your Booking</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 text-xs mb-1">Check-in</p>
              <p className="font-semibold text-gray-900">{formatDate(data.bookingDetails.checkIn)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs mb-1">Check-out</p>
              <p className="font-semibold text-gray-900">{formatDate(data.bookingDetails.checkOut)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs mb-1">Number of Adults</p>
              <p className="font-semibold text-gray-900">{data.bookingDetails.adults}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs mb-1">Room Rate</p>
              <p className="font-semibold text-gray-900">${data.roomRate?.toFixed(2) || "N/A"}/night</p>
            </div>
          </div>

          {/* Detailed Rate Breakdown */}
          {isLoadingBreakdown ? (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Calculating rates...
            </div>
          ) : rateBreakdown ? (
            <div className="border-t border-blue-200 pt-4 space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm">Rate Breakdown by Month</h4>

              {/* Monthly Details */}
              {rateBreakdown.monthlyBreakdowns && rateBreakdown.monthlyBreakdowns.length > 0 ? (
                <div className="space-y-2">
                  {rateBreakdown.monthlyBreakdowns?.map((month: any, idx: number) => (
                    <div key={idx} className="bg-white rounded border border-gray-200 p-3 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{month.monthName} {month.year}</p>
                          <p className="text-xs text-gray-600">{month.days} nights</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${month.subtotal?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-gray-600">@ ${month.rate?.toFixed(2) || '0.00'}/night</p>
                        </div>
                      </div>

                      {/* Deal Information */}
                      {month.dealDays && month.dealDays > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 mt-2 text-xs">
                          <p className="font-medium text-emerald-900">{month.dealName}</p>
                          <div className="flex justify-between text-emerald-700 mt-1">
                            <span>{month.dealDays} nights @ ${(month.rate - (month.rate * (month.dealDiscount || 0) / 100))?.toFixed(2) || '0.00'}/night</span>
                            <span className="font-semibold">-${month.dealAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Summary */}
              <div className="border-t border-blue-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">${rateBreakdown.subtotal?.toFixed(2) || '0.00'}</span>
                </div>

                {rateBreakdown.totalDealDiscount > 0 && (
                  <div className="flex justify-between text-sm bg-emerald-50 border border-emerald-200 rounded p-2">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Percent className="h-3 w-3" />
                      {rateBreakdown.dealName}
                    </span>
                    <span className="font-semibold text-emerald-700">-${rateBreakdown.totalDealDiscount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 rounded p-2">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-blue-600">${rateBreakdown.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-600">All applicable deals and discounts have been calculated and included in the total above.</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">I agree to the terms & conditions</span>
        </label>
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <button onClick={prevStep} disabled={isLoading} className="flex-1 bg-gray-100 text-gray-600 px-6 py-3 rounded-md">
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading || !agreeToTerms}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center"
        >
          {isLoading ? "Processing..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}