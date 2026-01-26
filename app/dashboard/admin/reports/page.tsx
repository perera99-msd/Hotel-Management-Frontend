"use client";

import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import ChartsOverview from "../../../components/reports/ChartsOverview";
import ExportOptions from "../../../components/reports/ExportOptions";
import React, { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign, Bed, Loader2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function Reports() {
  const { token, loading: authLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Initial State
  const [data, setData] = useState({
    metrics: {
      occupancyRate: 0,
      occupancyChange: "0",
      revenue: 0,
      revenueChange: "0",
      totalRooms: 0,
      avgRating: 0,
    },
    occupancyData: [],
    roomTypeData: [],
    revenueSources: [],
    dailyOccupancy: [],
    guestSatisfaction: [],
  });

  // 1. Fetch Analytics Data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (authLoading) return;
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reports/analytics?period=${selectedPeriod}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, authLoading, selectedPeriod]);

  // 2. Handle Export (Download CSV)
  const handleExportReport = async (type: string) => {
    if (!token) return;
    
    try {
      setIsExporting(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reports/export/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      // Create blob link to download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to download report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <AdminReceptionistLayout role="admin">
         <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
         </div>
      </AdminReceptionistLayout>
    );
  }

  return (
    <AdminReceptionistLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Hotel performance insights and analytics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full md:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 hover:border-gray-400"
            >
              <option value="daily">Last 7 Days</option>
              <option value="weekly">Last 4 Weeks</option>
              <option value="monthly">Last 6 Months</option>
              <option value="yearly">Last 2 Years</option>
            </select>

            <ExportOptions handleExportReport={handleExportReport} compact />
          </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                {error}
            </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Bed className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.metrics.occupancyRate}%
            </div>
            <div className="text-sm text-gray-600">Occupancy Rate</div>
            <div className={`text-xs mt-1 ${parseFloat(data.metrics.occupancyChange) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {parseFloat(data.metrics.occupancyChange) >= 0 ? "+" : ""}
              {data.metrics.occupancyChange}% vs last month
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${data.metrics.revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Monthly Revenue</div>
            <div className={`text-xs mt-1 ${parseFloat(data.metrics.revenueChange) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {parseFloat(data.metrics.revenueChange) >= 0 ? "+" : ""}
              {data.metrics.revenueChange}% vs last month
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.metrics.totalRooms}
            </div>
            <div className="text-sm text-gray-600">Total Rooms</div>
            <div className="text-xs text-gray-500 mt-1">Available inventory</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.metrics.avgRating}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
            <div className="text-xs text-gray-500 mt-1">Guest satisfaction</div>
          </div>
        </div>

        {/* Charts Section */}
        <ChartsOverview
          occupancyData={data.occupancyData}
          roomTypeData={data.roomTypeData}
          dailyOccupancy={data.dailyOccupancy}
          guestSatisfaction={data.guestSatisfaction}
        />

        {/* Revenue Breakdown */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Revenue Sources</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.revenueSources.map((source: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${source.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mb-2">{source.name}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${source.percentage}%`,
                      backgroundColor: index === 0 ? "#4a90e2" : index === 1 ? "#7ed321" : "#f5a623",
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {source.percentage}% of total
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Export Panel (Bottom) */}
        <ExportOptions handleExportReport={handleExportReport} />
        
        {isExporting && (
           <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
             <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
               <Loader2 className="animate-spin text-blue-600" />
               <p>Generating CSV...</p>
             </div>
           </div>
        )}
      </div>
    </AdminReceptionistLayout>
  );
}