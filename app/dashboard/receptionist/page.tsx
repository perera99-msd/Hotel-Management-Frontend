"use client";

import {
  AlertTriangle,
  Bed,
  CheckCircle,
  Loader2,
  Package,
  TrendingUp,
  Users,
  Utensils
} from "lucide-react";
import React, { useEffect, useState } from "react";
import ChartCard from "../../components/dashboard/ChartCard";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentActivity from "../../components/dashboard/RecentActivity";
import StatsCard from "../../components/dashboard/StatsCard";
import AdminReceptionistLayout from "../../components/layout/AdminReceptionistLayout";
import { useAuth } from "../../context/AuthContext";

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
  const [hotelName, setHotelName] = useState("Grand Hotel");

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch all data in parallel
        const [dashboardRes, invoicesRes, ordersRes, inventoryRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/reports/dashboard`, { headers }),
          fetch(`${API_URL}/api/invoices`, { headers }),
          fetch(`${API_URL}/api/orders`, { headers }),
          fetch(`${API_URL}/api/inventory`, { headers }),
          fetch(`${API_URL}/api/settings`, { headers })
        ]);

        const dashboardData = await dashboardRes.json();
        const invoicesData = await invoicesRes.json();
        const ordersData = await ordersRes.json();
        const inventoryData = await inventoryRes.json();
        const settingsData = settingsRes.ok ? await settingsRes.json() : null;

        if (settingsData?.hotelName) {
          setHotelName(settingsData.hotelName);
        }

        if (dashboardRes.ok) {
          const { metrics, roomStatus, occupancyData: backendOccupancyData } = dashboardData;

          // Calculate Cleaning Rooms (Available Dirty + Occupied Dirty)
          const cleaningCount = (roomStatus?.available?.dirty || 0) + (roomStatus?.occupied?.dirty || 0);

          // Calculate today's orders count
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayOrders = Array.isArray(ordersData)
            ? ordersData.filter((order: any) => {
              const orderDate = new Date(order.createdAt);
              orderDate.setHours(0, 0, 0, 0);
              return orderDate.getTime() === today.getTime() &&
                order.status !== 'Cancelled' &&
                order.status !== 'Served';
            }).length
            : 0;

          // Calculate low stock items (items with quantity below reorder level)
          const lowStockCount = Array.isArray(inventoryData)
            ? inventoryData.filter((item: any) =>
              item.quantity <= (item.reorderLevel || 10)
            ).length
            : 0;

          // Calculate real revenue from paid invoices
          let totalRevenue = 0;
          if (Array.isArray(invoicesData)) {
            totalRevenue = invoicesData
              .filter((inv: any) => inv.status === 'paid')
              .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
          }

          // Calculate monthly revenue trend (last 6 months)
          const revenueByMonth: { [key: string]: number } = {};
          if (Array.isArray(invoicesData)) {
            invoicesData.forEach((inv: any) => {
              if (inv.status === 'paid' && inv.createdAt) {
                const date = new Date(inv.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (inv.total || 0);
              }
            });
          }

          // Get last 6 months in order
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const revenueChartData = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            revenueChartData.push({
              name: monthNames[date.getMonth()],
              value: revenueByMonth[monthKey] || 0
            });
          }

          setStats({
            totalRooms: (metrics?.totalAvailableRoom || 0) + (metrics?.totalOccupiedRoom || 0) + cleaningCount + (roomStatus?.available?.inspected || 0),
            availableRooms: metrics?.totalAvailableRoom || 0,
            occupiedRooms: metrics?.totalOccupiedRoom || 0,
            cleaningRooms: cleaningCount,
            todayCheckIns: metrics?.todayCheckIns || 0,
            todayCheckOuts: metrics?.todayCheckOuts || 0,
            todayOrders: todayOrders,
            lowStockItems: lowStockCount,
            occupancyRate: metrics?.totalInHotel ? Math.round((metrics.totalInHotel / ((metrics?.totalAvailableRoom || 0) + (metrics?.totalOccupiedRoom || 0)) * 100)) : 0,
            revenue: totalRevenue,
          });

          // Room Status Distribution
          setRoomStatusData([
            { name: "Available", value: metrics?.totalAvailableRoom || 0 },
            { name: "Occupied", value: metrics?.totalOccupiedRoom || 0 },
            { name: "Cleaning", value: cleaningCount },
            { name: "Maintenance", value: (roomStatus?.available?.inspected || 0) },
          ]);

          // Set occupancy data from backend (last 6 months)
          if (backendOccupancyData && Array.isArray(backendOccupancyData)) {
            setOccupancyData(backendOccupancyData.map((item: any) => ({
              name: item.name,
              value: item.percentage
            })));
          }

          // Set revenue trend data
          setRevenueData(revenueChartData);

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
                Welcome to {hotelName}
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

        {/* Quick Actions */}
        <QuickActions />

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
            value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Paid invoices"
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
              data={occupancyData.length > 0 ? occupancyData : [{ name: "No Data", value: 0 }]}
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
            data={revenueData.length > 0 ? revenueData : [{ name: "No Data", value: 0 }]}
            dataKey="value"
            nameKey="name"
          />
        </div>
      </div>
    </AdminReceptionistLayout>
  );
};

export default Dashboard;