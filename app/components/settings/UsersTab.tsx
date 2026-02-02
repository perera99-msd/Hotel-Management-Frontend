"use client";
import { Edit, Loader2, Trash2, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AddUserForm from "../../components/settings/AddUserForm";
import { useAuth } from "../../context/AuthContext";

export default function UsersTab() {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.map((u: any) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          idNumber: u.idNumber || '',
          role: u.roles?.[0] || 'customer',
          status: u.status || 'active'
        })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleAddUser = async (newUser: any) => {
    // 1. Prompt for password
    const password = prompt(`Set a password for ${newUser.name}:`, "");

    if (password === null) return; // Cancelled
    if (!password.trim()) {
      toast.error("Password is required to create a new user.");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newUser, password }) // Send password to backend
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create user");
      }

      toast.success("User created successfully!");
      fetchUsers();
      setShowForm(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add user");
    }
  };

  const handleUpdateUser = async (updatedUser: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedUser)
      });
      if (!res.ok) throw new Error();
      toast.success("User updated!");
      fetchUsers();
      setShowForm(false);
      setEditUser(null);
    } catch (err) { toast.error("Failed to update user"); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure? This will delete the user account from both Firebase and MongoDB. This action cannot be undone.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete user");
      }
      toast.success("User deleted successfully from Firebase and MongoDB.");
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
        <button onClick={() => { setEditUser(null); setShowForm(!showForm); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <UserIcon className="h-4 w-4 mr-2" /> Add User
        </button>
      </div>
      {showForm && (
        <AddUserForm key={editUser ? editUser.id : "new"} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onCancel={() => { setEditUser(null); setShowForm(false); }} existingUser={editUser} />
      )}
      <div className="card bg-white rounded-lg shadow-lg p-6 mb-6">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>{["User", "NIC/ID", "Role", "Status", "Actions"].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div>{user.name}</div><div className="text-sm text-gray-500">{user.email}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.idNumber || 'N/A'}</td>
                  <td className="px-6 py-4 capitalize">{user.role}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${user.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{user.status}</span></td>
                  <td className="px-6 py-4 flex space-x-3">
                    <button onClick={() => { setEditUser(user); setShowForm(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}