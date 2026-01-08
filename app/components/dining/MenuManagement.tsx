"use client";

import { useState, useEffect } from "react";
import NewMenuItemPopup from "./NewMenuItemPopup";
import { useAuth } from "../../context/AuthContext";

interface MenuItem {
    id: string;
    name: string;
    category: string;
    description: string;
    ingredients: string[];
    price: number;
    discount?: number;
    available: boolean;
    image?: string;
}

interface MenuManagementProps {
  onAddNewItem?: () => void;
}

export default function MenuManagement({ onAddNewItem }: MenuManagementProps) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("All category");
    const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
    const { token } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/menu`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            
            if (!response.ok) throw new Error("Failed to fetch menu items");
            
            const data = await response.json();
            const formattedData = data.map((item: any) => ({
                ...item,
                id: item._id || item.id
            }));

            setMenuItems(formattedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load menu items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(token) fetchMenuItems();
    }, [token]);

    const handleCreateMenuItem = (newItem: any) => {
        // Optimistic update: Add item directly to state
        const formattedItem = { ...newItem, id: newItem._id || newItem.id };
        setMenuItems(prev => [formattedItem, ...prev]);
        
        // Reset filters to ensure visibility
        setSelectedCategory("All category");
        setAvailabilityFilter("All");
        
        // Close popup immediately
        setIsPopupOpen(false);
    };

    const handleUpdateMenuItem = (updatedItem: MenuItem) => {
        setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setEditingMenuItem(null);
        setIsPopupOpen(false);
    };

    const handleEdit = (item: MenuItem) => {
        setEditingMenuItem(item);
        setIsPopupOpen(true);
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm("Are you sure you want to delete this menu item?")) return;
        try {
            const response = await fetch(`${API_URL}/api/menu/${itemId}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setMenuItems(prev => prev.filter(item => item.id !== itemId));
            } else {
                throw new Error("Failed to delete");
            }
        } catch (err) {
            alert("Failed to delete menu item.");
        }
    };

    // Filter Logic
    const categories = ["All category", ...new Set(menuItems.map(item =>
        item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Other"
    ))];

    const filteredItems = menuItems.filter(item => {
        const categoryMatch = selectedCategory === "All category" ||
            (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
        const availabilityMatch = availabilityFilter === "All" ||
            (availabilityFilter === "Available" && item.available) ||
            (availabilityFilter === "Unavailable" && !item.available);
        return categoryMatch && availabilityMatch;
    });

    if (loading) return <div className="p-6 text-center">Loading menu items...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
                    <p className="text-gray-600">Manage your restaurant menu items</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow text-center text-black">
                    <div className="text-2xl font-bold">{menuItems.length}</div>
                    <div className="text-gray-600">Total Items</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center text-black">
                    <div className="text-2xl font-bold">{menuItems.filter(i => i.available).length}</div>
                    <div className="text-gray-600">Available</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center text-black">
                    <div className="text-2xl font-bold">{menuItems.filter(i => !i.available).length}</div>
                    <div className="text-gray-600">Unavailable</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center text-black">
                    <div className="text-2xl font-bold">{new Set(menuItems.map(i => i.category)).size}</div>
                    <div className="text-gray-600">Categories</div>
                </div>
            </div>

            {/* Filters & Add Button */}
            <div className="bg-white p-4 rounded-lg shadow text-black">
                <div className="flex justify-between items-end">
                    <div className="flex space-x-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="border rounded px-3 py-2 text-black"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Availability</label>
                            <select
                                value={availabilityFilter}
                                onChange={(e) => setAvailabilityFilter(e.target.value)}
                                className="border rounded px-3 py-2 text-black"
                            >
                                <option value="All">All Items</option>
                                <option value="Available">Available</option>
                                <option value="Unavailable">Unavailable</option>
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setEditingMenuItem(null); setIsPopupOpen(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors h-10"
                    >
                        + Add New Item
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white p-6 rounded-lg shadow text-black">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative">
                            {item.image && (
                                <div className="mb-3">
                                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-lg" />
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-lg">{item.name}</h4>
                                <div className="text-right">
                                    <div className="font-bold">${item.price}</div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-3 capitalize">{item.category}</p>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                            
                            <div className="flex justify-between items-center mt-auto">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.available ? "Available" : "Unavailable"}
                                </span>
                                <div className="space-x-2">
                                    <button onClick={() => handleEdit(item)} className="text-blue-600 text-sm hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredItems.length === 0 && <div className="text-center py-8 text-gray-500">No items found.</div>}
            </div>

            <NewMenuItemPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                editingMenuItem={editingMenuItem}
                onUpdateMenuItem={handleUpdateMenuItem}
                onCreateMenuItem={handleCreateMenuItem}
            />
        </div>
    );
}