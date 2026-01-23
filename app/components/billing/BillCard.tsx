import React from "react";
import {
  FileText,
  Download,
  Eye,
  CreditCard,
  User,
  Calendar,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface BillCardProps {
  bill: Bill;
  guest?: Guest;
  onView?: (bill: Bill) => void;
  onDownload?: (bill: Bill) => void;
  onMarkPaid?: (bill: Bill) => void;
  onEdit?: (bill: Bill) => void;
  onCancel?: (bill: Bill) => void;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  preferences?: string[];
  bookingHistory: string[];
}

export interface BillItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  category: "room" | "meal" | "service" | "other" | "discount";
  source?: string;
}

export interface Bill {
  id: string;
  bookingId: string;
  guestId: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: Date;
  paidAt?: Date;
}

export default function BillCard({
  bill,
  guest,
  onView,
  onDownload,
  onMarkPaid,
  onEdit,
  onCancel,
}: BillCardProps): React.ReactElement {
  const getStatusColor = (status: Bill["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: Bill["status"]) => {
    switch (status) {
      case "pending":
        return "Pending Payment";
      case "paid":
        return "Paid";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "room":
        return "🏨";
      case "meal":
        return "🍽️";
      case "service":
        return "🛎️";
      case "other":
        return "📋";
      default:
        return "📋";
    }
  };

  return (
    <div className="card flex flex-col justify-between h-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="space-y-4 flex-grow">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bill #{bill.id}
              </h3>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  {guest ? guest.name : `Guest ${bill.guestId}`}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(bill.createdAt), "MMM dd, yyyy")}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                bill.status
              )}`}
            >
              {getStatusText(bill.status)}
            </span>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ${bill.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bill Items Summary */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
          <div className="space-y-1">
            {bill.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center space-x-2">
                  <span>{getCategoryIcon(item.category)}</span>
                  <span className="text-gray-900">{item.description}</span>
                  <span className="text-gray-500">×{item.quantity}</span>
                </div>
                <span className="font-medium text-gray-900">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {bill.items.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{bill.items.length - 3} more items
              </div>
            )}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">${bill.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">${bill.tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold border-t border-gray-200 pt-1">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">${bill.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-3 border-t border-gray-200 flex space-x-2">
        {onView && (
          <button
            onClick={() => onView(bill)}
            className="flex-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-md transition-colors flex items-center justify-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </button>
        )}
        {bill.status === "pending" && onEdit && (
          <button
            onClick={() => onEdit(bill)}
            className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center"
          >
            Edit
          </button>
        )}
        {onDownload && (
          <button
            onClick={() => onDownload(bill)}
            className="flex-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-md transition-colors flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </button>
        )}
        {bill.status === "pending" && onMarkPaid && (
          <button
            onClick={() => onMarkPaid(bill)}
            className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center"
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Mark Paid
          </button>
        )}
        {bill.status === "pending" && onCancel && (
          <button
            onClick={() => onCancel(bill)}
            className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
