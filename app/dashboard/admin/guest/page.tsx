/* */
"use client";

import { useState, useEffect } from "react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import { Search, Filter, MoreVertical, RefreshCw } from "lucide-react";
import GuestModel from "../../../components/guest/guestmodel";
import GuestModelUpdate from "../../../components/guest/guestmodelupdate";
import { useAuth } from "../../../context/AuthContext";
// ✅ Make sure to run: npm install dayjs
import dayjs from "dayjs"; 

interface Reservation {
    id: string;
    mongoId: string;
    name: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    amountPaid: number;
    status: 'Clean' | 'Dirty' | 'Inspected' | 'Pick up' | 'Occupied' | 'Available' | 'Cleaning';
    roomType: string;
    discount: number;
}

export default function Page() {
    const { token } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'checkIn' | 'checkOut'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 10;
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchReservations = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings`, {
                method: "GET",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Map Backend Data to UI Interface
                const mappedData: Reservation[] = data.map((b: any) => {
                    const checkIn = dayjs(b.checkIn);
                    const checkOut = dayjs(b.checkOut);
                    const nights = checkOut.diff(checkIn, 'day') || 1;
                    const rate = b.roomId?.rate || 0;
                    
                    return {
                        id: `#${b._id.slice(-4).toUpperCase()}`, // Short ID for display
                        mongoId: b._id, // Real ID for actions
                        name: b.guestId?.name || 'Unknown Guest',
                        roomNumber: b.roomId?.number || 'N/A',
                        checkIn: b.checkIn,
                        checkOut: b.checkOut,
                        roomType: b.roomId?.type || 'Standard',
                        // Calculate total based on nights * rate
                        totalAmount: rate * nights, 
                        amountPaid: 0, 
                        status: b.roomId?.status || 'Clean', 
                        discount: 0
                    };
                });

                setReservations(mappedData);
            } else {
                console.log("Failed to fetch bookings");
            }
        } catch (error) {
            console.log("Error fetching reservations", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [token]);

    // delete reservation
    const handleDelete = async (reservationId: string) => {
        if (!window.confirm("Are you sure you want to delete this reservation?")) {
            setOpenMenu(null);
            return;
        }
        setIsDeleting(reservationId);
        setDeleteError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings/${reservationId}`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.ok) {
                setReservations(prev => prev.filter(res => res.mongoId !== reservationId));
                setShowDeleteSuccess(true);
                setTimeout(() => setShowDeleteSuccess(false), 3000);
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            console.log("Delete failed", error);
            setDeleteError("Failed to delete reservation.");
            setTimeout(() => setDeleteError(null), 5000);
        } finally {
            setIsDeleting(null);
            setOpenMenu(null);
        }
    };

    // Filter reservations
    const getFilteredReservations = () => {
        let filtered = reservations;

        // Basic Filter logic
        if (activeFilter === 'checkIn') {
             filtered = filtered.filter(res => dayjs(res.checkIn).isAfter(dayjs().subtract(1, 'day')));
        } else if (activeFilter === 'checkOut') {
             filtered = filtered.filter(res => dayjs(res.checkOut).isBefore(dayjs().add(2, 'day')));
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(res =>
                res.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                res.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredReservations = getFilteredReservations();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedReservations = filteredReservations.slice(startIndex, startIndex + itemsPerPage);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Clean': return 'bg-blue-100 text-blue-800';
            case 'Dirty': return 'bg-red-100 text-red-800';
            case 'Inspected': return 'bg-green-100 text-green-800';
            case 'Occupied': return 'bg-purple-100 text-purple-800';
            case 'Cleaning': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewGuest = (reservation: Reservation) => {
        const checkIn = dayjs(reservation.checkIn);
        const checkOut = dayjs(reservation.checkOut);
        const nights = checkOut.diff(checkIn, 'day');

        setSelectedGuest({
            name: reservation.name,
            registrationNumber: reservation.id,
            roomNumber: reservation.roomNumber,
            checkInDate: checkIn.format('YYYY-MM-DD'),
            roomType: reservation.roomType,
            stay: `${nights} Nights`,
            discount: reservation.discount,
            totalAmount: reservation.totalAmount,
            amountPaid: reservation.amountPaid,
            status: reservation.status
        });
        setIsGuestModalOpen(true);
    };

    const handleUpdateGuest = (reservation: Reservation) => {
        const checkIn = dayjs(reservation.checkIn);
        const checkOut = dayjs(reservation.checkOut);
        const nights = checkOut.diff(checkIn, 'day');

        setSelectedGuest({
            mongoId: reservation.mongoId, // Important for API call
            name: reservation.name,
            registrationNumber: reservation.id,
            roomNumber: reservation.roomNumber,
            checkInDate: checkIn.format('YYYY-MM-DD'),
            roomType: reservation.roomType,
            stay: `${nights} Nights`,
            discount: reservation.discount,
            totalAmount: reservation.totalAmount,
            amountPaid: reservation.amountPaid,
            status: reservation.status
        });
        setIsUpdateModalOpen(true);
    };

    return (
        <AdminReceptionistLayout role="admin">
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Success/Error Messages */}
                {showDeleteSuccess && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">Reservation deleted!</div>}
                {deleteError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{deleteError}</div>}

                {/* Filter & Search */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                        {['all', 'checkIn', 'checkOut'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f as any)}
                                className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${activeFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                            >
                                {f === 'all' ? 'All' : f === 'checkIn' ? 'Check In' : 'Check Out'}
                            </button>
                        ))}
                        <button onClick={fetchReservations} className="p-2 rounded-full hover:bg-gray-200" title="Refresh">
                            <RefreshCw className="h-4 w-4 text-gray-600"/>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search room or guest..."
                                className="pl-10 pr-3 py-2.5 w-64 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible">
                    <div className="grid grid-cols-7 bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="text-sm font-medium text-gray-700">ID</div>
                        <div className="text-sm font-medium text-gray-700">Name</div>
                        <div className="text-sm font-medium text-gray-700">Room</div>
                        <div className="text-sm font-medium text-gray-700">Total</div>
                        <div className="text-sm font-medium text-gray-700">Paid</div>
                        <div className="text-sm font-medium text-gray-700">Status</div>
                        <div className="text-sm font-medium text-gray-700">Actions</div>
                    </div>

                    {isLoading ? (
                        <div className="py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : paginatedReservations.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">No reservations found</div>
                    ) : (
                        paginatedReservations.map((reservation, index) => (
                            <div key={reservation.mongoId} className="grid grid-cols-7 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 items-center">
                                <div className="text-sm font-medium text-gray-900">{reservation.id}</div>
                                <div className="text-sm text-gray-700">{reservation.name}</div>
                                <div className="text-sm text-gray-700">{reservation.roomNumber}</div>
                                <div className="text-sm font-medium text-gray-900">${reservation.totalAmount.toLocaleString()}</div>
                                <div className="text-sm text-gray-700">${reservation.amountPaid.toLocaleString()}</div>
                                <div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                                        {reservation.status}
                                    </span>
                                </div>
                                <div className="relative flex justify-end">
                                    <MoreVertical
                                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === index ? null : index); }}
                                        className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
                                    />
                                    {openMenu === index && (
                                        <div className="absolute right-0 top-8 w-44 bg-white shadow-2xl rounded-lg border border-gray-200 z-50">
                                            <button className="text-black w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { handleViewGuest(reservation); setOpenMenu(null); }}>View</button>
                                            <button className="text-black w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { handleUpdateGuest(reservation); setOpenMenu(null); }}>Update</button>
                                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDelete(reservation.mongoId)}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <GuestModel isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} guestData={selectedGuest} />
            <GuestModelUpdate 
                isOpen={isUpdateModalOpen} 
                onClose={() => setIsUpdateModalOpen(false)} 
                guestData={selectedGuest} 
                onUpdate={(updated) => {
                    fetchReservations(); // Refresh list after update
                }} 
            />
        </AdminReceptionistLayout>
    );
}