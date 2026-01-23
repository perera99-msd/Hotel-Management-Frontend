"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { AuthContext } from "@/app/context/AuthContext";
import toast from "react-hot-toast";

interface Package {
    id: string;
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

interface BookingModalProps {
    package: Package;
    isOpen: boolean;
    onClose: () => void;
}

interface GuestInfo {
    fullName: string;
    email: string;
    phoneNumber: string;
}

export default function BookingModal({
    package: packageItem,
    isOpen,
    onClose,
}: BookingModalProps) {
    const { user, profile, token } = useContext(AuthContext);
    const [guests, setGuests] = useState(1);
    const [tripDate, setTripDate] = useState("");
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedBookingId, setSelectedBookingId] = useState("");
    const [guestInfo, setGuestInfo] = useState<GuestInfo>({
        fullName: "",
        email: "",
        phoneNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    // Auto-populate user details when modal opens
    useEffect(() => {
        if (isOpen && (profile || user)) {
            setGuestInfo({
                fullName: profile?.name || user?.displayName || "",
                email: profile?.email || user?.email || "",
                phoneNumber: profile?.phone?.replace(/^\+94/, "") || "",
            });
        }
    }, [isOpen, profile, user]);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!token || !isOpen) return;
            try {
                const res = await fetch(`${API_URL}/api/bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setBookings(await res.json());
                }
            } catch (err) {
                console.error("Failed to load bookings", err);
            }
        };
        fetchBookings();
    }, [token, isOpen, API_URL]);

    useEffect(() => {
        const firstEligible = bookings.find((b) => {
            const status = (b.status || '').toLowerCase();
            return status === 'confirmed' || status === 'checkedin' || status === 'checked-in';
        });
        const firstId = firstEligible?._id || "";
        setSelectedBookingId((prev) => prev === firstId ? prev : firstId);
    }, [bookings]);

    const serviceFee = 12.0;
    const discount = 0;
    const subtotal = packageItem.price * guests;
    const total = subtotal + serviceFee - discount;

    const eligibleBookings = bookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        return status === 'confirmed' || status === 'checkedin' || status === 'checked-in';
    });

    const selectedBooking = eligibleBookings.find((b) => b._id === selectedBookingId);

    const handleGuestChange = (increment: boolean) => {
        setGuests((prev) => {
            const newGuests = increment ? prev + 1 : prev - 1;
            return Math.max(1, Math.min(newGuests, packageItem.maxParticipants));
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setGuestInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleConfirmBooking = async () => {
        if (!token) {
            toast.error("Please login to book a trip");
            return;
        }

        if (!selectedBookingId) {
            toast.error("Select a confirmed or checked-in booking first");
            return;
        }

        if (!guestInfo.fullName || !guestInfo.email || !guestInfo.phoneNumber || !tripDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (guests > packageItem.maxParticipants) {
            toast.error(`Maximum ${packageItem.maxParticipants} participants allowed`);
            return;
        }

        setLoading(true);
        try {
            const bookingData = {
                packageId: packageItem.id,
                participants: guests,
                bookingId: selectedBookingId,
                tripDate,
                guestInfo: {
                    ...guestInfo,
                    phoneNumber: `+94${guestInfo.phoneNumber}`,
                },
                details: "Standard Booking Request", // Added for backend compatibility
            };

            const response = await fetch(`${API_URL}/api/trips/requests`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}` 
              },
              body: JSON.stringify(bookingData),
            });
      
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to save booking");
            }
      
            setShowConfirmation(true);
        } catch (error: any) {
            console.error("Error creating booking:", error);
            toast.error(error.message || "Failed to create booking");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmationClose = () => {
        setShowConfirmation(false);
        onClose();
        setGuests(1);
        setTripDate("");
        setSelectedBookingId("");
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main Booking Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#199FDA] text-white px-5 py-3 flex justify-between items-center">
                        <h2 className="text-base font-semibold">Confirm Booking</h2>
                        <button onClick={onClose} className="text-white text-xl font-bold">
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 text-gray-900">
                        {/* Package Info */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-lg font-semibold">{packageItem.name}</h3>
                                <p className="text-sm text-gray-500">{packageItem.location}</p>
                            </div>
                            <p className="text-lg font-semibold text-[#199FDA]">${packageItem.price}</p>
                        </div>

                        {/* Image */}
                        {packageItem.image && (
                            <Image
                                src={packageItem.image}
                                alt={packageItem.name}
                                width={500}
                                height={250}
                                className="rounded-md mb-4 w-full object-cover h-32"
                            />
                        )}

                        {/* Booking Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Booking *</label>
                            {eligibleBookings.length === 0 ? (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                                    You need a confirmed or checked-in booking before requesting a trip.
                                </div>
                            ) : (
                                <select
                                    value={selectedBookingId}
                                    onChange={(e) => setSelectedBookingId(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-black"
                                >
                                    {eligibleBookings.map((booking) => {
                                        const room = booking.roomId?.roomNumber || booking.roomId?.number || booking.roomNumber;
                                        const labelRoom = room ? `Room ${room}` : "Booking";
                                        return (
                                            <option key={booking._id} value={booking._id}>
                                                {labelRoom} • {booking.status}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                            {selectedBooking && selectedBooking.status?.toLowerCase() === 'confirmed' && (
                                <p className="text-xs text-amber-700 mt-1">Trips will be approved after you check in.</p>
                            )}
                        </div>

                        {/* Trip Date and Guests */}
                        <div className="flex items-center justify-between mb-4">
                            {selectedBooking ? (
                                <div className="flex flex-col w-[60%]">
                                    <input
                                        type="date"
                                        value={tripDate}
                                        onChange={(e) => setTripDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#199FDA]"
                                        min={selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                                        max={selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toISOString().split("T")[0] : undefined}
                                    />
                                    {selectedBooking.checkIn && selectedBooking.checkOut && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Dates: {new Date(selectedBooking.checkIn).toLocaleDateString()} - {new Date(selectedBooking.checkOut).toLocaleDateString()}
                                        </p>
                                    )}
                                    {tripDate && (
                                        <>
                                            {(new Date(tripDate) < new Date(selectedBooking.checkIn || new Date())) && (
                                                <p className="text-xs text-red-600 mt-1">Date is before check-in. Contact reception to extend booking.</p>
                                            )}
                                            {(new Date(tripDate) > new Date(selectedBooking.checkOut || new Date())) && (
                                                <p className="text-xs text-red-600 mt-1">Date is after check-out. Contact reception to extend booking.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="date"
                                    value={tripDate}
                                    onChange={(e) => setTripDate(e.target.value)}
                                    className="w-[60%] p-2 border border-gray-300 rounded text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#199FDA]"
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            )}
                            <div className="flex items-center">
                                <button
                                    onClick={() => handleGuestChange(false)}
                                    className="px-3 py-1 border border-gray-300 rounded-l hover:bg-gray-100"
                                >
                                    −
                                </button>
                                <span className="px-3 text-black">{guests}</span>
                                <button
                                    onClick={() => handleGuestChange(true)}
                                    className="px-3 py-1 border border-gray-300 rounded-r hover:bg-gray-100"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Guest Details */}
                        <div className="space-y-3 mb-4">
                            <input
                                type="text"
                                name="fullName"
                                value={guestInfo.fullName}
                                onChange={handleInputChange}
                                placeholder="Full Name *"
                                className="w-full p-2 border border-gray-300 rounded text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#199FDA]"
                            />
                            <input
                                type="email"
                                name="email"
                                value={guestInfo.email}
                                onChange={handleInputChange}
                                placeholder="Email *"
                                className="w-full p-2 border border-gray-300 rounded text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#199FDA]"
                            />
                            <div className="flex">
                                <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l bg-gray-50 text-black">
                                    +94
                                </div>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={guestInfo.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Phone Number *"
                                    className="flex-1 p-2 border border-gray-300 rounded-r text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#199FDA]"
                                />
                            </div>
                        </div>

                        {/* Pricing Summary */}
                        <div className="border-t pt-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Sub Total:</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Service Fee:</span>
                                <span>${serviceFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-bold">
                                <span>Total:</span>
                                <span className="text-green-600">${total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirmBooking}
                            disabled={loading || !selectedBookingId || eligibleBookings.length === 0}
                            className="mt-4 w-full bg-[#199FDA] text-white py-2 rounded-md hover:bg-[#138bc3] transition font-medium disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Confirm Booking"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-5 relative">
                        <button
                            onClick={handleConfirmationClose}
                            className="absolute top-2 right-3 text-gray-600 hover:text-black text-xl font-bold"
                        >
                            ×
                        </button>
                        <div className="flex items-center space-x-2 mb-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-green-600"
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
                            <h3 className="text-green-600 font-semibold">Booking Confirmed!</h3>
                        </div>
                        <p className="text-gray-700 text-sm">
                            Your booking request has been submitted. Our team will contact you shortly to confirm the details.
                        </p>

                        <button
                            onClick={handleConfirmationClose}
                            className="mt-4 bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 transition font-medium w-full"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}