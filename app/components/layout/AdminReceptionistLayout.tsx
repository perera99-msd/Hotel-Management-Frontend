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
    <div className="flex min-h-screen overflow-x-hidden">
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
        <main className="flex-1 min-w-0 relative bg-gray-50 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
