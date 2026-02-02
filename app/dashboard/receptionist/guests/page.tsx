/* Receptionist Guest Management */
"use client";

import dayjs from "dayjs";
import { MoreVertical, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import GuestDetailsModal from "../../../components/guest/GuestDetailsModal";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import { useAuth } from "../../../context/AuthContext";

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

export default function GuestPage() {
    const { token } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'checkIn' | 'checkOut'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 10;
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [guestDetails, setGuestDetails] = useState<any | null>(null);

    const fetchReservations = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [bookingsResponse, invoicesResponse] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invoices`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                })
            ]);

            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                const invoicesData = invoicesResponse.ok ? await invoicesResponse.json() : [];

                const invoiceMap = new Map();
                if (Array.isArray(invoicesData)) {
                    invoicesData.forEach((inv: any) => {
                        const bookingId = inv.bookingId?._id || inv.bookingId;
                        if (bookingId) {
                            const invStatus = (inv.status || '').toLowerCase();
                            invoiceMap.set(bookingId.toString(), {
                                total: inv.total || 0,
                                status: inv.status,
                                amountPaid: invStatus === 'paid' ? inv.total : 0
                            });
                        }
                    });
                }

                const mappedData: Reservation[] = bookingsData.map((b: any) => {
                    const checkIn = dayjs(b.checkIn);
                    const checkOut = dayjs(b.checkOut);
                    const nights = checkOut.diff(checkIn, 'day') || 1;
                    const rate = b.roomId?.rate || 0;

                    const invoiceData = invoiceMap.get(b._id.toString());
                    const totalAmount = invoiceData?.total || b.roomTotal || b.invoiceTotal || (rate * nights);
                    const amountPaid = invoiceData?.amountPaid || (b.status === 'CheckedOut' ? b.invoiceTotal || 0 : 0);

                    return {
                        id: `#${b._id.slice(-4).toUpperCase()}`,
                        mongoId: b._id,
                        name: b.guestId?.name || 'Unknown Guest',
                        roomNumber: b.roomId?.number || 'N/A',
                        checkIn: b.checkIn,
                        checkOut: b.checkOut,
                        roomType: b.roomId?.type || 'Standard',
                        totalAmount: totalAmount,
                        amountPaid: amountPaid,
                        status: b.roomId?.status || 'Clean',
                        discount: b.appliedDiscount || 0
                    };
                });

                setReservations(mappedData);
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

    const getFilteredReservations = () => {
        let filtered = reservations;

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

    const handleViewGuestDetails = async (mongoId: string) => {
        try {
            if (!token) return;
            const bookingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings/${mongoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (bookingRes.ok) {
                const booking = await bookingRes.json();
                const guest = booking.guestId || {};

                setGuestDetails({
                    _id: guest._id,
                    name: guest.name || 'Unknown',
                    email: guest.email || 'N/A',
                    phone: guest.phone || 'N/A',
                    idNumber: guest.idNumber || 'N/A',
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                    roomNumber: booking.roomId?.roomNumber || 'N/A',
                    roomType: booking.roomId?.type || 'N/A',
                    totalAmount: booking.roomTotal || 0,
                    status: booking.status
                });
                setIsDetailsModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch guest details:", error);
        }
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

    return (
        <AdminReceptionistLayout role="receptionist">
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
                    <button onClick={fetchReservations} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Refresh">
                        <RefreshCw className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

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
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search guest or room..."
                            className="pl-10 pr-3 py-2.5 w-64 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
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
                        <div className="py-8 text-center text-gray-500">No guests found</div>
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
                                        <div className="absolute right-0 top-8 w-40 bg-white shadow-2xl rounded-lg border border-gray-200 z-50">
                                            <button className="text-black w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { handleViewGuestDetails(reservation.mongoId); setOpenMenu(null); }}>View Details</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {filteredReservations.length > itemsPerPage && (
                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">Page {currentPage}</span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={startIndex + itemsPerPage >= filteredReservations.length}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <GuestDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} guestData={guestDetails} />
        </AdminReceptionistLayout>
    );
}
