import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { Trash2, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface Project {
  id: string;
  name: string;
  subdomain: string;
}

interface Space {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  projects: Project[];
}

export function AdminWorkspaces() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSpace, setExpandedSpace] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchSpaces();
  }, [user, token, navigate]);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/spaces`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSpaces(response.data.spaces);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace and all its projects?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/spaces/${spaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchSpaces();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete workspace');
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
        <h2 className="text-3xl font-bold text-gray-100 mb-6">Workspaces Management</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
            >
              <div className="p-6 flex items-center justify-between hover:bg-gray-750 transition-colors">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100">{space.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Owner: {space.user.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(space.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-300 font-medium">
                      {space.projects.length} Projects
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedSpace(expandedSpace === space.id ? null : space.id)
                    }
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSpace === space.id && (
                <div className="border-t border-gray-700 p-6 bg-gray-900">
                  <h4 className="text-sm font-semibold text-gray-300 mb-4">
                    Projects in this workspace:
                  </h4>
                  {space.projects.length > 0 ? (
                    <div className="space-y-2 mb-6">
                      {space.projects.map((project) => (
                        <div
                          key={project.id}
                          className="p-3 bg-gray-800 rounded border border-gray-700"
                        >
                          <p className="text-sm text-gray-200">{project.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {project.subdomain}.yourapp.com
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-6">No projects</p>
                  )}

                  <button
                    onClick={() => {
                      handleDeleteSpace(space.id);
                      setExpandedSpace(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 rounded transition-colors text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Workspace</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {spaces.length === 0 && (
          <div className="p-12 text-center text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
            No workspaces found
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
