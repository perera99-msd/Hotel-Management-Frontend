"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { Bill, BillItem } from "./BillCard";
import { useAuth } from "@/app/context/AuthContext";
import toast from "react-hot-toast";

interface BillCreationProps {
  onClose: () => void;
  guests: { id: string; name: string }[];
  bookings: { id: string; guestId: string }[];
  initialGuestId?: string;
  initialBookingId?: string;
  initialStatus?: "pending" | "paid" | "cancelled";
  onCreateBill?: (bill: Bill) => void;
  mode?: "create" | "view";
  billToView?: Bill;
}

export default function BillCreation({
  guests = [],
  bookings = [],
  onClose,
  onCreateBill,
  initialGuestId = "",
  initialBookingId = "",
  initialStatus = "pending",
  mode = "create",
  billToView,
}: BillCreationProps) {
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [guestId, setGuestId] = useState(initialGuestId);
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [status, setStatus] = useState(initialStatus);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountDescription, setDiscountDescription] = useState("");
  const [newItem, setNewItem] = useState<Partial<BillItem>>({
    description: "",
    quantity: 1,
    rate: 0,
    category: "room",
  });

  // Validation state
  const [itemErrors, setItemErrors] = useState({
    description: "",
    quantity: "",
    rate: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if ((isViewMode || isEditMode) && billToView) {
      setGuestId(billToView.guestId);
      setBookingId(billToView.bookingId);
      setStatus(billToView.status);
      setBillItems(billToView.items);
      
      // Load discount from bill items if it exists
      const discountItem = billToView.items.find((item: any) => item.source === 'discount');
      if (discountItem) {
        setDiscountAmount(Math.abs(discountItem.amount));
        // Extract description from discount line item description
        const desc = discountItem.description.replace('Discount: ', '').replace('Discount', '');
        setDiscountDescription(desc);
      } else {
        setDiscountAmount(0);
        setDiscountDescription("");
      }
    } else {
      resetForm();
    }
  }, [isViewMode, isEditMode, billToView, initialGuestId, initialBookingId, initialStatus]);

  // Auto-fetch line items when booking changes
  useEffect(() => {
    if (bookingId && !isViewMode && !isEditMode) {
      fetchAutoLineItems();
    }
  }, [bookingId]);

  const fetchAutoLineItems = async () => {
    if (!bookingId || !user) return;

    try {
      setLoadingItems(true);
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/invoices/booking/${bookingId}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const items = await res.json();
        // Convert backend items to UI format
        const formattedItems: BillItem[] = items.map((item: any) => ({
          description: item.description,
          quantity: item.qty || 1,
          rate: item.amount / (item.qty || 1),
          amount: item.amount,
          category: (item.category || 'room') as BillItem["category"],
        }));
        setBillItems(formattedItems);
        toast.success(`Loaded ${formattedItems.length} items from booking`);
      } else {
        toast.error('Failed to load items for booking');
      }
    } catch (error) {
      console.error('Failed to fetch auto items:', error);
      toast.error('Failed to load booking items');
    } finally {
      setLoadingItems(false);
    }
  };

  // Totals
  const subtotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.amount, 0),
    [billItems]
  );
  
  // Calculate pre-discount subtotal and tax
  const preDiscountSubtotal = useMemo(
    () => billItems
      .filter((item) => (item as any).source !== 'discount')
      .reduce((sum, item) => sum + item.amount, 0),
    [billItems]
  );
  const tax = preDiscountSubtotal * 0.1;
  const total = subtotal + tax;

  const handleItemChange = (field: keyof BillItem, value: any) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
    setItemErrors((prev) => ({ ...prev, [field]: "" })); // Clear error on input
  };

  const validateNewItem = (): boolean => {
    let valid = true;
    const errors = { description: "", quantity: "", rate: "" };

    if (!newItem.description?.trim()) {
      errors.description = "Description is required";
      valid = false;
    }
    if (!newItem.quantity || newItem.quantity < 1) {
      errors.quantity = "Quantity must be at least 1";
      valid = false;
    }
    if (newItem.rate === undefined || newItem.rate < 0) {
      errors.rate = "Rate must be 0 or greater";
      valid = false;
    }

    setItemErrors(errors);
    return valid;
  };

  const handleAddItem = () => {
    if (!validateNewItem()) return;

    const item: BillItem = {
      description: newItem.description!,
      quantity: newItem.quantity!,
      rate: newItem.rate!,
      amount: newItem.quantity! * newItem.rate!,
      category: newItem.category || "other",
      source: "custom"
    };

    setBillItems((prev) => [...prev, item]);
    setNewItem({ description: "", quantity: 1, rate: 0, category: "room" });
  };

  const handleRemoveItem = (index: number) => {
    const item = billItems[index];
    const itemAny = item as any;
    
    // Allow removal of custom items and discount items
    if (itemAny.source === 'custom' || itemAny.source === 'discount') {
      setBillItems((prev) => prev.filter((_, i) => i !== index));
      
      // If removing discount item, reset discount fields
      if (itemAny.source === 'discount') {
        setDiscountAmount(0);
        setDiscountDescription("");
        toast.success('Discount removed');
      } else {
        toast.success('Item removed');
      }
      return;
    }
    
    // Prevent removal of auto-calculated items
    if (itemAny.source === 'booking') {
      toast.error('Cannot remove room charge from bill');
      return;
    }
    
    if (itemAny.source === 'trip' && itemAny.tripStatus && ['Confirmed', 'Approved', 'Completed'].includes(itemAny.tripStatus)) {
      toast.error('Cannot remove confirmed or completed trip from bill');
      return;
    }
    
    if (itemAny.source === 'order' && itemAny.orderStatus && ['Ready', 'Served'].includes(itemAny.orderStatus)) {
      toast.error('Cannot remove ready or served order from bill');
      return;
    }
    
    // For other trips/orders that can be removed, still prevent
    if (itemAny.source === 'trip' || itemAny.source === 'order') {
      toast.error('Cannot remove auto-calculated items. Only manually added items can be removed.');
      return;
    }
    
    // Only custom items (manually added) can be removed
    if (itemAny.source !== 'custom') {
      toast.error('Only manually added items can be removed');
      return;
    }
    
    setBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateBill = async () => {
    if (!guestId || !bookingId || billItems.length === 0) {
      toast.error("Please fill all required fields and add at least one item.");
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      
      const endpoint = isEditMode 
        ? `${API_URL}/api/invoices/${billToView?.id}`
        : `${API_URL}/api/invoices`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      // Filter custom items only (exclude discount items from custom array)
      const customItems = billItems
        .filter((item) => (item as any).source === 'custom')
        .map((item) => ({
          description: item.description,
          quantity: item.quantity,
          qty: item.quantity,
          rate: item.rate,
          amount: item.amount,
          category: item.category,
          source: 'custom'
        }));

      // Prepare discount item if exists
      const discountItem = discountAmount > 0 ? {
        amount: discountAmount,
        description: discountDescription
      } : null;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          customItems,
          status,
          discountItem
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} bill`);
      }

      const result = await res.json();
      
      const newBill: Bill = {
        id: result._id,
        bookingId,
        guestId,
        items: result.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.qty || 1,
          rate: item.amount / (item.qty || 1),
          amount: item.amount,
          category: item.category || 'other',
          source: item.source
        })),
        subtotal: result.subtotal,
        tax: result.tax,
        total: result.total,
        status: result.status as Bill["status"],
        createdAt: new Date(result.createdAt),
        paidAt: result.paidAt ? new Date(result.paidAt) : undefined,
      };

      if (onCreateBill) onCreateBill(newBill);
      toast.success(`Bill ${isEditMode ? 'updated' : 'created'} successfully!`);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} bill:`, error);
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} bill`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setGuestId(initialGuestId);
    setBookingId(initialBookingId);
    setStatus(initialStatus);
    setBillItems([]);
    setDiscountAmount(0);
    setDiscountDescription("");
    setNewItem({ description: "", quantity: 1, rate: 0, category: "room" });
    setItemErrors({ description: "", quantity: "", rate: "" });
  };

  const filteredBookings = bookings.filter((b) => b.guestId === guestId);

  return (
    <div className="card bg-white rounded-lg shadow-lg p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold mb-4">
          {isViewMode ? "View Bill" : isEditMode ? "Edit Bill" : "Create New Bill"}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Guest, Booking & Status */}
      {!isViewMode && !isEditMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest
            </label>
            <select
              value={guestId}
              onChange={(e) => setGuestId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Guest</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking
            </label>
            <select
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              disabled={loadingItems}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Booking</option>
              {filteredBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id}
                </option>
              ))}
            </select>
            {loadingItems && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading booking items...
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Bill["status"])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Add Bill Item - Available in Create and Edit modes */}
      {(isEditMode || mode === 'create') && (
        <>
          {billItems.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>✓ Auto-calculated items loaded:</strong> Room cost, orders, and trip packages from this booking.
              </p>
              <p className="text-xs text-blue-700">{isEditMode ? 'Edit or remove items below.' : 'You can add additional items below or remove items above if needed.'}</p>
            </div>
          )}
          <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4">
            <h4 className="text-md font-semibold mb-2">Add Manual Charge</h4>
            <div className="grid grid-cols-5 gap-3 items-end">
            <div>
              <input
                type="text"
                placeholder="Description"
                value={newItem.description}
                onChange={(e) =>
                  handleItemChange("description", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {itemErrors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {itemErrors.description}
                </p>
              )}
            </div>

            <div>
              <input
                type="number"
                placeholder="Quantity"
                value={newItem.quantity ?? 0}
                onChange={(e) =>
                  handleItemChange("quantity", parseInt(e.target.value) || 0)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {itemErrors.quantity && (
                <p className="text-red-500 text-xs mt-1">
                  {itemErrors.quantity}
                </p>
              )}
            </div>

            <div>
              <input
                type="number"
                placeholder="Rate"
                value={newItem.rate ?? 0}
                onChange={(e) =>
                  handleItemChange("rate", parseFloat(e.target.value) || 0)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {itemErrors.rate && (
                <p className="text-red-500 text-xs mt-1">{itemErrors.rate}</p>
              )}
            </div>

            <select
              value={newItem.category}
              onChange={(e) =>
                handleItemChange(
                  "category",
                  e.target.value as BillItem["category"]
                )
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="room">Room</option>
              <option value="meal">Meal</option>
              <option value="service">Service</option>
              <option value="other">Other</option>
            </select>

            <button
              onClick={handleAddItem}
              className="flex items-center justify-center gap-1 bg-blue-500 text-white px-2 py-1 rounded"
            >
              <Plus size={16} /> Add
            </button>
          </div>
            </div>
        </>
      )}

      {/* Items Table */}
      {billItems.length > 0 && (
        <table className="w-full border-collapse mt-4">
          <thead>
            <tr className="bg-gray-200 text-left text-sm">
              <th className="p-2">Description</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Amount</th>
              {!isViewMode && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {billItems.map((item, index) => {
              const itemAny = item as any;
              const isCustom = itemAny.source === 'custom';
              const isDiscount = itemAny.source === 'discount';
              const isRemovable = isCustom || isDiscount;
              
              return (
                <tr key={index} className="border-b">
                  <td className="p-2">{item.description}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">{item.rate.toFixed(2)}</td>
                  <td className="p-2">{item.amount.toFixed(2)}</td>
                  {!isViewMode && (
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        disabled={!isRemovable}
                        className={`${isRemovable ? 'text-red-600 hover:text-red-800' : 'text-gray-400 cursor-not-allowed'}`}
                        title={isRemovable ? 'Remove item' : 'Only manually added and discount items can be removed'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Discount Input */}
      {!isViewMode && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-md font-semibold mb-3">Add Discount</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Amount
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={discountDescription}
                onChange={(e) => setDiscountDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="e.g., Early bird, Staff discount"
              />
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="text-right mb-6 mt-6">
        <p>
          Pre-Discount Subtotal:{" "}
          <span className="font-semibold">${preDiscountSubtotal.toFixed(2)}</span>
        </p>
        <p>
          Tax (10%): <span className="font-semibold">${tax.toFixed(2)}</span>
        </p>
        {discountAmount > 0 && (
          <p className="text-green-600">
            Discount{discountDescription ? ` (${discountDescription})` : ''}: <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
          </p>
        )}
        <p className="text-lg font-bold">
          Total:{" "}
          <span className="text-blue-600">
            ${total.toFixed(2)}
          </span>
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex justify-end gap-2">
        {isViewMode ? (
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        ) : (
          <>
            <button
              onClick={resetForm}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Reset
            </button>
            <button
              onClick={handleCreateBill}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Bill' : 'Create Bill'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
