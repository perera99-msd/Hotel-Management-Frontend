"use client";
import { Save, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface AddUserFormProps {
  onAddUser: (user: {
    name: string;
    email: string;
    phone?: string;
    idNumber?: string;
    role: string;
    status: string;
  }) => void;
  onUpdateUser: (user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    idNumber?: string;
    role: string;
    status: string;
  }) => void;
  onCancel: () => void;
  existingUser?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    idNumber?: string;
    role: string;
    status: string;
  } | null;
}

export default function AddUserForm({
  onAddUser,
  onUpdateUser,
  onCancel,
  existingUser,
}: AddUserFormProps) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    role: "",
    status: "active",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    if (existingUser) {
      setFormData(existingUser);
    }
  }, [existingUser]);

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }
    if (!formData.role) newErrors.role = "Please select a role.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (existingUser) {
      onUpdateUser(formData);
    } else {
      onAddUser(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: "" }); // clear error when user fixes input
    }
  };

  return (
    <div className="card bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {existingUser ? "Edit User" : "Add New User"}
        </h3>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4"
      >
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none ${errors.name
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none ${errors.email
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* NIC/Passport */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NIC / Passport Number {!existingUser && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => handleChange("idNumber", e.target.value)}
            placeholder="National ID or Passport number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleChange("role", e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none ${errors.role
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="receptionist">Receptionist</option>
            <option value="customer">Customer</option>
          </select>
          {errors.role && (
            <p className="text-sm text-red-600 mt-1">{errors.role}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <button
            type="submit"
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition group"
          >
            <Save className="h-4 w-4 mr-2" />
            {existingUser ? "Update User" : "Add User"}
          </button>
        </div>
      </form>
    </div>
  );
}
