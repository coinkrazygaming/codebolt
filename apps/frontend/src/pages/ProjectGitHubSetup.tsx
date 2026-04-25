import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Github, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { GitHubTokenService } from '../services/github-token';

export function ProjectGitHubSetup() {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data);
      setHasToken(!!response.data.githubToken);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubAuth = () => {
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID || 'your-github-client-id';
    const redirectUri = `${window.location.origin}/auth/github/callback?projectId=${projectId}`;
    const scope = 'repo,user,gist';
    const state = projectId;

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&state=${state}`;

    window.location.href = authUrl;
  };

  const handleRemoveToken = async () => {
    try {
      setLoading(true);
      // In a real implementation, you'd have a delete endpoint
      // For now, we just clear the local state
      setHasToken(false);
      await fetchProject();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove token');
    } finally {
      setLoading(false);
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
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          <h1 className="text-2xl font-bold text-gray-100">GitHub Setup</h1>
          {project && <p className="text-gray-400">{project.name}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <Github className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">
                Connect GitHub Account
              </h2>
              <p className="text-gray-400">
                Authorize this project to access your GitHub repositories. This allows you to
                push code changes and create pull requests automatically.
              </p>
            </div>
          </div>

          {hasToken ? (
            <div className="p-4 bg-green-900 border border-green-700 rounded-lg mb-6">
              <p className="text-green-200">✓ GitHub account is connected</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <button
              onClick={handleGitHubAuth}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Github className="w-5 h-5" />
              {hasToken ? 'Reconnect GitHub' : 'Connect GitHub'}
            </button>

            {hasToken && (
              <button
                onClick={handleRemoveToken}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Disconnect GitHub
              </button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-bold text-gray-100 mb-4">Permissions</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• Access to read and write to your repositories</li>
              <li>• Ability to create branches and commits</li>
              <li>• Ability to open and manage pull requests</li>
              <li>• Read access to your GitHub profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
