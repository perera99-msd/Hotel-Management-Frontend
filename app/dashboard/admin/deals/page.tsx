/* */
"use client";

import { useState, useEffect } from "react";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import DealModel from "../../../components/deal/dealmodel";
import DealUpdateModel from "../../../components/deal/dealupdatemodel";
import { Plus, MoreVertical } from "lucide-react";
import { useAuth } from "../../../context/AuthContext"; // ✅ Added Auth Hook

interface Deal {
  id: string;
  referenceNumber: string;
  dealName: string;
  reservationsLeft: number;
  endDate: string;
  roomType: string;
  status: 'Ongoing' | 'Full' | 'Inactive' | 'New' | 'Finished';
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
  const [openMenu, setOpenMenu] = useState<number | null>(null);
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
      setOpenMenu(null);
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
        setOpenMenu(null);
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
    <AdminReceptionistLayout role="admin">
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

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button onClick={fetchDeals} className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded text-sm">Retry</button>
          </div>
        ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible">
              <div className="grid grid-cols-7 bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-700">Reference number</div>
                <div className="text-sm font-medium text-gray-700">Deal name</div>
                <div className="text-sm font-medium text-gray-700">Reservations left</div>
                <div className="text-sm font-medium text-gray-700">End date</div>
                <div className="text-sm font-medium text-gray-700">Room type</div>
                <div className="text-sm font-medium text-gray-700">Status</div>
                <div className="text-sm font-medium text-gray-700">Actions</div>
              </div>

              {currentDeals.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No {activeTab} deals found</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentDeals.map((deal, index) => (
                    <div key={deal.id} className="grid grid-cols-7 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
                      <div className="text-sm font-medium text-gray-900">{deal.referenceNumber}</div>
                      <div className="text-sm text-gray-700">{deal.dealName}</div>
                      <div className="text-sm font-medium text-gray-900">{deal.reservationsLeft}</div>
                      <div className="text-sm text-gray-700">{deal.endDate}</div>
                      <div className="text-sm text-gray-700">{deal.roomType}</div>
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>{deal.status}</span>
                      </div>
                      <div className="relative">
                        <MoreVertical 
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === index ? null : index); }} 
                          className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" 
                        />
                        {openMenu === index && (
                          <div className="absolute right-0 top-8 w-40 bg-white shadow-xl rounded-md border border-gray-200 z-50">
                            <button className="text-black w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setSelectedDeal(deal); setShowUpdateDealModel(true); setOpenMenu(null); }}>Update</button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDeleteDeal(deal)}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        )}

        <DealModel isOpen={showDealModel} onClose={() => setShowDealModel(false)} onSave={handleSaveDeal} />
        <DealUpdateModel isOpen={showUpdateDealModel} onClose={() => { setShowUpdateDealModel(false); setSelectedDeal(null); }} dealData={selectedDeal} onUpdate={handleUpdateSubmit} isUpdating={isUpdating} />
      </div>
    </AdminReceptionistLayout>
  );
}