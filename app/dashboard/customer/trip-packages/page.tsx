"use client";

import { useState, useEffect, useContext } from "react";
import CustomerLayout from "../../../components/layout/CustomerLayout";
import BookingModal from "./BookingModal";
import CustomTripModal from "./CustomTripModal";
import { AuthContext } from "@/app/context/AuthContext";
import { Loader2 } from "lucide-react";

interface Package {
    id: string; // Changed to string to match MongoDB _id
    _id?: string;
    name: string;
    description: string;
    maxParticipants: number;
    price: number;
    duration: string;
    vehicle: string;
    status: string;
    location: string;
    image?: string;
}

export default function CustomerTripPackages() {
    const { token } = useContext(AuthContext);
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isCustomTripModalOpen, setIsCustomTripModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    useEffect(() => {
        fetchPackages();
    }, [token]);

    const fetchPackages = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/trips`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Map _id to id if necessary, filter only Active packages for customers
                const mappedPackages = data
                    .filter((p: any) => p.status === 'Active')
                    .map((p: any) => ({
                        ...p,
                        id: p._id || p.id
                    }));
                setPackages(mappedPackages);
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = (packageItem: Package) => {
        setSelectedPackage(packageItem);
        setIsBookingModalOpen(true);
    };

    const handleCustomTripCreated = (tripData: any) => {
        // Refresh or show feedback if needed
        console.log("Custom trip created");
    };

    if (loading) {
        return (
            <CustomerLayout>
                 <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Trip Packages</h1>
                        <p className="text-gray-600 mt-2">
                            Discover amazing destinations and experiences
                        </p>
                    </div>
                    
                    {/* Custom Trip Button */}
                    <button
                        onClick={() => setIsCustomTripModalOpen(true)}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        <span>Custom Trip</span>
                    </button>
                </div>

                {/* Packages Grid */}
                {packages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                        No active trip packages available at the moment.
                    </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((packageItem) => (
                        <div
                            key={packageItem.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                            {/* Package Image Placeholder */}
                            <div className="h-48 bg-gray-200 relative">
                                {packageItem.image ? (
                                    <img
                                        src={packageItem.image}
                                        alt={packageItem.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">{packageItem.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Package Details */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="#1954EB"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M10.5 6h9.75M10.5 6L6.75 18.75L12 13.5l2.25 2.25L18 9.75m-7.5-3.75H3.75"
                                                />
                                            </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-semibold truncate text-gray-900">
                                                {packageItem.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm truncate">
                                                {packageItem.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-gray-700 mb-4 text-sm leading-relaxed line-clamp-3 h-16">
                                    {packageItem.description}
                                </p>

                                {/* Features */}
                                <div className="space-y-2 mb-4 text-gray-700 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4 text-gray-500 flex-shrink-0"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span className="truncate">{packageItem.duration}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4 text-gray-500 flex-shrink-0"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                            />
                                        </svg>
                                        <span className="truncate">
                                            Max {packageItem.maxParticipants} participants
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4 text-gray-500 flex-shrink-0"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                                            />
                                        </svg>
                                        <span className="truncate">{packageItem.vehicle}</span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="text-blue-600 font-bold text-xl mb-4">
                                    ${packageItem.price} <span className="text-sm font-normal text-gray-500">/ person</span>
                                </div>

                                {/* Book Now button */}
                                <button
                                    onClick={() => handleBookNow(packageItem)}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                )}

                {/* Booking Modal */}
                {selectedPackage && (
                    <BookingModal
                        package={selectedPackage}
                        isOpen={isBookingModalOpen}
                        onClose={() => {
                            setIsBookingModalOpen(false);
                            setSelectedPackage(null);
                        }}
                    />
                )}

                {/* Custom Trip Modal */}
                <CustomTripModal
                    isOpen={isCustomTripModalOpen}
                    onClose={() => setIsCustomTripModalOpen(false)}
                    onTripCreated={handleCustomTripCreated}
                />
            </div>
        </CustomerLayout>
    );
}