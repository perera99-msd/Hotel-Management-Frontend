"use client";

import { Calendar, CheckCircle, CreditCard, Mail, Phone, User, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";

interface FrontDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FrontDeskModal({ isOpen, onClose, onSuccess }: FrontDeskModalProps) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    roomType: 'Standard',
    adults: 1,
    children: 0,
    status: 'due-in',
    checkInDate: '',
    checkOutDate: '',
    mealPreference: 'regular',
  });

  const roomTypes = [
    { value: 'Standard', label: 'Standard Room', price: 150, desc: 'Cozy & Basic' },
    { value: 'Deluxe', label: 'Deluxe Room', price: 250, desc: 'Spacious & Modern' },
    { value: 'Suite', label: 'Suite', price: 400, desc: 'Luxury Living' },
    { value: 'VIP', label: 'VIP', price: 600, desc: 'Ultimate Experience' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    const selectedRoom = roomTypes.find(room => room.value === formData.roomType);
    if (!selectedRoom || !formData.checkInDate || !formData.checkOutDate) return 0;
    const nights = Math.ceil(Math.abs(new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    return selectedRoom.price * (nights || 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.idNumber || !formData.checkInDate || !formData.checkOutDate) {
      alert("Please fill all required fields including NIC/Passport Number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          guest: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            idNumber: formData.idNumber
          },
          booking: {
            roomType: formData.roomType,
            status: formData.status === 'checked-in' ? 'checked-in' : 'confirmed',
            checkIn: formData.checkInDate,
            checkOut: formData.checkOutDate,
          }
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setStep(1);
        setFormData({
          firstName: '', lastName: '', email: '', phone: '', idNumber: '',
          roomType: 'Standard', adults: 1, children: 0, status: 'due-in',
          checkInDate: '', checkOutDate: '', mealPreference: 'regular'
        });
      } else {
        const err = await response.json();
        alert(err.error || "Failed to create booking");
      }
    } catch (error) {
      console.error(error);
      alert("Booking creation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-all" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Reservation</h2>
              <p className="text-sm text-gray-500">Step {step} of 2: {step === 1 ? 'Guest & Room Details' : 'Confirm & Payment'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto max-h-[70vh]">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900 text-lg">Guest Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900" required />
                      <input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900" required />
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900" required />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900" required />
                      </div>
                      <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="NIC / Passport Number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900 text-lg">Stay Details</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Room Tier</label>
                        <div className="grid grid-cols-2 gap-3">
                          {roomTypes.map(r => (
                            <div
                              key={r.value}
                              onClick={() => setFormData(prev => ({ ...prev, roomType: r.value }))}
                              className={`cursor-pointer border rounded-xl p-3 transition-all ${formData.roomType === r.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                              <div className="font-semibold text-sm text-gray-900">{r.label}</div>
                              <div className="text-xs text-gray-500">${r.price}/night</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Check In</label>
                        <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-900" required />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Check Out</label>
                        <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-900" required />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-900">
                          <option value="due-in">Due In (Reservation)</option>
                          <option value="checked-in">Check In Now</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="max-w-lg mx-auto">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Review Booking Details</h3>
                    <p className="text-gray-600 mb-6">Please verify the information before confirming.</p>

                    <div className="bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 space-y-3">
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Guest</span>
                        <span className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Room</span>
                        <span className="font-medium text-gray-900">{formData.roomType}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Period</span>
                        <span className="font-medium text-gray-900">{formData.checkInDate} <span className="text-gray-400 mx-1">→</span> {formData.checkOutDate}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-gray-900 font-bold">Total Est.</span>
                        <span className="text-blue-600 font-bold text-lg">${calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                {step === 2 && (
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                    Back
                  </button>
                )}
                {step === 1 ? (
                  <button type="button" onClick={() => setStep(2)} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                    Next Step
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                    {isLoading ? 'Processing...' : (
                      <>
                        <CreditCard className="h-4 w-4" /> Confirm Booking
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}