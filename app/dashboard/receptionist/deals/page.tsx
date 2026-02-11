/* */
"use client";

import { Calendar, Eye, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import DealModel from "../../../components/deal/dealmodel";
import DealUpdateModel from "../../../components/deal/dealupdatemodel";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import { useAuth } from "../../../context/AuthContext"; // ✅ Added Auth Hook

interface Deal {
  id: string;
  referenceNumber: string;
  dealName: string;
  reservationsLeft: number;
  startDate?: string;
  endDate: string;
  dealType?: 'room' | 'food' | 'trip';
  discountType?: 'percentage' | 'bogo';
  roomType?: string;
  roomTypeRaw?: string[];
  roomIds?: string[];
  menuItemIds?: string[];
  tripPackageIds?: string[];
  status: 'Ongoing' | 'Full' | 'Inactive' | 'New' | 'Finished';
  image?: string; // ✅ Added image field
  description?: string;
  discount?: number;
}

interface NewDealData {
  dealName: string;
  referenceNumber: string;
  tags: string[];
  price: string;
  description: string;
  roomType: string[];
  discount: string;
  startDate: string;
  endDate: string;
}

interface UpdateDealData {
  id: string;
  referenceNumber: string;
  dealName: string;
  reservationsLeft: number;
  endDate: string;
  roomType: string;
  status: 'Ongoing' | 'Full' | 'Inactive' | 'New' | 'Finished';
}

export default function Page() {
  const { token } = useAuth(); // ✅ Get Token
  const [activeTab, setActiveTab] = useState<'ongoing' | 'finished'>('ongoing');
  const [showDealModel, setShowDealModel] = useState(false);
  const [showUpdateDealModel, setShowUpdateDealModel] = useState(false);
  const [ongoingDeals, setOngoingDeals] = useState<Deal[]>([]);
  const [finishedDeals, setFinishedDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchDeals = async () => {
    if (!token) return; // Wait for auth
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/deals`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ Use Token
        },
      });

      if (response.ok) {
        const allDeals = await response.json();

        // Filter deals based on status
        const ongoing = allDeals.filter((deal: Deal) =>
          ['Ongoing', 'Full', 'Inactive', 'New'].includes(deal.status)
        );
        const finished = allDeals.filter((deal: Deal) =>
          deal.status === 'Finished'
        );

        setOngoingDeals(ongoing);
        setFinishedDeals(finished);
      } else {
        throw new Error("Failed to fetch deals");
      }
    } catch (error) {
      console.error("Failed to fetch deals", error);
      setError("Failed to fetch deals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [token]);

  const currentDeals = activeTab === 'ongoing' ? ongoingDeals : finishedDeals;

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'Ongoing': return 'bg-blue-100 text-blue-800';
      case 'Full': return 'bg-red-100 text-red-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'New': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveDeal = (dealData: NewDealData) => {
    // Refresh list after save (Actual save happens in DealModel)
    fetchDeals();
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (!window.confirm(`Are you sure you want to delete deal "${deal.dealName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/deals/${deal.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert(`Deal "${deal.dealName}" has been deleted.`);
        // Update local state
        if (activeTab === 'ongoing') {
          setOngoingDeals(prev => prev.filter(d => d.id !== deal.id));
        } else {
          setFinishedDeals(prev => prev.filter(d => d.id !== deal.id));
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      alert("Failed to delete deal");
    } finally {
      // no-op
    }
  };

  const handleUpdateSubmit = async (updatedDealData: UpdateDealData) => {
    // Refresh list after update (Actual update happens in DealUpdateModel)
    fetchDeals();
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
    setShowUpdateDealModel(false);
  };

  return (
    <AdminReceptionistLayout role="receptionist">
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <p className="text-gray-600">Deal</p>
        </div>

        {updateSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">Deal updated successfully!</div>
        )}

        {updateError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{updateError}</div>
        )}

        {/* Tabs & Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
            <button onClick={() => setActiveTab('ongoing')} className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === 'ongoing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Ongoing</button>
            <button onClick={() => setActiveTab('finished')} className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === 'finished' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Finished</button>
          </div>
          <button onClick={() => setShowDealModel(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm">
            <Plus className="h-4 w-4" /> Add Deal
          </button>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button onClick={fetchDeals} className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded text-sm">Retry</button>
          </div>
        ) : currentDeals.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            No {activeTab} deals found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentDeals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {/* Image */}
                <div className="relative h-40 w-full bg-gray-100">
                  {deal.image ? (
                    <img src={deal.image} alt={deal.dealName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                      <span className="text-blue-700 font-semibold text-sm">{deal.dealName}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                      {deal.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{deal.dealName}</h3>
                    <p className="text-xs text-gray-500 mt-1">Ref: {deal.referenceNumber}</p>
                  </div>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Type:</span> {(deal.dealType || 'room').toUpperCase()}</p>
                    {deal.dealType === 'room' && (
                      <p><span className="font-medium">Room Type:</span> {deal.roomType || '—'}</p>
                    )}
                    {deal.dealType === 'food' && (
                      <p><span className="font-medium">Menu Items:</span> {deal.menuItemIds?.length || 0}</p>
                    )}
                    {deal.dealType === 'trip' && (
                      <p><span className="font-medium">Trip Packages:</span> {deal.tripPackageIds?.length || 0}</p>
                    )}
                    <p><span className="font-medium">Reservations Left:</span> {deal.reservationsLeft}</p>
                    {deal.discountType === 'bogo' ? (
                      <p><span className="font-medium">Discount:</span> BOGO</p>
                    ) : typeof deal.discount === 'number' && (
                      <p><span className="font-medium">Discount:</span> {deal.discount}%</p>
                    )}
                  </div>

                  {deal.description && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-3">{deal.description}</p>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {deal.startDate ? new Date(deal.startDate).toLocaleDateString() : '—'}
                      {' '}to{' '}
                      {deal.endDate ? new Date(deal.endDate).toLocaleDateString() : '—'}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedDeal(deal); setShowUpdateDealModel(true); }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => { setSelectedDeal(deal); setShowUpdateDealModel(true); }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDeal(deal)}
                      className="px-3 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DealModel isOpen={showDealModel} onClose={() => setShowDealModel(false)} onSave={handleSaveDeal} />
        <DealUpdateModel isOpen={showUpdateDealModel} onClose={() => { setShowUpdateDealModel(false); setSelectedDeal(null); }} dealData={selectedDeal} onUpdate={handleUpdateSubmit} isUpdating={isUpdating} />
      </div>
    </AdminReceptionistLayout>
  );
}