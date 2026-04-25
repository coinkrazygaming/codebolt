import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface AiKey {
  id: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminAiKeys() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [keys, setKeys] = useState<AiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'anthropic',
    key: '',
  });

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchKeys();
  }, [user, token, navigate]);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/ai-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setKeys(response.data.keys);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load AI keys');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/ai-keys`,
        {
          provider: formData.provider,
          key: formData.key,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchKeys();
      setShowForm(false);
      setFormData({
        provider: 'anthropic',
        key: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add AI key');
    }
  };

  const handleToggle = async (keyId: string, isActive: boolean) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/api/admin/ai-keys/${keyId}`,
        { isActive: !isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update AI key');
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this AI key?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/ai-keys/${keyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete AI key');
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-100">AI Keys Management</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Key
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-100 mb-4">Add AI Key</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="xai">XAI</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Keys List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {keys.map((key) => (
                  <tr
                    key={key.id}
                    className="hover:bg-gray-750 transition-colors border-b border-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {key.provider.charAt(0).toUpperCase() + key.provider.slice(1)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          key.isActive
                            ? 'bg-green-900 text-green-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {key.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggle(key.id, key.isActive)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded transition-colors text-xs ${
                          key.isActive
                            ? 'bg-green-900 hover:bg-green-800 text-green-300'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {key.isActive ? (
                          <>
                            <ToggleRight className="w-3 h-3" />
                            Disable
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3 h-3" />
                            Enable
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-900 hover:bg-red-800 rounded transition-colors text-red-300 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {keys.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              No AI keys configured yet
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
