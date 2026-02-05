"use client";

import { AuthContext } from "@/app/context/AuthContext";
import { Calendar, Car, Clock, Loader2, MapPin, Users } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import CustomerLayout from "../../../components/layout/CustomerLayout";
import BookingModal from "./BookingModal";
import CustomTripModal from "./CustomTripModal";

interface Package {
    id: string;
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
    images?: string[];
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
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const mappedPackages = data
                    .filter((p: any) => p.status === "Active")
                    .map((p: any) => ({
                        ...p,
                        id: p._id || p.id,
                    }));
                setPackages(mappedPackages);
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookClick = (pkg: Package) => {
        setSelectedPackage(pkg);
        setIsBookingModalOpen(true);
    };

    // Helper to get image from backend, with fallback to placeholder
    const getPackageImage = (pkg: Package) => {
        // First priority: images array from backend
        if (pkg.images && pkg.images.length > 0) {
            return pkg.images[0];
        }

        // Second priority: single image field from backend
        if (pkg.image) {
            return pkg.image;
        }

        // Fallback to keyword-based placeholders
        const name = pkg.name.toLowerCase();
        const location = pkg.location.toLowerCase();

        if (name.includes("safari") || location.includes("yala") || location.includes("udawalawe")) {
            return "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?q=80&w=2070&auto=format&fit=crop";
        }
        if (name.includes("beach") || location.includes("galle") || location.includes("mirissa")) {
            return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop";
        }
        if (name.includes("city") || name.includes("colombo") || name.includes("kandy")) {
            return "https://images.unsplash.com/photo-1588258524675-55d656396b8a?q=80&w=2067&auto=format&fit=crop";
        }
        if (name.includes("mountain") || name.includes("ella") || name.includes("nuwara")) {
            return "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop";
        }
        if (name.includes("temple") || name.includes("heritage")) {
            return "https://images.unsplash.com/photo-1580889240912-c39c3dfbd3fc?q=80&w=2070&auto=format&fit=crop";
        }

        // Default Fallback
        return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
    };

    if (loading) {
        return (
            <CustomerLayout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Explore Trip Packages</h1>
                        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                            Discover curated experiences and adventures tailored just for you.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCustomTripModalOpen(true)}
                        className="bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto"
                    >
                        Request Custom Trip
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {packages.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground text-lg">No active packages available at the moment.</p>
                        </div>
                    ) : (
                        packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                            >
                                {/* Image Section */}
                                <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                                    <img
                                        src={getPackageImage(pkg)}
                                        alt={pkg.name}
                                        className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            // Fallback if image fails to load
                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                                        }}
                                    />
                                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm">
                                        ${pkg.price.toLocaleString()}
                                    </div>
                                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {pkg.location}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="flex flex-col flex-grow p-3 sm:p-5">
                                    <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                                        {pkg.name}
                                    </h3>
                                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4 flex-grow">
                                        {pkg.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-y-2 gap-x-2 sm:gap-x-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span>{pkg.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-green-500" />
                                            <span>Max {pkg.maxParticipants}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4 text-orange-500" />
                                            <span>{pkg.vehicle}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-purple-500" />
                                            <span>Available Now</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBookClick(pkg)}
                                        className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        Book This Trip
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {selectedPackage && (
                    <BookingModal
                        isOpen={isBookingModalOpen}
                        onClose={() => setIsBookingModalOpen(false)}
                        package={selectedPackage}
                    />
                )}

                <CustomTripModal
                    isOpen={isCustomTripModalOpen}
                    onClose={() => setIsCustomTripModalOpen(false)}
                />
            </div>
        </CustomerLayout>
    );
}