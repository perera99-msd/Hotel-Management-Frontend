"use client";

import { useState, useEffect } from "react";
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

interface NewMenuItemPopupProps {
  isOpen: boolean;
  onClose: () => void;
  editingMenuItem?: MenuItem | null;
  onUpdateMenuItem?: (item: MenuItem) => void;
  onCreateMenuItem?: (item: any) => void;
}

export default function NewMenuItemPopup({ 
  isOpen, 
  onClose, 
  editingMenuItem = null,
  onUpdateMenuItem,
  onCreateMenuItem 
}: NewMenuItemPopupProps) {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    ingredients: "",
    description: "",
    price: "",
    discount: "",
    available: true,
  });

  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (editingMenuItem) {
      setFormData({
        itemName: editingMenuItem.name,
        category: editingMenuItem.category,
        ingredients: editingMenuItem.ingredients.join(', '),
        description: editingMenuItem.description,
        price: editingMenuItem.price.toString(),
        discount: editingMenuItem.discount?.toString() || "",
        available: editingMenuItem.available,
      });
      setImagePreview(editingMenuItem.image);
    } else {
      // Reset form when opening new item
      setFormData({
        itemName: "",
        category: "",
        ingredients: "",
        description: "",
        price: "",
        discount: "",
        available: true,
      });
      setImagePreview(undefined);
    }
  }, [editingMenuItem, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateItem = async () => {
    setIsSubmitting(true);
    try {
      const menuItemData = {
        name: formData.itemName,
        category: formData.category,
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
        description: formData.description,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount) || 0,
        available: formData.available,
        image: imagePreview,
      };

      const response = await fetch(`${API_URL}/api/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(menuItemData),
      });

      if (!response.ok) throw new Error(response.statusText);

      const result = await response.json();
      if (onCreateMenuItem) onCreateMenuItem(result);
      
    } catch (error) {
      console.error("Creation failed:", error);
      alert("Failed to create item. If uploading an image, ensure it is under 10MB.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingMenuItem) return;
    setIsSubmitting(true);
    try {
      const updatedData = {
        name: formData.itemName,
        category: formData.category,
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
        description: formData.description,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount) || 0,
        available: formData.available,
        image: imagePreview,
      };

      const response = await fetch(`${API_URL}/api/menu/${editingMenuItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error(response.statusText);

      const result = await response.json();
      const formattedResult = { ...result, id: result._id };
      if (onUpdateMenuItem) onUpdateMenuItem(formattedResult);
      
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.itemName || !formData.category || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }
    if (editingMenuItem) handleUpdateItem();
    else handleCreateItem();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto text-black p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{editingMenuItem ? 'Edit Menu Item' : 'New Menu Item'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-xl">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Name *</label>
              <input type="text" name="itemName" value={formData.itemName} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-white">
                <option value="">Select category</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border rounded px-3 py-2" step="0.01" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Ingredients</label>
                <input type="text" name="ingredients" value={formData.ingredients} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Comma separated" />
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
                <input type="checkbox" name="available" checked={formData.available} onChange={handleChange} className="rounded" />
                <label className="text-sm">Available for order</label>
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
            </div>
          </div>

          {/* Live Preview */}
          <div className="border border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex items-center justify-center">
             <div className="bg-white shadow rounded-lg p-4 w-full max-w-sm">
                {imagePreview ? (
                    <img src={imagePreview} className="w-full h-48 object-cover rounded mb-4" alt="Preview" />
                ) : (
                    <div className="w-full h-48 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400">No Image</div>
                )}
                <h3 className="font-bold text-lg">{formData.itemName || "Item Name"}</h3>
                <p className="text-gray-500 text-sm capitalize">{formData.category || "Category"}</p>
                <div className="font-bold text-xl mt-2">${formData.price || "0.00"}</div>
                <p className="text-gray-600 text-sm mt-2">{formData.description || "Description..."}</p>
             </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button onClick={() => handleSubmit()} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Save Item"}
            </button>
        </div>
      </div>
    </div>
  );
}