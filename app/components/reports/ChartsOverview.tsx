"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartsOverviewProps {
  occupancyData: any[];
  roomTypeData: any[];
  dailyOccupancy: any[];
  guestSatisfaction: any[];
}

export default function ChartsOverview({
  occupancyData,
  roomTypeData,
  dailyOccupancy,
  guestSatisfaction,
}: ChartsOverviewProps) {
  const chartColors = ["#4a90e2", "#7ed321", "#f5a623", "#d0021b"];

  return (
    <div className="space-y-6">
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Occupancy & Revenue */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Occupancy & Revenue
          </h3>
          <div className="h-64">
            {occupancyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No occupancy data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="occupancy"
                    stroke={chartColors[0]}
                    fill={chartColors[0]}
                    fillOpacity={0.3}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColors[1]}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Room Type Distribution */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Room Type Distribution
          </h3>
          <div className="h-64">
            {roomTypeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No room-type data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill={chartColors[0]}
                    dataKey="value"
                  >
                    {roomTypeData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Occupancy Pattern */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Occupancy Pattern
          </h3>
          <div className="h-64">
            {dailyOccupancy.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No daily occupancy data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyOccupancy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="occupancy" fill={chartColors[0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Guest Satisfaction Trend */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Guest Satisfaction Trend
          </h3>
          <div className="h-64">
            {guestSatisfaction.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No feedback data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={guestSatisfaction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[3.5, 5]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke={chartColors[1]}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
