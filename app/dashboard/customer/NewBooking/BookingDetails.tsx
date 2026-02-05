"use client";

import toast from "react-hot-toast";
import { BookingData } from "./NewBookingModal";

interface BookingDetailsProps {
  data: BookingData;
  updateData: (section: keyof BookingData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  totalSteps: number;
  onComplete?: () => void; // ✅ Added this
  selectedRoom?: any; // Add selected room to access capacity
}

export default function BookingDetails({
  data,
  updateData,
  nextStep,
  prevStep,
  selectedRoom,
}: BookingDetailsProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check if dates are selected
    if (!data.bookingDetails.checkIn) {
      toast.error("Pick check-in date");
      return;
    }

    if (!data.bookingDetails.checkOut) {
      toast.error("Pick check-out date");
      return;
    }

    // Validation: Check-out must be same day or after check-in
    const checkInDate = new Date(data.bookingDetails.checkIn);
    const checkOutDate = new Date(data.bookingDetails.checkOut);

    if (checkOutDate < checkInDate) {
      toast.error("Check-out after check-in");
      return;
    }

    // Validation: Room capacity
    const maxCapacity = selectedRoom?.maxOccupancy || 2;
    if (data.bookingDetails.adults > maxCapacity) {
      toast.error(`Max ${maxCapacity} adults allowed`);
      return;
    }

    nextStep();
  };

  const maxCapacity = selectedRoom?.maxOccupancy || 2;
  const canAddMore = (data.bookingDetails.adults || 1) < maxCapacity;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
              Check-in Date *
            </label>
            <input
              type="date"
              required
              value={data.bookingDetails.checkIn}
              onChange={(e) =>
                updateData("bookingDetails", { checkIn: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-black"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
              Check-out Date *
            </label>
            <input
              type="date"
              required
              value={data.bookingDetails.checkOut}
              onChange={(e) =>
                updateData("bookingDetails", { checkOut: e.target.value })
              }
              disabled={!data.bookingDetails.checkIn}
              min={data.bookingDetails.checkIn}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-black disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {!data.bookingDetails.checkIn && (
              <p className="text-xs text-gray-500 mt-1">Select check-in first</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
            Number of Adults * (Max: {maxCapacity})
          </label>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              onClick={() => {
                const current = data.bookingDetails.adults || 1;
                if (current > 1) {
                  updateData("bookingDetails", {
                    adults: current - 1,
                  });
                }
              }}
              disabled={(data.bookingDetails.adults || 1) <= 1}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span className="text-sm sm:text-base font-medium text-black min-w-8 sm:min-w-10 text-center">
              {data.bookingDetails.adults || 1}
            </span>
            <button
              type="button"
              onClick={() => {
                const current = data.bookingDetails.adults || 1;
                if (canAddMore) {
                  updateData("bookingDetails", {
                    adults: current + 1,
                  });
                }
              }}
              disabled={!canAddMore}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
          <button
            type="button"
            onClick={prevStep}
            className="w-full sm:w-auto order-2 sm:order-1 bg-gray-100 text-gray-600 px-5 py-2.5 sm:py-2 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto order-1 sm:order-2 bg-blue-500 text-white px-5 py-2.5 sm:py-2 text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm hover:shadow-md mb-3 sm:mb-0"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  );
}