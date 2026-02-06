/* */
"use client";
import { Database, Shield, User } from "lucide-react";
import { useState } from "react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import ProfileTab from "../../../components/settings/ProfileTab";
import SystemTab from "../../../components/settings/SystemTab";
import UsersTab from "../../../components/settings/UsersTab";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "users", name: "User Management", icon: Shield },
    { id: "system", name: "System", icon: Database },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileTab />;
      case "users": return <UsersTab />;
      case "system": return <SystemTab />;
      default: return <ProfileTab />;
    }
  };

  return (
    <AdminReceptionistLayout role="admin">
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and system preferences</p>
          </div>
        </div>
        <nav className="border-b border-gray-200 flex space-x-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
        {renderTabContent()}
      </div>
    </AdminReceptionistLayout>
  );
}