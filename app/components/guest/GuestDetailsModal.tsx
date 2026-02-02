"use client";

import { Bed, Calendar, FileText, Hash, Mail, Phone, User, X } from 'lucide-react';

interface GuestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    guestData: {
        _id?: string;
        name: string;
        email: string;
        phone: string;
        idNumber?: string;
        checkIn: string;
        checkOut: string;
        roomNumber?: string;
        roomType?: string;
        totalAmount?: number;
        status?: string;
    };
}

export default function GuestDetailsModal({ isOpen, onClose, guestData }: GuestDetailsModalProps) {
    if (!isOpen || !guestData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-xl p-6 sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Guest Information</h2>
                                <p className="text-blue-100 text-sm">Complete profile details</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5 text-white group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Personal Information Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-600 rounded"></div>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">{guestData.name}</p>
                            </div>

                            {/* Email */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <Mail className="h-4 w-4 text-green-600" />
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                                </div>
                                <p className="text-lg font-semibold text-gray-900 break-all">{guestData.email}</p>
                            </div>

                            {/* Phone */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <Phone className="h-4 w-4 text-purple-600" />
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">{guestData.phone || 'N/A'}</p>
                            </div>

                            {/* NIC/Passport */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-orange-600" />
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NIC / Passport</label>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">{guestData.idNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Information Section */}
                    {(guestData.checkIn || guestData.checkOut || guestData.roomNumber) && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-green-600 rounded"></div>
                                Booking Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Check-In */}
                                {guestData.checkIn && (
                                    <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-200 hover:border-green-400 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-green-600" />
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-In Date</label>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">{new Date(guestData.checkIn).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {/* Check-Out */}
                                {guestData.checkOut && (
                                    <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-4 border border-red-200 hover:border-red-400 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-red-600" />
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-Out Date</label>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">{new Date(guestData.checkOut).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {/* Room Number */}
                                {guestData.roomNumber && (
                                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Hash className="h-4 w-4 text-purple-600" />
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Room Number</label>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">{guestData.roomNumber}</p>
                                    </div>
                                )}

                                {/* Room Type */}
                                {guestData.roomType && (
                                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-400 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Bed className="h-4 w-4 text-indigo-600" />
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Room Type</label>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">{guestData.roomType}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Additional Information */}
                    {(guestData.totalAmount || guestData.status) && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-yellow-600 rounded"></div>
                                Additional Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {guestData.totalAmount && (
                                    <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg p-4 border border-yellow-200 hover:border-yellow-400 transition-colors">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</label>
                                        <p className="text-2xl font-bold text-yellow-600 mt-2">${guestData.totalAmount.toFixed(2)}</p>
                                    </div>
                                )}

                                {guestData.status && (
                                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-200 hover:border-blue-400 transition-colors">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                                        <p className="text-lg font-semibold text-blue-700 mt-2 capitalize">{guestData.status}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ID Display */}
                    {guestData._id && (
                        <div className="bg-gray-100 rounded-lg p-4 mt-8">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest ID</label>
                            <p className="text-sm font-mono text-gray-700 mt-2 break-all">{guestData._id}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 rounded-b-xl p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
