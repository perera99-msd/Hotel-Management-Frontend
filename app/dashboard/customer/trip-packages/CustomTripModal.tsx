"use client";

import { useState, useContext } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import toast from "react-hot-toast";

interface CustomTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTripCreated?: (tripData: any) => void;
}

export default function CustomTripModal({
    isOpen,
    onClose,
    onTripCreated,
}: CustomTripModalProps) {
    const { token } = useContext(AuthContext);
    const [tripData, setTripData] = useState({
        destination: "",
        duration: "",
        participants: 1,
        budget: "",
        startDate: "",
        endDate: "",
        preferences: [] as string[],
        specialRequirements: "",
        accommodation: "",
        transportation: "",
        activities: "",
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const preferenceOptions = [
        "Adventure",
        "Relaxation",
        "Cultural",
        "Food & Dining",
        "Shopping",
        "Nature",
        "Historical",
        "Beach",
        "Mountains",
        "City Tour",
    ];

    const participantOptions = Array.from({length: 20}, (_, i) => i + 1);
    const accommodationOptions = ["Luxury", "Standard", "Budget", "Hostel", "Vacation Rental"];
    const transportationOptions = ["Private Car", "Rental Car", "Public Transport", "Tour Bus", "Mixed"];

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setTripData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setTripData((prev) => ({
            ...prev,
            budget: value,
        }));
    };

    const handlePreferenceToggle = (preference: string) => {
        setTripData((prev) => ({
            ...prev,
            preferences: prev.preferences.includes(preference)
                ? prev.preferences.filter((p) => p !== preference)
                : [...prev.preferences, preference],
        }));
    };

    const handleNextStep = () => {
        setCurrentStep((prev) => prev + 1);
    };

    const handlePrevStep = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        if (!token) {
            toast.error("Please login to submit a request");
            return;
        }

        setLoading(true);
        try {
            // Format details as a readable string for the backend 'details' field
            const formattedDetails = `
**Custom Trip Request Details**
- **Destination:** ${tripData.destination}
- **Duration:** ${tripData.startDate} to ${tripData.endDate}
- **Budget:** $${tripData.budget || 'N/A'}
- **Preferences:** ${tripData.preferences.join(', ') || 'None'}
- **Accommodation:** ${tripData.accommodation}
- **Transportation:** ${tripData.transportation}
- **Special Requirements:** ${tripData.specialRequirements || 'None'}
- **Activities:** ${tripData.activities || 'None'}
            `.trim();

            const payload = {
                location: tripData.destination,
                tripDate: tripData.startDate,
                participants: Number(tripData.participants),
                details: formattedDetails
            };

            const response = await fetch(`${API_URL}/api/trips/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to submit custom trip request');
            }

            onTripCreated?.(tripData);
            setShowSuccessPopup(true);

        } catch (error: any) {
            console.error("Error creating custom trip:", error);
            toast.error(error.message || "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    const closeSuccessPopup = () => {
        setShowSuccessPopup(false);
        onClose();
        // Reset form
        setTripData({
            destination: "",
            duration: "",
            participants: 1,
            budget: "",
            startDate: "",
            endDate: "",
            preferences: [],
            specialRequirements: "",
            accommodation: "",
            transportation: "",
            activities: "",
        });
        setCurrentStep(1);
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return tripData.destination && tripData.startDate && tripData.endDate;
            case 2:
                return tripData.preferences.length > 0;
            case 3:
                return tripData.accommodation && tripData.transportation;
            default:
                return true;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h3>
                            <p className="text-gray-600 mb-6">
                                Your custom trip request has been received. Our travel experts will review your preferences and contact you within 24 hours with a personalized itinerary.
                            </p>
                            <button
                                onClick={closeSuccessPopup}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-[#199FDA] text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-semibold">Create Custom Trip</h2>
                            <div className="flex items-center mt-2">
                                {[1, 2, 3, 4].map((step) => (
                                    <div key={step} className="flex items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${step === currentStep
                                                    ? "bg-white text-purple-600"
                                                    : step < currentStep
                                                        ? "bg-green-500 text-white"
                                                        : "bg-purple-400 text-white"
                                                }`}
                                        >
                                            {step < currentStep ? "✓" : step}
                                        </div>
                                        {step < 4 && (
                                            <div
                                                className={`w-4 h-0.5 mx-1 ${step < currentStep ? "bg-green-500" : "bg-purple-400"
                                                    }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white text-2xl font-bold hover:text-purple-200 transition-colors"
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1 max-h-[calc(85vh-140px)]">
                        {/* Step 1: Basic Information */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-black mb-2">Basic Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">
                                            Destination *
                                        </label>
                                        <input
                                            type="text"
                                            name="destination"
                                            value={tripData.destination}
                                            onChange={handleInputChange}
                                            placeholder="Where do you want to go?"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">
                                            Number of Participants *
                                        </label>
                                        <select
                                            name="participants"
                                            value={tripData.participants}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                                        >
                                            {participantOptions.map((num) => (
                                                <option key={num} value={num} className="text-black">
                                                    {num} {num === 1 ? 'person' : 'people'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">
                                            Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={tripData.startDate}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split("T")[0]}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">
                                            End Date *
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={tripData.endDate}
                                            onChange={handleInputChange}
                                            min={tripData.startDate || new Date().toISOString().split("T")[0]}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Estimated Budget (USD)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            type="text"
                                            name="budget"
                                            value={tripData.budget ? `$${tripData.budget}` : ''}
                                            onChange={handleBudgetChange}
                                            placeholder="Enter amount in USD"
                                            className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Preferences */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-black mb-2">Travel Preferences</h3>

                                <div>
                                    <label className="block text-sm font-medium text-black mb-3">
                                        What type of activities interest you? *
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {preferenceOptions.map((preference) => (
                                            <button
                                                key={preference}
                                                type="button"
                                                onClick={() => handlePreferenceToggle(preference)}
                                                className={`p-2 border rounded-lg text-sm font-medium transition-all ${tripData.preferences.includes(preference)
                                                        ? "bg-purple-100 border-purple-500 text-black"
                                                        : "border-gray-300 text-black hover:border-purple-300 hover:bg-purple-50"
                                                    }`}
                                            >
                                                {preference}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Special Requirements or Interests
                                    </label>
                                    <textarea
                                        name="specialRequirements"
                                        value={tripData.specialRequirements}
                                        onChange={handleInputChange}
                                        placeholder="Any dietary restrictions, accessibility needs, or specific interests?"
                                        rows={2}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Accommodation & Transportation */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-black mb-2">Accommodation & Transportation</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-3">
                                            Preferred Accommodation Type *
                                        </label>
                                        <div className="space-y-2">
                                            {accommodationOptions.map((option) => (
                                                <label key={option} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="accommodation"
                                                        value={option}
                                                        checked={tripData.accommodation === option}
                                                        onChange={handleInputChange}
                                                        className="text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="text-black font-medium">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-black mb-3">
                                            Preferred Transportation *
                                        </label>
                                        <div className="space-y-2">
                                            {transportationOptions.map((option) => (
                                                <label key={option} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="transportation"
                                                        value={option}
                                                        checked={tripData.transportation === option}
                                                        onChange={handleInputChange}
                                                        className="text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="text-black font-medium">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Specific Activities or Attractions
                                    </label>
                                    <textarea
                                        name="activities"
                                        value={tripData.activities}
                                        onChange={handleInputChange}
                                        placeholder="Any specific places you want to visit or activities you want to do?"
                                        rows={2}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-black mb-2">Review Your Custom Trip Request</h3>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="font-medium text-black">Destination:</span>
                                            <p className="text-black font-semibold">{tripData.destination}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-black">Participants:</span>
                                            <p className="text-black font-semibold">
                                                {tripData.participants} {tripData.participants === 1 ? 'person' : 'people'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-black">Dates:</span>
                                            <p className="text-black font-semibold">
                                                {tripData.startDate} to {tripData.endDate}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-black">Budget:</span>
                                            <p className="text-black font-semibold">
                                                {tripData.budget ? `$${tripData.budget}` : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-800">
                                        <strong className="text-blue-900">Note:</strong> Your request will be reviewed by our team.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer with Navigation */}
                    <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center flex-shrink-0">
                        <button
                            onClick={currentStep === 1 ? onClose : handlePrevStep}
                            className="px-6 py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
                        >
                            {currentStep === 1 ? "Cancel" : "Back"}
                        </button>

                        <div className="flex items-center space-x-3">
                            {currentStep < 4 ? (
                                <button
                                    onClick={handleNextStep}
                                    disabled={!isStepValid()}
                                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {loading ? "Submitting..." : "Submit Request"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}