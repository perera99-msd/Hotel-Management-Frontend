// app/dashboard/customer/NewBooking/NewBookingModal.tsx
"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import BookingDetails from "./BookingDetails";
import Confirm from "./Confirm";
import GuestInfo from "./GuestInfo";

// Simplified to only required fields
export type BookingData = {
  roomId?: string;
  roomRate?: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  bookingDetails: {
    checkIn: string;
    checkOut: string;
    adults: number;
  };
};

interface NewBookingModalProps {
  onClose: () => void;
  onComplete: () => void;
  selectedRoom?: any; // Accept the room object
  defaultCheckIn?: string;
  defaultCheckOut?: string;
}

export default function NewBookingModal({
  onClose,
  onComplete,
  selectedRoom,
  defaultCheckIn = "",
  defaultCheckOut = ""
}: NewBookingModalProps) {
  const { profile, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    roomId: selectedRoom?._id || selectedRoom?.id || "",
    roomRate: selectedRoom?.applicableRate || selectedRoom?.rate || 0, // Use applicableRate for the booking month
    guestInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    bookingDetails: {
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      adults: 1,
    },
  });

  // Pre-fill user details from auth context
  useEffect(() => {
    if (profile) {
      // Clean phone: remove +94 and leading 0
      let phone = profile.phone || "";
      phone = phone.replace(/^\+94/, "").replace(/^0+/, "");

      setBookingData(prev => ({
        ...prev,
        guestInfo: {
          ...prev.guestInfo,
          firstName: profile.firstName || profile.name?.split(' ')[0] || "",
          lastName: profile.lastName || profile.name?.split(' ').slice(1).join(' ') || "",
          email: profile.email || user?.email || "",
          phone: phone
        }
      }));
    }
  }, [profile, user]);

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  // ✅ FIXED FUNCTION: Only spread object-type sections to avoid spreading primitives
  const updateBookingData = (section: keyof BookingData, data: any) => {
    setBookingData((prev) => ({
      ...prev,
      [section]: typeof prev[section] === 'object' ? { ...prev[section], ...data } : data,
    }));
  };

  const steps = [
    { number: 1, title: "Guest Info", component: GuestInfo },
    { number: 2, title: "Booking Details", component: BookingDetails },
    { number: 3, title: "Confirm", component: Confirm },
  ];

  const CurrentComponent = steps[currentStep - 1]?.component;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">New Booking</h2>
            {selectedRoom && (
              <p className="text-xs text-blue-600 font-medium">
                Booking Room {selectedRoom.number} (${selectedRoom.rate}/night)
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-3 bg-gray-50 border-b shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${currentStep >= step.number ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                      }`}>
                      {step.number}
                    </div>
                    <span className={`mt-1 text-xs font-medium text-center ${currentStep >= step.number ? "text-blue-600" : "text-gray-500"
                      }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? "bg-blue-600" : "bg-gray-300"}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex-grow">
          {CurrentComponent && (
            <CurrentComponent
              data={bookingData}
              updateData={updateBookingData}
              nextStep={nextStep}
              prevStep={prevStep}
              currentStep={currentStep}
              totalSteps={steps.length}
              onComplete={onComplete}
              selectedRoom={selectedRoom}
            />
          )}
        </div>
      </div>
    </div>
  );
}