import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { Trash2, Shield, ShieldOff, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminUsers() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [user, token, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/api/admin/users/${userId}/admin`,
        { isAdmin: !currentAdmin },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h2 className="text-3xl font-bold text-gray-100 mb-6">Users Management</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-750 transition-colors border-b border-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{u.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-gray-400">User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() =>
                          setExpandedUser(expandedUser === u.id ? null : u.id)
                        }
                        className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300 text-xs"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              No users found
            </div>
          )}
        </div>

        {/* Expanded User Actions */}
        {expandedUser && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            {users.map(
              (u) =>
                u.id === expandedUser && (
                  <div key={u.id} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-100">{u.email}</h3>
                      <button
                        onClick={() => setExpandedUser(null)}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                        className="w-full flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-left"
                      >
                        {u.isAdmin ? (
                          <>
                            <ShieldOff className="w-4 h-4" />
                            <span>Revoke Admin Access</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Grant Admin Access</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteUser(u.id);
                          setExpandedUser(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 rounded transition-colors text-left text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete User</span>
                      </button>
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
