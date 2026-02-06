/* */
"use client";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useAuth } from "../../context/AuthContext";

type TimeRange = 'monthly' | 'weekly' | 'yearly';

export default function OccupancyStatisticsCard({ data }: { data?: any[] }) {
    const { token } = useAuth();
    const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
    const [chartData, setChartData] = useState<any[]>(data || []);
    const [loading, setLoading] = useState(false);

    // Fetch occupancy data based on selected time range
    const fetchOccupancyData = async (range: TimeRange) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reports/occupancy?range=${range}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setChartData(result.occupancyData || []);
            }
        } catch (error) {
            console.error("Failed to fetch occupancy data", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when time range changes
    useEffect(() => {
        fetchOccupancyData(timeRange);
    }, [timeRange, token]);

    // Use initial data for monthly on first load
    useEffect(() => {
        if (data && data.length > 0 && timeRange === 'monthly') {
            setChartData(data);
        }
    }, [data]);

    const handleRangeChange = (range: TimeRange) => {
        setTimeRange(range);
    };

    return (
        <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Occupancy Statistics</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleRangeChange('weekly')}
                        disabled={loading}
                        className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${timeRange === 'weekly'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Calendar className="h-4 w-4" />
                        Weekly
                    </button>
                    <button
                        onClick={() => handleRangeChange('monthly')}
                        disabled={loading}
                        className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${timeRange === 'monthly'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Calendar className="h-4 w-4" />
                        Monthly
                    </button>
                    <button
                        onClick={() => handleRangeChange('yearly')}
                        disabled={loading}
                        className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${timeRange === 'yearly'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Calendar className="h-4 w-4" />
                        Yearly
                    </button>
                </div>
            </div>
            <div className="h-64 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid horizontal={true} vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} interval={0} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `${value}%`} orientation="left" />
                        <Bar dataKey="percentage" fill="#4C88F1" radius={[2, 2, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}