import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface ApiKey {
  id: string;
  name: string;
  isActive: boolean;
  rateLimit: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiKeyWithSecret extends ApiKey {
  secret?: string;
  key?: string;
}

export function AdminApiKeys() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [createdKey, setCreatedKey] = useState<ApiKeyWithSecret | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rateLimit: 1000,
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
      const response = await axios.get(`${BACKEND_URL}/api/admin/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setKeys(response.data.keys);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/api-keys`,
        {
          name: formData.name,
          rateLimit: formData.rateLimit,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCreatedKey(response.data.key);
      setCreatedKey((prev) =>
        prev ? { ...prev, secret: response.data.secret } : null
      );

      await fetchKeys();
      setShowForm(false);
      setFormData({
        name: '',
        rateLimit: 1000,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/api-keys/${keyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          <h2 className="text-3xl font-bold text-gray-100">API Keys Management</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Key
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Created Key Alert */}
        {createdKey && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-green-300">API Key Created Successfully</h3>
              <button
                onClick={() => setCreatedKey(null)}
                className="text-green-400 hover:text-green-300"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-green-200 mb-4">
              Save your API key and secret securely. You won't be able to see the secret again.
            </p>
            <div className="space-y-3">
              <div className="bg-green-950 rounded p-3">
                <p className="text-xs text-green-400 mb-1">API Key:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-green-300 break-all">
                    {createdKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdKey.key || '')}
                    className="p-1 hover:bg-green-900 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-green-400" />
                  </button>
                </div>
              </div>
              <div className="bg-green-950 rounded p-3">
                <p className="text-xs text-green-400 mb-1">Secret:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-green-300 break-all">
                    {showSecret
                      ? createdKey.secret
                      : '•'.repeat((createdKey.secret || '').length)}
                  </code>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1 hover:bg-green-900 rounded transition-colors"
                  >
                    {showSecret ? (
                      <EyeOff className="w-4 h-4 text-green-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(createdKey.secret || '')}
                    className="p-1 hover:bg-green-900 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-green-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-100 mb-4">Create API Key</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Mobile App API"
                    required
                    className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rate Limit (requests/hour)
                  </label>
                  <input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rateLimit: parseInt(e.target.value),
                      })
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
                  Create Key
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Rate Limit
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
                {keys.map((key) => (
                  <tr
                    key={key.id}
                    className="hover:bg-gray-750 transition-colors border-b border-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300">{key.name}</td>
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
                      {key.rateLimit} req/hr
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
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
              No API keys yet
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
