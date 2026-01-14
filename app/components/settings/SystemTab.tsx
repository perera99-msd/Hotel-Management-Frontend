"use client";
import React, { useState, useEffect } from "react";
import { Save, Database, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function SystemTab() {
  const { token } = useAuth();
  const [systemInfo, setSystemInfo] = useState({ 
    name: "", 
    address: "", 
    phone: "", 
    email: "" 
  });
  const [actionLoading, setActionLoading] = useState("");

  // Fetch Settings on Load
  useEffect(() => {
    const fetchSettings = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSystemInfo({ 
                name: data.hotelName || "", 
                address: data.address || "", 
                phone: data.phone || "", 
                email: data.email || "" 
            });
        } catch (e) { 
            console.error("Failed to fetch settings", e); 
        }
    };
    fetchSettings();
  }, [token]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/settings`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                hotelName: systemInfo.name, 
                address: systemInfo.address, 
                phone: systemInfo.phone, 
                email: systemInfo.email 
            })
        });
        
        if (res.ok) {
            toast.success("✅ System information saved!");
        } else {
            throw new Error();
        }
    } catch (err) { 
        toast.error("❌ Failed to save settings."); 
    }
  };

  const downloadFile = async (endpoint: string, label: string) => {
      if(!token) return;
      try {
          setActionLoading(label);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${endpoint}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error("Download failed");

          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          // Try to get filename from headers or default
          const contentDisposition = res.headers.get('Content-Disposition');
          let filename = `${label.toLowerCase().replace(' ', '-')}.json`;
          if (contentDisposition && contentDisposition.includes('filename=')) {
              filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
          }
          
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success(`${label} completed successfully!`);

      } catch (err) {
          console.error(err);
          toast.error(`Failed to ${label.toLowerCase()}`);
      } finally {
          setActionLoading("");
      }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hotel Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
            <input 
              type="text" 
              placeholder="Hotel Name" 
              value={systemInfo.name} 
              onChange={(e) => setSystemInfo({...systemInfo, name: e.target.value})} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input 
              type="text" 
              placeholder="Address" 
              value={systemInfo.address} 
              onChange={(e) => setSystemInfo({...systemInfo, address: e.target.value})} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input 
              type="text" 
              placeholder="Phone" 
              value={systemInfo.phone} 
              onChange={(e) => setSystemInfo({...systemInfo, phone: e.target.value})} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="Email" 
              value={systemInfo.email} 
              onChange={(e) => setSystemInfo({...systemInfo, email: e.target.value})} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>

        <div className="mt-6">
            <button type="submit" className="btn btn-primary flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <Save className="h-4 w-4 mr-2" /> Save Settings
            </button>
        </div>
      </form>

      {/* Data Management Section */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        {/* Export Data */}
        <div className="flex items-center justify-between p-4 w-full border border-gray-300 rounded-lg">
            <div>
                <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
                <p className="text-xs text-gray-500">Download a simplified export of business data.</p>
            </div>
            <button 
                type="button" 
                onClick={() => downloadFile('/api/settings/export', 'Export Data')}
                disabled={!!actionLoading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 transition disabled:opacity-50"
            >
                {actionLoading === 'Export Data' ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Database className="h-4 w-4 mr-2"/>}
                Export
            </button>
        </div>

        {/* Backup Database */}
        <div className="flex items-center justify-between p-4 w-full border border-gray-300 rounded-lg">
             <div>
                <h4 className="text-sm font-medium text-gray-900">Backup Database</h4>
                <p className="text-xs text-gray-500">Download a full JSON dump of the system.</p>
            </div>
            <button 
                type="button" 
                onClick={() => downloadFile('/api/settings/backup', 'Backup Database')}
                disabled={!!actionLoading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 transition disabled:opacity-50"
            >
                {actionLoading === 'Backup Database' ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Database className="h-4 w-4 mr-2"/>}
                Backup
            </button>
        </div>

      </div>
    </div>
  );
}