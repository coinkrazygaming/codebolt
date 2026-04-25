import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { Users, Box, TrendingUp, DollarSign, Activity } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalSpaces: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalRevenue: number;
}

export function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats(response.data.stats);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, token, navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: Activity,
      color: 'green',
    },
    {
      label: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: Box,
      color: 'purple',
    },
    {
      label: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'yellow',
    },
    {
      label: 'New Users (This Month)',
      value: stats?.newUsersThisMonth || 0,
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-900 text-blue-400',
    green: 'bg-green-900 text-green-400',
    purple: 'bg-purple-900 text-purple-400',
    yellow: 'bg-yellow-900 text-yellow-400',
    orange: 'bg-orange-900 text-orange-400',
  };

  return (
    <AdminLayout>
      <div>
        <h2 className="text-3xl font-bold text-gray-100 mb-8">Platform Overview</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            const colorClass = colorClasses[card.color as keyof typeof colorClasses];
            return (
              <div
                key={card.label}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-gray-100">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-gray-100 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <p className="text-gray-300 font-medium">Manage Users</p>
              <p className="text-gray-500 text-sm">View and manage all users</p>
            </button>
            <button
              onClick={() => navigate('/admin/projects')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <p className="text-gray-300 font-medium">Manage Projects</p>
              <p className="text-gray-500 text-sm">View all projects</p>
            </button>
            <button
              onClick={() => navigate('/admin/pricing')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <p className="text-gray-300 font-medium">Pricing Plans</p>
              <p className="text-gray-500 text-sm">Manage pricing tiers</p>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <p className="text-gray-300 font-medium">Site Settings</p>
              <p className="text-gray-500 text-sm">Configure site settings</p>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
