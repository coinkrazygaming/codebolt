import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { Trash2 } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface Project {
  id: string;
  name: string;
  description?: string;
  subdomain: string;
  createdAt: string;
  updatedAt: string;
  space: {
    id: string;
    name: string;
    user: {
      id: string;
      email: string;
      name?: string;
    };
  };
}

export function AdminProjects() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchProjects();
  }, [user, token, navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProjects(response.data.projects);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
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
        <h2 className="text-3xl font-bold text-gray-100 mb-6">Projects Management</h2>

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
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Subdomain
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Workspace
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Owner
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
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-750 transition-colors border-b border-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.subdomain}.yourapp.com
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.space.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {project.space.user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-red-900 hover:bg-red-800 rounded transition-colors text-red-300 text-xs"
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

          {projects.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              No projects found
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
