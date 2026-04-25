import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface Settings {
  id: string;
  siteName: string;
  primaryDomain: string;
  supportEmail: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export function AdminSettings() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchSettings();
  }, [user, token, navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSettings(response.data.settings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.patch(
        `${BACKEND_URL}/api/admin/settings`,
        {
          siteName: settings.siteName,
          primaryDomain: settings.primaryDomain,
          supportEmail: settings.supportEmail,
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSettings(response.data.settings);
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
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

  if (!settings) {
    return (
      <AdminLayout>
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
          Failed to load settings
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h2 className="text-3xl font-bold text-gray-100 mb-6">Site Settings</h2>

        <div className="max-w-2xl">
          {error && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Primary Domain */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Primary Domain
              </label>
              <input
                type="text"
                value={settings.primaryDomain}
                onChange={(e) =>
                  setSettings({ ...settings, primaryDomain: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Maintenance Mode */}
            <div className="border-t border-gray-700 pt-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  className="w-4 h-4 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-300">Enable Maintenance Mode</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                When enabled, the site will show a maintenance message to users
              </p>
            </div>

            {/* Maintenance Message */}
            {settings.maintenanceMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Maintenance Message
                </label>
                <textarea
                  value={settings.maintenanceMessage}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMessage: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                />
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
