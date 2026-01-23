"use client";

import React, { useEffect, useState } from "react";
import {
  Bed,
  Users,
  Utensils,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import AdminReceptionistLayout from "../../components/layout/AdminReceptionistLayout";
import StatsCard from "../../components/dashboard/StatsCard";
import ChartCard from "../../components/dashboard/ChartCard";
import RecentActivity from "../../components/dashboard/RecentActivity";
import QuickActions from "../../components/dashboard/QuickActions";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  todayOrders: number;
  lowStockItems: number;
  occupancyRate: number;
  revenue: number;
}

const initialStats: DashboardStats = {
  totalRooms: 0,
  availableRooms: 0,
  occupiedRooms: 0,
  cleaningRooms: 0,
  todayCheckIns: 0,
  todayCheckOuts: 0,
  todayOrders: 0,
  lowStockItems: 0,
  occupancyRate: 0,
  revenue: 0,
};

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [roomStatusData, setRoomStatusData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Main Dashboard Metrics (Rooms, Check-ins)
        const dashboardRes = await fetch(`${API_URL}/api/reports/dashboard`, { headers });
        const dashboardData = await dashboardRes.json();

        // 2. Fetch Analytics (Revenue, Trends, Daily Occupancy)
        const analyticsRes = await fetch(`${API_URL}/api/reports/analytics`, { headers });
        const analyticsData = await analyticsRes.json();

        // 3. Fetch Sidebar Counts (Active Orders, Low Stock)
        const sidebarRes = await fetch(`${API_URL}/api/reports/sidebar-counts`, { headers });
        const sidebarData = await sidebarRes.json();

        if (dashboardRes.ok && analyticsRes.ok && sidebarRes.ok) {
            // -- Parse Stats --
            const { metrics, roomStatus } = dashboardData;
            
            // Calculate Cleaning Rooms (Available Dirty + Occupied Dirty)
            const cleaningCount = (roomStatus?.available?.dirty || 0) + (roomStatus?.occupied?.dirty || 0);
            
            setStats({
                totalRooms: (metrics?.totalAvailableRoom || 0) + (metrics?.totalOccupiedRoom || 0) + cleaningCount + (roomStatus?.available?.inspected || 0), // Sum all states
                availableRooms: metrics?.totalAvailableRoom || 0,
                occupiedRooms: metrics?.totalOccupiedRoom || 0,
                cleaningRooms: cleaningCount,
                todayCheckIns: metrics?.todayCheckIns || 0,
                todayCheckOuts: metrics?.todayCheckOuts || 0,
                todayOrders: sidebarData.dining || 0,
                lowStockItems: sidebarData.inventory || 0,
                occupancyRate: analyticsData.metrics?.occupancyRate || 0,
                revenue: analyticsData.metrics?.revenue || 0,
            });

            // -- Parse Charts --
            
            // 1. Weekly Occupancy (Last 7 Days)
            // Backend returns dailyOccupancy array. We reverse it if needed to show chronological order.
            const weeklyData = analyticsData.dailyOccupancy?.map((d: any) => ({
                name: d.day,
                value: d.occupancy
            })) || [];
            setOccupancyData(weeklyData.reverse()); 

            // 2. Room Status Distribution
            setRoomStatusData([
                { name: "Available", value: metrics?.totalAvailableRoom || 0 },
                { name: "Occupied", value: metrics?.totalOccupiedRoom || 0 },
                { name: "Cleaning", value: cleaningCount },
                { name: "Maintenance", value: (roomStatus?.available?.inspected || 0) },
            ]);

            // 3. Monthly Revenue Trend
            // Backend 'occupancyData' (monthlyData) contains revenue info
            const monthlyRevenue = analyticsData.occupancyData?.map((m: any) => ({
                name: m.name,
                value: m.revenue
            })) || [];
            setRevenueData(monthlyRevenue);

            setRecentActivity(dashboardData.recentActivity || []);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
      return (
        <AdminReceptionistLayout role="receptionist">
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        </AdminReceptionistLayout>
      );
  }

  return (
    <AdminReceptionistLayout role="receptionist">
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-700 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold mb-1">
                Welcome to Grand Hotel
              </h1>
              <p className="text-gray-200 text-sm md:text-base">
                Here's what's happening today
              </p>
            </div>
            <div className="hidden md:flex items-center justify-center w-16 h-16 bg-white/20 rounded-lg">
              <Bed className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Rooms"
            value={stats.totalRooms}
            subtitle="Hotel capacity"
            icon={Bed}
            bgColor="bg-gray-500"
            textColor="text-white"
          />
          <StatsCard
            title="Available Rooms"
            value={stats.availableRooms}
            subtitle={`${stats.occupancyRate}% occupied`}
            changeType="positive" // Logic for change % can be added if backend supports historical comparison
            icon={CheckCircle}
            bgColor="bg-green-500"
            textColor="text-white"
          />
          <StatsCard
            title="Today's Check-ins"
            value={stats.todayCheckIns}
            subtitle="Guests arriving"
            icon={Users}
            bgColor="bg-yellow-500"
            textColor="text-white"
          />
          <StatsCard
            title="Today's Orders"
            value={stats.todayOrders}
            subtitle="Active Meal orders"
            icon={Utensils}
            bgColor="bg-teal-500"
            textColor="text-white"
          />
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Occupied Rooms"
            value={stats.occupiedRooms}
            subtitle="Currently in use"
            icon={Bed}
            bgColor="bg-red-500"
            textColor="text-white"
          />
          <StatsCard
            title="Needs Cleaning"
            value={stats.cleaningRooms}
            subtitle="Housekeeping tasks"
            icon={AlertTriangle}
            bgColor="bg-yellow-500"
            textColor="text-white"
          />
          <StatsCard
            title="Low Stock Alert"
            value={stats.lowStockItems}
            subtitle="Items to reorder"
            icon={Package}
            bgColor="bg-red-500"
            textColor="text-white"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            subtitle="This month"
            icon={TrendingUp}
            bgColor="bg-green-500"
            textColor="text-white"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Weekly Occupancy Rate"
              type="bar"
              data={occupancyData}
              dataKey="value"
              nameKey="name"
            />
          </div>
          <RecentActivity items={recentActivity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Room Status Distribution"
            type="pie"
            data={roomStatusData}
            dataKey="value"
            nameKey="name"
          />
          <ChartCard
            title="Monthly Revenue Trend"
            type="bar"
            data={revenueData}
            dataKey="value"
            nameKey="name"
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </AdminReceptionistLayout>
  );
};

export default Dashboard;