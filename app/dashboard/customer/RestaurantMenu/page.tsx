// app/dashboard/customer/RestaurantMenu/page.tsx
"use client";

import { useState, useEffect, useContext } from "react";
import CustomerLayout from "../../../components/layout/CustomerLayout";
import OrderSelectionModal, { SelectedMenuItem, MenuItem } from "./OrderSelectionModal";
import OrderConfirmationModal from "./OrderConfirmationModal";
import CustomOrderModal from "./CustomOrderModal"; 
import { AuthContext } from "@/app/context/AuthContext";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function RestaurantMenuPage() {
  const { token } = useContext(AuthContext);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false); 
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<SelectedMenuItem[]>([]);

  // Fetch menu items from backend
  const fetchMenuItems = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }

      const data = await response.json();
      setMenuItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
      console.error("Error fetching menu items:", err);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [token]);

  // Get unique categories for filter
  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  // Filter menu items by selected category
  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleProceedToOrder = (selectedItems: SelectedMenuItem[]) => {
    setSelectedOrderItems(selectedItems);
    setIsOrderModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  const handleBackToSelection = () => {
    setIsConfirmationModalOpen(false);
    setIsOrderModalOpen(true);
  };

  // Handle individual item order
  const handleIndividualOrder = (menuItem: MenuItem) => {
    const selectedItem: SelectedMenuItem = {
      menuItem: menuItem,
      quantity: 1
    };
    setSelectedOrderItems([selectedItem]);
    setIsConfirmationModalOpen(true);
  };

  // Handle custom order submission
  const handleCustomOrder = (customOrderDetails: {
    description: string;
    specialInstructions: string;
    estimatedPrice?: number;
    dietaryRestrictions: string[];
    mealType?: string;
  }) => {
    // Create a custom menu item for the order
    // Note: ID starts with 'custom-' which backend handles specifically now
    const customMenuItem: MenuItem = {
      _id: `custom-${Date.now()}`,
      name: customOrderDetails.mealType ? `Custom ${customOrderDetails.mealType}` : "Custom Order",
      category: "Custom",
      description: customOrderDetails.description,
      ingredients: ["Custom Ingredients"],
      price: customOrderDetails.estimatedPrice || 0,
      available: true
    };

    const selectedItem: SelectedMenuItem = {
      menuItem: customMenuItem,
      quantity: 1,
      specialInstructions: customOrderDetails.specialInstructions,
      dietaryRestrictions: customOrderDetails.dietaryRestrictions
    };

    setSelectedOrderItems([selectedItem]);
    setIsCustomOrderModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="p-4 sm:p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading menu...</div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="p-4 sm:p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">Error: {error}</div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Restaurant Menu</h1>
            <p className="text-base text-gray-600">Explore our delicious dining options</p>
          </div>
          <div className="flex gap-3">
            {/* Custom Order Button */}
            <button 
              onClick={() => setIsCustomOrderModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Custom Order
            </button>
            {/* Regular Order Button */}
            <button 
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + Order
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No menu items found.</p>
            <p className="text-gray-400 text-sm">Please check back later or try a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Image */}
                {item.image && (
                  <div className="mb-3">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {/* Title + Price */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className="text-sm text-gray-600 capitalize">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${item.price}
                    </div>
                    {item.discount && item.discount > 0 && (
                      <div className="text-sm text-green-600 line-through">
                        ${(item.price + item.discount).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-sm mb-3">{item.description}</p>

                {/* Ingredients */}
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

                {/* Status + Order Button */}
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                  
                  {/* Order Button */}
                  <button
                    onClick={() => handleIndividualOrder(item)}
                    disabled={!item.available}
                    className={`py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                      item.available
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-100 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Selection Modal */}
        <OrderSelectionModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          menuItems={menuItems}
          onProceedToOrder={handleProceedToOrder}
        />

        {/* Custom Order Modal */}
        <CustomOrderModal
          isOpen={isCustomOrderModalOpen}
          onClose={() => setIsCustomOrderModalOpen(false)}
          onSubmit={handleCustomOrder}
        />

        {/* Order Confirmation Modal */}
        <OrderConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          selectedItems={selectedOrderItems}
          onBack={handleBackToSelection}
        />
      </div>
    </CustomerLayout>
  );
}