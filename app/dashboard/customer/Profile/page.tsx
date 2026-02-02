// app/dashboard/customer/Profile/page.tsx
"use client";

import { AuthContext } from "@/app/context/AuthContext";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import CustomerLayout from "../../../components/layout/CustomerLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  idNumber?: string;
  roles: string[];
  createdAt: string;
}

export default function ProfilePage() {
  const { user, profile, token, refreshProfile } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        idNumber: profile.idNumber || "",
      });
      setIsLoading(false);
    } else if (user) {
      setFormData({
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        idNumber: "",
      });
      setIsLoading(false);
    } else {
      // If auth is done loading but no user, stop loading spinner to show login message
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          idNumber: formData.idNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update the global auth context with new data
      await refreshProfile();

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (!profile && !user) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Please Log In</h2>
            <p className="text-black mb-6">
              You need to be logged in to view your profile.
            </p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">My Profile</h2>
          <p className="text-black">Manage your account information</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-black mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-black cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                NIC / Passport Number
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="National ID or Passport number"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Member Since
              </label>
              <input
                type="text"
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                readOnly
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-black cursor-not-allowed"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              )}
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}