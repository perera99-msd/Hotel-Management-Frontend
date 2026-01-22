// app/dashboard/customer/RestaurantMenu/OrderSelectionModal.tsx
"use client";

import { useState } from "react";

// Updated to match MongoDB _id structure
export interface MenuItem {
    _id: string; // Changed from id to _id
    name: string;
    category: string;
    description: string;
    ingredients: string[];
    price: number;
    discount?: number;
    available: boolean;
    image?: string;
}

interface OrderSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
    onProceedToOrder: (selectedItems: SelectedMenuItem[]) => void;
}

export interface SelectedMenuItem {
    menuItem: MenuItem;
    quantity: number;
    specialInstructions?: string;
    dietaryRestrictions?: string[];
}

export default function OrderSelectionModal({
    isOpen,
    onClose,
    menuItems,
    onProceedToOrder
}: OrderSelectionModalProps) {
    const [selectedItems, setSelectedItems] = useState<SelectedMenuItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    if (!isOpen) return null;

    // Get unique categories
    const categories = ["All", ...new Set(menuItems.map(item =>
        item.category.charAt(0).toUpperCase() + item.category.slice(1)
    ))];

    // Filter menu items by selected category
    const filteredItems = selectedCategory === "All"
        ? menuItems
        : menuItems.filter(item =>
            item.category.toLowerCase() === selectedCategory.toLowerCase()
        );

    const toggleItemSelection = (item: MenuItem) => {
        setSelectedItems(prev => {
            const existingItem = prev.find(selected => selected.menuItem._id === item._id);
            if (existingItem) {
                return prev.filter(selected => selected.menuItem._id !== item._id);
            } else {
                return [...prev, { menuItem: item, quantity: 1 }];
            }
        });
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        setSelectedItems(prev =>
            prev.map(selected =>
                selected.menuItem._id === itemId
                    ? { ...selected, quantity: newQuantity }
                    : selected
            )
        );
    };

    const handleProceed = () => {
        if (selectedItems.length === 0) {
            alert("Please select at least one item");
            return;
        }
        onProceedToOrder(selectedItems);
    };

    const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Restaurant Menu</h2>
                            <p className="text-gray-600 mt-1">Select your favorite dishes</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                Orders ({totalItems})
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Side - Menu Items */}
                    <div className="flex-1 p-6 border-r border-gray-200 overflow-y-auto">
                        {/* Category Filter */}
                        <div className="mb-6 sticky top-0 bg-white pt-2 pb-4 z-10">
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedCategory === category
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Items List */}
                        <div className="space-y-6">
                            {filteredItems.map((item) => {
                                const isSelected = selectedItems.some(selected => selected.menuItem._id === item._id);
                                const selectedItem = selectedItems.find(selected => selected.menuItem._id === item._id);

                                return (
                                    <div
                                        key={item._id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        onClick={() => toggleItemSelection(item)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                                <span className="text-sm text-gray-600 capitalize">{item.category}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">${item.price}</div>
                                            </div>
                                        </div>

                                        <p className="text-gray-700 text-sm mb-3">{item.description}</p>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {item.ingredients.map((ingredient, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                                                >
                                                    {ingredient}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span
                                                className={`text-xs font-medium px-2 py-1 rounded-full ${item.available
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {item.available ? "Available" : "Unavailable"}
                                            </span>

                                            {isSelected && (
                                                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, (selectedItem?.quantity || 1) - 1)}
                                                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-black font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-sm font-medium text-black">{selectedItem?.quantity || 1}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, (selectedItem?.quantity || 1) + 1)}
                                                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-black font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Side - Selected Items Summary */}
                    <div className="w-80 p-6 bg-gray-50 overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Items</h3>

                        {selectedItems.length === 0 ? (
                            <p className="text-gray-500 text-sm">No items selected</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedItems.map(({ menuItem, quantity }) => (
                                    <div key={menuItem._id} className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-gray-900">{menuItem.name}</h4>
                                            <span className="text-gray-900 font-medium">${menuItem.price * quantity}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-600">
                                            <span>Qty: {quantity}</span>
                                            <span>${menuItem.price} each</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedItems.length > 0 && (
                            <button
                                onClick={handleProceed}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6 sticky bottom-0"
                            >
                                Proceed to Order ({totalItems})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}