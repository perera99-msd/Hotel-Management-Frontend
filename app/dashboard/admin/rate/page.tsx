/* */
"use client"

import React, { useState, useEffect } from 'react'
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout"
import { ChevronDown, Save, RefreshCw } from 'lucide-react'
import { useAuth } from "../../../context/AuthContext"
import toast from "react-hot-toast"

interface Room {
  _id: string
  roomNumber: string
  type: string
  rate: number
  monthlyRates?: number[]
  status: string
  floor: number
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function RatePage() {
  const { token } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [monthlyRates, setMonthlyRates] = useState<number[]>(Array(12).fill(0))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const fetchRooms = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRooms(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch rooms", error)
      toast.error("Failed to load rooms")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [token])

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room)
    // Populate monthlyRates from room data or default to rate for all months
    const rates = room.monthlyRates && room.monthlyRates.length === 12 
      ? room.monthlyRates 
      : Array(12).fill(room.rate || 0)
    setMonthlyRates(rates)
    setIsDropdownOpen(false)
  }

  const handleRateChange = (monthIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0
    const updated = [...monthlyRates]
    updated[monthIndex] = numValue
    setMonthlyRates(updated)
  }

  const handleSave = async () => {
    if (!selectedRoom || !token) return
    setIsSaving(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rooms/${selectedRoom._id}/monthly-rates`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ monthlyRates })
      })

      if (res.ok) {
        toast.success("Monthly rates updated successfully")
        await fetchRooms() // Refresh list
        // Update selected room with new data
        const updatedRoomData = rooms.find(r => r._id === selectedRoom._id)
        if (updatedRoomData) {
          setSelectedRoom({...updatedRoomData, monthlyRates})
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update rates")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to save monthly rates")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRate = async (rate: RateTableData) => {
    if (!confirm(`Are you sure you want to delete rate for ${rate.roomType} room?`)) {
      setOpenMenu(null)
      return
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rates/${rate.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setTableData(prev => prev.filter(item => item.id !== rate.id));
        alert(`Rate for ${rate.roomType} room has been deleted successfully!`);
      } else {
        alert("Failed to delete rate");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete rate");
    } finally {
      setOpenMenu(null)
    }
  }

  const getDealsColor = (deals: string) => {
    switch (deals?.toLowerCase()) {
      case 'family deal': return 'bg-blue-100 text-blue-800'
      case 'christmas deal': return 'bg-green-100 text-green-800'
      case 'black friday': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPolicyColor = (policy: string) => {
    switch (policy?.toLowerCase()) {
      case 'strict': return 'text-red-600'
      case 'flexible': return 'text-green-600'
      case 'non refundable': return 'text-gray-600'
      default: return 'text-gray-800'
    }
  }

  return (
    <AdminReceptionistLayout role="admin">
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <p className="text-gray-600">Monthly Rate Management</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Room</label>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="min-w-[300px] text-left px-4 py-2.5 bg-white border border-gray-300 rounded-lg flex justify-between items-center hover:border-blue-500 transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <span className="text-gray-900">
                  {selectedRoom 
                    ? `Room ${selectedRoom.roomNumber} - ${selectedRoom.type}` 
                    : 'Choose a room to manage rates'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-6 text-center text-gray-500">Loading rooms...</div>
                    ) : rooms.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">No rooms available</div>
                    ) : (
                      rooms.map((room) => (
                        <button
                          key={room._id}
                          onClick={() => handleRoomSelect(room)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="font-semibold text-sm text-gray-900">Room {room.roomNumber}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {room.type} • Floor {room.floor} • Base Rate: ${room.rate}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={fetchRooms}
              className="mt-6 p-2.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
              title="Refresh rooms"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {selectedRoom && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-md"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Monthly Rates'}
            </button>
          )}
        </div>

        {selectedRoom ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly Rates for Room {selectedRoom.roomNumber}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Set different rates for each month. Base rate: ${selectedRoom.rate}/night
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MONTHS.map((month, index) => (
                <div key={month} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {month}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyRates[index] || ''}
                      onChange={(e) => handleRateChange(index, e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> When creating a booking, the rate for the check-in month will be used to calculate the total charge.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Select a room to manage monthly rates</p>
            <p className="text-gray-500 text-sm mt-2">Choose a room from the dropdown above to view and edit its monthly pricing</p>
          </div>
        )}
      </div>
    </AdminReceptionistLayout>
  )
}