import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Github } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  subdomain: string;
}

interface GitConfig {
  id: string;
  projectId: string;
  prWorkflow?: string;
  pushRepoUrl?: string;
  pushBranch: string;
}

export function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [gitConfig, setGitConfig] = useState<GitConfig | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [pushRepoUrl, setPushRepoUrl] = useState('');
  const [pushBranch, setPushBranch] = useState('main');
  const [prWorkflow, setPrWorkflow] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, gitRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/api/projects/git-config/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const projectData = projectRes.data;
      const gitData = gitRes.data;

      setProject(projectData);
      setGitConfig(gitData);
      setProjectName(projectData.name);
      setProjectDesc(projectData.description || '');
      setPushRepoUrl(gitData.pushRepoUrl || '');
      setPushBranch(gitData.pushBranch || 'main');
      setPrWorkflow(gitData.prWorkflow || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      await axios.patch(
        `${BACKEND_URL}/api/projects/${projectId}`,
        {
          name: projectName,
          description: projectDesc,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Project settings saved');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGitConfig = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      await axios.patch(
        `${BACKEND_URL}/api/projects/git-config/${projectId}`,
        {
          pushRepoUrl: pushRepoUrl || null,
          pushBranch,
          prWorkflow: prWorkflow || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Git configuration saved');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save git config');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-100">Project Settings</h1>
          {project && <p className="text-gray-400">{project.name}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200 mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-900 border border-green-700 rounded-lg text-green-200 mb-6">
            {success}
          </div>
        )}

        {/* Project Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-100 mb-6">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
              />
            </div>

            {project && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subdomain
                </label>
                <input
                  type="text"
                  value={`${project.subdomain}.yourapp.com`}
                  disabled
                  className="w-full px-4 py-2 bg-gray-900 text-gray-400 border border-gray-700 rounded-lg cursor-not-allowed"
                />
              </div>
            )}

            <button
              onClick={handleSaveProject}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>

        {/* GitHub Configuration */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-100 mb-6">GitHub Integration</h2>
          <p className="text-gray-400 mb-4">
            Connect your GitHub account to enable automatic push and pull request workflows.
          </p>
          <button
            onClick={() => navigate(`/project/${projectId}/github`)}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Github className="w-4 h-4" />
            Setup GitHub
          </button>
        </div>

        {/* Git Configuration */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-6">Git Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Push Repository URL
              </label>
              <input
                type="text"
                value={pushRepoUrl}
                onChange={(e) => setPushRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo.git"
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-gray-500 text-xs mt-1">
                The repository URL where changes will be pushed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Push Branch
              </label>
              <input
                type="text"
                value={pushBranch}
                onChange={(e) => setPushBranch(e.target.value)}
                placeholder="main"
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-gray-500 text-xs mt-1">
                Default branch for code commits
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pull Request Workflow
              </label>
              <textarea
                value={prWorkflow}
                onChange={(e) => setPrWorkflow(e.target.value)}
                placeholder="Describe your PR workflow (optional)..."
                className="w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20"
              />
              <p className="text-gray-500 text-xs mt-1">
                Configuration for automated pull requests
              </p>
            </div>

            <button
              onClick={handleSaveGitConfig}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Git Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
