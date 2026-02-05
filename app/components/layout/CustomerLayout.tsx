"use client";

import Header from "../common/Header";
import Navbar from "../common/Navbar";
import MobileBottomNav from "./MobileBottomNav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header dashboardType="customer" />
      {/* Hide Navbar on mobile, show on desktop */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      <main className="flex-1 p-4 sm:p-6 bg-gray-50 pb-32 md:pb-6">{children}</main>

      {/* Mobile Bottom Navigation - shown on all customer pages */}
      <MobileBottomNav />
    </div>
  );
}
