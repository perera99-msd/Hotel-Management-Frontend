"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, FileText, Loader2, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import BillCard, { Bill } from "../../../components/billing/BillCard";
import AdminReceptionistLayout from "../../../components/layout/AdminReceptionistLayout";
import BillFilters from "../../../components/billing/BillFilters";
import QuickActions from "../../../components/billing/QuickActions";
import BillCreation from "../../../components/billing/BillCreation";
import { format } from "date-fns";

export default function Billing() {
  const { user } = useAuth();
  
  // Data State
  const [bills, setBills] = useState<Bill[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  
  // UI State
  const [showBillForm, setShowBillForm] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [billToView, setBillToView] = useState<Bill | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // --- 1. FETCH DATA FROM BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const token = await user.getIdToken();
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // A. Fetch Users
        const userRes = await fetch(`${API_URL}/api/users`, { headers });
        const userData = await userRes.json();
        if (Array.isArray(userData)) {
            setGuests(userData.map((u: any) => ({
                id: u._id,
                name: u.name || u.email,
                email: u.email
            })));
        }

        // B. Fetch Bookings
        const bookRes = await fetch(`${API_URL}/api/bookings`, { headers });
        const bookData = await bookRes.json();
        if (Array.isArray(bookData)) {
            setBookings(bookData.map((b: any) => ({
                id: b._id,
                guestId: b.guestId?._id || b.guestId, 
                roomNumber: b.roomId?.roomNumber || "N/A"
            })));
        }

        // C. Fetch Invoices
        const invRes = await fetch(`${API_URL}/api/invoices`, { headers });
        const invData = await invRes.json();
        if (Array.isArray(invData)) {
            const mappedBills: Bill[] = invData.map((inv: any) => ({
              id: inv._id,
              bookingId: inv.bookingId?._id || "N/A",
              guestId: inv.bookingId?.guestId?._id || inv.guestId || "Unknown",
              guestName: inv.bookingId?.guestId?.name || "Unknown Guest", 
              items: inv.lineItems.map((item: any) => ({
                description: item.description,
                quantity: item.qty || 1,
                rate: (item.amount / (item.qty || 1)), 
                amount: item.amount,
                category: item.category || 'other'
              })),
              subtotal: inv.subtotal,
              tax: inv.tax,
              total: inv.total,
              status: inv.status,
              createdAt: new Date(inv.createdAt),
              paidAt: inv.paidAt ? new Date(inv.paidAt) : undefined
            }));
            setBills(mappedBills);
        }

      } catch (error) {
        console.error("Failed to fetch billing data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, API_URL]);

  // --- 2. FILTER LOGIC ---
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const guest = guests.find((g) => g.id === bill.guestId);
      const guestName = (guest?.name || (bill as any).guestName || "").toLowerCase();
      
      const matchesSearch =
        guestName.includes(searchTerm.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus =
        statusFilter === "all" || bill.status === statusFilter;

      let matchesDate = true;
      const billDate = new Date(bill.createdAt);
      const now = new Date();
      
      if (dateFilter === "today") {
        matchesDate = billDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = billDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDate = billDate >= monthAgo;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bills, guests, searchTerm, statusFilter, dateFilter]);

  // Stats Calculation
  const stats = {
    total: bills.length,
    pending: bills.filter((b) => b.status === "pending").length,
    paid: bills.filter((b) => b.status === "paid").length,
    totalRevenue: bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.total, 0),
    pendingAmount: bills.filter((b) => b.status === "pending").reduce((sum, b) => sum + b.total, 0),
    totalTax: bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + (b.tax || 0), 0),
    cancelled: bills.filter((b) => b.status === "cancelled").length,
  };

  const getGuestForBill = (guestId: string) => {
     return guests.find((g) => g.id === guestId) || { id: guestId, name: 'Unknown', email: '', phone: '', bookingHistory: [] };
  }

  // --- 3. HANDLERS ---

  // A. Create Bill
  const handleCreateBillSubmit = async (newBillData: Bill) => {
    try {
        const token = await user?.getIdToken();
        const res = await fetch(`${API_URL}/api/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bookingId: newBillData.bookingId,
                items: newBillData.items.map(i => ({
                    description: i.description,
                    qty: i.quantity,
                    amount: i.amount,
                    category: i.category
                })),
                status: newBillData.status
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create bill");
        }
        
        window.location.reload(); 
    } catch (err: any) {
        alert("Error creating bill: " + err.message);
    }
  };

  // B. Mark Paid
  const handleMarkPaid = async (billToUpdate: Bill) => {
    try {
        const token = await user?.getIdToken();
        
        // Extract custom items and discounts from the bill to preserve them
        const customItems = billToUpdate.items
          .filter((item: any) => item.source === 'custom')
          .map((item) => ({
            description: item.description,
            quantity: item.quantity,
            qty: item.quantity,
            rate: item.rate,
            amount: item.amount,
            category: item.category,
            source: 'custom'
          }));
        
        // Extract discount if exists
        const discountItem = billToUpdate.items.find((item: any) => item.source === 'discount');
        const discount = discountItem ? {
          amount: Math.abs(discountItem.amount),
          description: discountItem.description.replace('Discount: ', '').replace('Discount', '')
        } : null;
        
        const res = await fetch(`${API_URL}/api/invoices/${billToUpdate.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              status: 'paid',
              customItems,
              discountItem: discount
            })
        });

        if (res.ok) {
            const updatedInvoice = await res.json();
            setBills((prev) =>
              prev.map((b) =>
                b.id === billToUpdate.id
                  ? {
                      ...b,
                      status: "paid",
                      paidAt: new Date(),
                      items: updatedInvoice.lineItems.map((item: any) => ({
                        description: item.description,
                        quantity: item.qty || 1,
                        rate: item.amount / (item.qty || 1),
                        amount: item.amount,
                        category: item.category || 'other',
                        source: item.source
                      })),
                      subtotal: updatedInvoice.subtotal,
                      tax: updatedInvoice.tax,
                      total: updatedInvoice.total
                    }
                  : b
              )
            );
        }
    } catch (err) {
        console.error("Failed to mark as paid", err);
    }
  };

  // C. Export Bills (CSV)
  const handleExportBills = () => {
    try {
      const headers = ["Bill ID", "Guest Name", "Guest ID", "Date", "Status", "Subtotal", "Tax", "Total"];
      const rows = filteredBills.map(b => {
        const gName = (b as any).guestName || getGuestForBill(b.guestId).name || "Unknown";
        return [
          b.id,
          gName,
          b.guestId,
          format(new Date(b.createdAt), "yyyy-MM-dd"),
          b.status,
          b.subtotal.toFixed(2),
          b.tax.toFixed(2),
          b.total.toFixed(2)
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `bills_export_${format(new Date(), "yyyyMMdd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  // D. Generate Report (Print)
  const handleGenerateReport = () => {
    window.print();
  };

  // E. Download Single Bill (PDF/Print)
  const handleDownloadBill = (bill: Bill) => {
    const guest = getGuestForBill(bill.guestId);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill Receipt #${bill.id}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 40px; }
              .details { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { text-align: right; font-weight: bold; font-size: 1.2em; }
              .status { text-transform: uppercase; font-weight: bold; color: ${bill.status === 'paid' ? 'green' : 'orange'}; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Hotel Bill Receipt</h1>
              <p>ID: ${bill.id}</p>
              <p>Date: ${format(new Date(bill.createdAt), "PPP")}</p>
              <p class="status">${bill.status}</p>
            </div>
            <div class="details">
              <strong>Guest:</strong> ${guest.name || (bill as any).guestName}<br>
              <strong>Email:</strong> ${guest.email}
            </div>
            <table>
              <thead>
                <tr><th>Description</th><th>Qty</th><th>Amount</th></tr>
              </thead>
              <tbody>
                ${bill.items.map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td>$${i.amount.toFixed(2)}</td></tr>`).join('')}
              </tbody>
            </table>
            <div class="total">
              <p>Subtotal: $${bill.subtotal.toFixed(2)}</p>
              <p>Tax: $${bill.tax.toFixed(2)}</p>
              <p>Total: $${bill.total.toFixed(2)}</p>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (isLoading) {
      return (
          <AdminReceptionistLayout role="receptionist">
              <div className="flex h-screen items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
          </AdminReceptionistLayout>
      );
  }

  return (
    <AdminReceptionistLayout role="receptionist">
      <div className="space-y-8 animate-fade-in print:p-0">
        
        {/* Header (Hidden when printing report) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
            <p className="text-gray-600 mt-1">Manage guest bills and payments</p>
          </div>
          <button
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition group"
            onClick={() => { setBillToView(null); setShowBillForm(true); }}
          >
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            Create Bill
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 print:grid-cols-5 print:gap-4">
          <div className="border rounded-lg p-4 text-center shadow-sm bg-white border-gray-100">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600 font-medium">Total Bills</div>
          </div>
          <div className="border rounded-lg p-4 text-center shadow-sm bg-yellow-50 border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
            <div className="text-sm text-yellow-700 font-medium">Pending</div>
          </div>
          <div className="border rounded-lg p-4 text-center shadow-sm bg-green-50 border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.paid}</div>
            <div className="text-sm text-green-700 font-medium">Paid</div>
          </div>
          <div className="border rounded-lg p-4 text-center shadow-sm bg-green-50 border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-green-700 font-medium">Revenue</div>
          </div>
           <div className="border rounded-lg p-4 text-center shadow-sm bg-yellow-50 border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600 mb-1">${stats.pendingAmount.toLocaleString()}</div>
            <div className="text-sm text-yellow-700 font-medium">Pending Amt</div>
          </div>
        </div>

        {/* Filters (Hidden in print report) */}
        <div className="print:hidden">
            <BillFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            statusOptions={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "paid", label: "Paid" },
                { value: "cancelled", label: "Cancelled" },
            ]}
            dateOptions={[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "week", label: "This week" },
                { value: "month", label: "This month" },
            ]}
            onClearFilters={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
            }}
            />
        </div>

        {/* Create/View Modal */}
        {showBillForm && (
          <BillCreation
            onClose={() => setShowBillForm(false)}
            guests={guests}
            bookings={bookings}
            initialGuestId=""
            initialBookingId=""
            initialStatus="pending"
            mode={billToView ? "view" : "create"}
            billToView={billToView || undefined}
            onCreateBill={handleCreateBillSubmit}
          />
        )}

        {/* Payment Summary Modal */}
        {showPaymentSummary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in relative">
                    <button 
                        onClick={() => setShowPaymentSummary(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Total Revenue Collected</span>
                                <span className="text-xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Tax Collected</span>
                                <span className="text-lg font-semibold text-gray-800">${stats.totalTax.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg">
                             <div className="flex justify-between items-center">
                                <span className="text-gray-600">Outstanding (Pending)</span>
                                <span className="text-xl font-bold text-yellow-600">${stats.pendingAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center mt-4">
                            <div className="p-2 bg-blue-50 rounded">
                                <div className="text-xl font-bold text-blue-600">{stats.total}</div>
                                <div className="text-xs text-gray-500">Total Bills</div>
                            </div>
                            <div className="p-2 bg-green-50 rounded">
                                <div className="text-xl font-bold text-green-600">{stats.paid}</div>
                                <div className="text-xs text-gray-500">Paid</div>
                            </div>
                            <div className="p-2 bg-red-50 rounded">
                                <div className="text-xl font-bold text-red-600">{stats.cancelled}</div>
                                <div className="text-xs text-gray-500">Cancelled</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setShowPaymentSummary(false)}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Bills Grid */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Bills</h3>
          <p className="text-sm text-gray-600">Showing {filteredBills.length} of {bills.length} bills</p>
        </div>

        {filteredBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                guest={getGuestForBill(bill.guestId)}
                onView={(b) => { setBillToView(b); setShowBillForm(true); }}
                onDownload={() => handleDownloadBill(bill)} 
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
          </div>
        )}
        
        {/* Quick Actions (Hidden in print) */}
        <div className="print:hidden">
            <QuickActions 
                onCreateBillClick={() => { setBillToView(null); setShowBillForm(true); }}
                onGenerateReport={handleGenerateReport}
                onExportBills={handleExportBills}
                onPaymentSummary={() => setShowPaymentSummary(true)}
            />
        </div>
      </div>
    </AdminReceptionistLayout>
  );
}