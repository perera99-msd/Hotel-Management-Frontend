"use client";

import { useContext, useEffect } from "react";
import { BookingData } from "./NewBookingModal";
import { AuthContext } from "@/app/context/AuthContext";

interface GuestInfoProps {
  data: BookingData;
  updateData: (section: keyof BookingData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  totalSteps: number;
  onComplete?: () => void;
}

export default function GuestInfo({
  data,
  updateData,
  nextStep,
}: GuestInfoProps) {
  const { user, profile } = useContext(AuthContext);

  // Auto-populate user details when component mounts
  useEffect(() => {
    if (profile || user) {
      const name = profile?.name || user?.displayName || "";
      const nameParts = name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      // ✅ FIX: Remove +94 AND leading 0 from profile phone if present
      let phone = profile?.phone || user?.phoneNumber || "";
      phone = phone.replace(/^\+94/, "").replace(/^0+/, "");

      updateData("guestInfo", {
        firstName: data.guestInfo.firstName || firstName,
        lastName: data.guestInfo.lastName || lastName,
        email: data.guestInfo.email || profile?.email || user?.email || "",
        phone: data.guestInfo.phone || phone,
      });
    }
  }, [profile, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ✅ FIX: Remove non-digits AND leading zero immediately
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("0")) {
      val = val.substring(1);
    }
    const limitedDigits = val.slice(0, 9);
    updateData("guestInfo", { phone: limitedDigits });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={data.guestInfo.firstName}
              onChange={(e) =>
                updateData("guestInfo", { firstName: e.target.value })
              }
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={data.guestInfo.lastName}
              onChange={(e) =>
                updateData("guestInfo", { lastName: e.target.value })
              }
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={data.guestInfo.email}
            onChange={(e) => updateData("guestInfo", { email: e.target.value })}
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="flex">
            <div className="flex items-center px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-600">
              +94
            </div>
            <input
              type="tel"
              required
              value={data.guestInfo.phone}
              onChange={handlePhoneChange}
              pattern="[0-9]{9}"
              title="Please enter exactly 9 digits (exclude the leading 0)"
              maxLength={9}
              className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              placeholder="710 875 581"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Do not enter the leading 0</p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  );
}