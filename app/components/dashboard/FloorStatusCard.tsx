/* */
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface FloorStatusCardProps {
    data: any;
    initialFloor?: number;
}

export default function FloorStatusCard({ data, initialFloor }: FloorStatusCardProps) {
    const { token } = useAuth();
    const [availableFloors, setAvailableFloors] = useState<number[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
    const [floorData, setFloorData] = useState<any>(data);
    const [loading, setLoading] = useState(false);

    // Fetch available floors
    useEffect(() => {
        const fetchFloors = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reports/available-floors`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setAvailableFloors(result.floors || []);
                    if (result.floors && result.floors.length > 0) {
                        setSelectedFloor(initialFloor || result.floors[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch floors", error);
            }
        };
        fetchFloors();
    }, [token, initialFloor]);

    // Fetch floor-specific data when floor changes
    useEffect(() => {
        const fetchFloorStatus = async () => {
            if (!token || selectedFloor === null) return;
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reports/floor-status?floor=${selectedFloor}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setFloorData(result);
                }
            } catch (error) {
                console.error("Failed to fetch floor status", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFloorStatus();
    }, [selectedFloor, token]);

    if (!floorData) return null;
    const { percentage } = floorData;

    const radius = 60;
    const strokeWidth = 12;
    const halfCircumference = radius * Math.PI;
    const progressLength = (percentage / 100) * halfCircumference;
    const progressOffset = halfCircumference - progressLength;
    const size = radius * 2 + strokeWidth;
    const svgHeight = radius + strokeWidth;

    return (
        <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Floor status</h2>
                {availableFloors.length > 0 && (
                    <select
                        value={selectedFloor || ''}
                        onChange={(e) => setSelectedFloor(parseInt(e.target.value, 10))}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    >
                        {availableFloors.map((floor) => (
                            <option key={floor} value={floor}>
                                Floor {floor}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8">
                <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                    <span>Completed</span>
                </div>
                <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-gray-300 mr-2"></span>
                    <span>Yet to Complete</span>
                </div>
            </div>

            <div className="flex items-center justify-center">
                <div className="relative" style={{ width: `${size}px`, height: `${svgHeight}px`, overflow: 'hidden' }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} strokeDasharray={halfCircumference} strokeDashoffset={0} transform={`rotate(-180 ${size / 2} ${size / 2})`} strokeLinecap="round" />
                        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#3B82F6" strokeWidth={strokeWidth} strokeDasharray={halfCircumference} strokeDashoffset={progressOffset} transform={`rotate(-180 ${size / 2} ${size / 2})`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-4xl font-bold text-gray-900">{loading ? '...' : percentage}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}