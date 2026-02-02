"use client";
import { Shield } from "lucide-react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import UsersTab from "../../../components/settings/UsersTab";

export default function ReceptionistSettings() {
    return (
        <AdminReceptionistLayout role="receptionist">
            <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600 mt-1">Manage staff users and accounts</p>
                    </div>
                </div>

                {/* Only show User Management section for receptionists */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">User Management</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">Manage staff accounts and permissions. Create, edit, or deactivate user accounts.</p>
                    <UsersTab />
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Note:</span> Receptionists can only manage user accounts. For system settings, database management, and other administrative functions, please contact your administrator.
                    </p>
                </div>
            </div>
        </AdminReceptionistLayout>
    );
}
