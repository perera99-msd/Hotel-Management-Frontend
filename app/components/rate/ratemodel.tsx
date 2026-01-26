/* */
import React, { useEffect, useState } from 'react'
import { useAuth } from "../../context/AuthContext"; // ✅ Added

interface RateModelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (rateData: RateData) => void
}

interface RateData {
  roomType: string
  cancellationPolicy: string
  rooms: string
  price: string
  roomIds: string[]
}

export default function RateModel({ isOpen, onClose, onSave }: RateModelProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<RateData>({
    roomType: '',
    cancellationPolicy: '',
    rooms: '',
    price: '',
    roomIds: []
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomsList, setRoomsList] = useState<any[]>([])

  const availableRooms = roomsList.filter((room) => (room.status || '').toLowerCase() === 'available')

  useEffect(() => {
    const fetchRooms = async () => {
      if (!isOpen || !token) return
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRoomsList(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err)
      }
    }
    fetchRooms()
  }, [isOpen, token])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const handleRoomToggle = (roomId: string) => {
    setFormData(prev => ({
      ...prev,
      roomIds: prev.roomIds.includes(roomId)
        ? prev.roomIds.filter(id => id !== roomId)
        : [...prev.roomIds, roomId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rates`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSave(formData)
        handleClose()
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to create rate.")
      }
    } catch (err) {
      console.error("Rate creation failed:", err)
      setError("Failed to create rate. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ roomType: '', cancellationPolicy: '', rooms: '', price: '', roomIds: [] })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Add Rate</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Room type</label>
              <select name="roomType" value={formData.roomType} onChange={handleInputChange} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isLoading}>
                <option value="">Enter room type</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation policy</label>
              <select name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleInputChange} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isLoading}>
                <option value="">Enter cancellation policy</option>
                <option value="strict">Strict</option>
                <option value="flexible">Flexible</option>
                <option value="non-refundable">Non refundable</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Applicable rooms</label>
              <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {availableRooms.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No available rooms right now</div>
                )}
                {availableRooms.map((room) => {
                  const selected = formData.roomIds.includes(room._id)
                  return (
                    <label key={room._id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleRoomToggle(room._id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-800">Room {room.roomNumber} • {room.type}</span>
                      </div>
                      {selected && <span className="text-xs text-blue-600">Selected</span>}
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">Rate will auto-apply to these rooms; otherwise room type defaults are used.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rooms</label>
              <input type="number" name="rooms" value={formData.rooms} onChange={handleInputChange} placeholder="Enter total number of rooms" className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required min="1" disabled={isLoading}/>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Enter room price" className="text-black w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0" step="0.01" disabled={isLoading}/>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50" disabled={isLoading}>Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}