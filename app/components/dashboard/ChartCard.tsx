import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartCardProps {
  title: string;
  type: "bar" | "pie";
  data: any[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
}

export default function ChartCard({
  title,
  type,
  data,
  dataKey = "value",
  nameKey = "name",
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#6b7280"], // default neutral colors
}: ChartCardProps): React.ReactElement {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />{" "}
              {/* light gray grid */}
              <XAxis dataKey={nameKey} stroke="#6b7280" />{" "}
              {/* neutral gray axis */}
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  borderColor: "#e5e7eb",
                }}
              />
              <Bar dataKey={dataKey} fill={colors[0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="45%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => {
                  const percentage = (Number(percent ?? 0) * 100).toFixed(0);
                  return `${percentage}%`;
                }}
                outerRadius={70}
                fill={colors[0]}
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{ paddingLeft: "20px" }}
                iconType="square"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  borderColor: "#e5e7eb",
                  padding: "8px 12px",
                }}
                formatter={(value) => [
                  typeof value === "number" ? value.toLocaleString() : value,
                  "Count",
                ]}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
