"use client";

import { useState, useEffect } from "react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import TripPackagesView from "../../../components/trip-packages/TripPackagesView";
import BookingsView from "../../../components/trip-packages/BookingsView";
import AddPackageModal from "../../../components/trip-packages/AddPackageModal";
import AddTripBookingModal from "../../../components/trip-packages/AddTripBookingModal";
import { Package, Clock } from "lucide-react";
import { auth } from "@/app/lib/firebase";

export default function TripPackages() {
  const [activeTab, setActiveTab] = useState<"packages" | "bookings">("packages");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Real Counts
  const [pkgCount, setPkgCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchCounts = async () => {
    try {
        const token = await auth.currentUser?.getIdToken();
        if(!token) return;

        // Fetch Packages Count
        const pkgRes = await fetch(`${API_URL}/api/trips`, { headers: { Authorization: `Bearer ${token}` }});
        if(pkgRes.ok) {
            const data = await pkgRes.json();
            setPkgCount(data.length);
        }

        // Fetch Bookings Count
        const bkRes = await fetch(`${API_URL}/api/trips/requests`, { headers: { Authorization: `Bearer ${token}` }});
        if(bkRes.ok) {
            const data = await bkRes.json();
            setBookingCount(data.length);
        }

    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchCounts();
  }, [activeTab]); // Refresh when tab changes

  const handleAddClick = () => {
      if(activeTab === "packages") setIsAddModalOpen(true);
      else setIsBookingModalOpen(true);
  };

  return (
    <AdminReceptionistLayout role="receptionist">
      <div className="space-y-6 text-black">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Trip Packages</h1>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            {activeTab === "packages" ? "Add Package" : "Add Booking"}
          </button>
        </div>
        <p className="text-gray-800 mb-6">Manage trip packages and bookings</p>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 border-b mb-6">
          <button
            onClick={() => setActiveTab("packages")}
            className={`flex items-center space-x-2 pb-3 px-1 font-medium transition-colors ${
              activeTab === "packages"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Packages ({pkgCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center space-x-2 pb-3 px-1 font-medium transition-colors ${
              activeTab === "bookings"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Bookings ({bookingCount})</span>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "packages" ? <TripPackagesView /> : <BookingsView />}
      </div>

      {/* Modals */}
      <AddPackageModal
        isOpen={isAddModalOpen}
        onClose={() => {
            setIsAddModalOpen(false);
            fetchCounts(); // Refresh count on close
        }}
      />

      <AddTripBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
            fetchCounts();
            // Dispatch event to refresh list inside BookingsView
            window.dispatchEvent(new Event("refreshTripBookings"));
        }}
      />
    </AdminReceptionistLayout>
  );
}