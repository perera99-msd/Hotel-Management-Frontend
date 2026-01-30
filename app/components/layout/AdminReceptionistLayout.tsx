"use client";

import { useState } from "react";
import Header from "../common/Header";
import Sidebar from "../common/Sidebar";

export default function AdminReceptionistLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "receptionist";
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        role={role}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <Header
          dashboardType={role}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 relative bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
