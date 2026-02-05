"use client";

import { Bed, Calendar, Clock, Edit, LogOut, UserCheck, XCircle } from "lucide-react";

// Redefined locally to avoid circular dependencies with page.tsx
interface Booking {
  id: string;
  guestId: { name: string; email: string } | string;
  roomId: { roomNumber: string; type: string } | string;
  checkIn: string;
  checkOut: string;
  status: 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled' | string;
  [key: string]: any;
}

interface BookingListProps {
  bookings: Booking[];
  onEdit?: (booking: Booking | any) => void;
  onCheckIn?: (booking: Booking | any) => void;
  onCheckOut?: (booking: Booking | any) => void;
  onCancel?: (booking: Booking | any) => void;
  onExtend?: (booking: Booking | any) => void;
}

export default function BookingList({
  bookings,
  onEdit,
  onCheckIn,
  onCheckOut,
  onCancel,
  onExtend
}: BookingListProps) {

  const getGuestInfo = (booking: Booking) => {
    if (typeof booking.guestId === 'object' && booking.guestId !== null) {
      return {
        name: booking.guestId.name || "Unknown",
        email: booking.guestId.email || "No Email"
      };
    }
    return { name: "Guest ID: " + booking.guestId, email: "-" };
  };

  const getRoomInfo = (booking: Booking) => {
    if (typeof booking.roomId === 'object' && booking.roomId !== null) {
      return {
        number: booking.roomId.roomNumber || "?",
        type: booking.roomId.type || "Standard"
      };
    }
    return { number: "?", type: "Standard" };
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-600">Create a new booking to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => {
              const guest = getGuestInfo(booking);
              const room = getRoomInfo(booking);

              // Check for deal info
              const dealInfo = typeof (booking as any).appliedDealId === 'object' ? (booking as any).appliedDealId : null;
              const hasDiscount = (booking as any).appliedDiscount && (booking as any).appliedDiscount > 0;
              const totalAmount = (booking as any).roomTotal || 0;

              let statusStyle = "bg-gray-100 text-gray-800";
              if (booking.status === 'Confirmed') statusStyle = "bg-green-100 text-green-800";
              if (booking.status === 'CheckedIn') statusStyle = "bg-purple-100 text-purple-800";
              if (booking.status === 'CheckedOut') statusStyle = "bg-gray-100 text-gray-800";
              if (booking.status === 'Cancelled') statusStyle = "bg-red-100 text-red-800";
              if (booking.status === 'Pending') statusStyle = "bg-yellow-100 text-yellow-800";

              return (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {booking.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {guest.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                        <div className="text-sm text-gray-500">{guest.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Room {room.number}</div>
                            <div className="text-xs text-gray-500 capitalize">{room.type}</div>
                          </div>
                          {(booking as any).shortStay && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 whitespace-nowrap">
                              Short Stay
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(booking.checkOut).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${totalAmount.toFixed(2)}
                    </div>
                    {hasDiscount && dealInfo && (
                      <div className="text-xs text-emerald-600 font-medium mt-0.5">
                        💰 {dealInfo.dealName} ({(booking as any).appliedDiscount}%)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      {(booking.status === 'Confirmed' || booking.status === 'Pending') && (
                        <>
                          <button onClick={() => onCheckIn?.(booking)} className="text-green-600 hover:text-green-900" title="Check In">
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button onClick={() => onEdit?.(booking)} className="text-blue-600 hover:text-blue-900" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {booking.status === 'CheckedIn' && (
                        <>
                          {(booking as any).invoiceStatus !== 'paid' && (
                            <button onClick={() => onExtend?.(booking)} className="text-blue-600 hover:text-blue-900" title="Extend Stay">
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => onCheckOut?.(booking)} className="text-orange-600 hover:text-orange-900" title="Check Out">
                            <LogOut className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {(booking.status !== 'Cancelled' && booking.status !== 'CheckedOut') && (
                        <button onClick={() => onCancel?.(booking)} className="text-red-600 hover:text-red-900" title="Cancel">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}