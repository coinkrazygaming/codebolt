import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  projects: number;
  storage: number;
  features: string[];
  isActive: boolean;
}

export function AdminPricing() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    currency: 'USD',
    projects: 1,
    storage: 1,
    features: '',
  });

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchPlans();
  }, [user, token, navigate]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/pricing`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPlans(response.data.plans);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const features = formData.features
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingPlan) {
        await axios.patch(
          `${BACKEND_URL}/api/admin/pricing/${editingPlan.id}`,
          {
            name: formData.name,
            price: parseFloat(formData.price.toString()),
            currency: formData.currency,
            projects: parseInt(formData.projects.toString()),
            storage: parseInt(formData.storage.toString()),
            features,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          `${BACKEND_URL}/api/admin/pricing`,
          {
            name: formData.name,
            price: parseFloat(formData.price.toString()),
            currency: formData.currency,
            projects: parseInt(formData.projects.toString()),
            storage: parseInt(formData.storage.toString()),
            features,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      await fetchPlans();
      setShowForm(false);
      setEditingPlan(null);
      setFormData({
        name: '',
        price: 0,
        currency: 'USD',
        projects: 1,
        storage: 1,
        features: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save pricing plan');
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/pricing/${planId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchPlans();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete pricing plan');
    }
  };

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      projects: plan.projects,
      storage: plan.storage,
      features: plan.features.join(', '),
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 0,
      currency: 'USD',
      projects: 1,
      storage: 1,
      features: '',
    });
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
          <h2 className="text-3xl font-bold text-gray-100">Pricing Plans</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Plan
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
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              {editingPlan ? 'Edit Pricing Plan' : 'New Pricing Plan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) })
                    }
                    step="0.01"
                    required
                    className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Projects
                  </label>
                  <input
                    type="number"
                    value={formData.projects}
                    onChange={(e) =>
                      setFormData({ ...formData, projects: parseInt(e.target.value) })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Storage (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.storage}
                    onChange={(e) =>
                      setFormData({ ...formData, storage: parseInt(e.target.value) })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Features (comma-separated)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) =>
                    setFormData({ ...formData, features: e.target.value })
                  }
                  placeholder="Feature 1, Feature 2, Feature 3"
                  className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col"
            >
              <h3 className="text-xl font-bold text-gray-100 mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-blue-400 mb-1">
                ${plan.price.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400 mb-4">{plan.currency}</p>

              <div className="space-y-2 mb-6 flex-1">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">{plan.projects}</span> Projects
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium">{plan.storage}</span> GB Storage
                </p>

                {plan.features.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 font-medium mb-2">Features:</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-900 hover:bg-blue-800 rounded transition-colors text-blue-300 text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-900 hover:bg-red-800 rounded transition-colors text-red-300 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="p-12 text-center text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
            No pricing plans yet
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
