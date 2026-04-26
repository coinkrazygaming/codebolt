import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Github } from 'lucide-react';
import { githubAuthService } from '../services/github-auth';
import { useAuth } from '../contexts/AuthContext';
import { GitHubTokenService } from '../services/github-token';

export function GitHubAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const projectId = searchParams.get('projectId');

      if (!code || !state) {
        setError('Missing OAuth code or state');
        return;
      }

      try {
        const authResponse = await githubAuthService.handleOAuthCallback(code, state);

        if (!authResponse) {
          setError('Failed to authenticate with GitHub');
          return;
        }

        // If we got a JWT token from the backend, save it for app authentication
        if (authResponse.authToken) {
          localStorage.setItem('auth_token', authResponse.authToken);
        }

        // If this is a project-specific authorization, save the GitHub token for that project
        if (projectId && token) {
          await GitHubTokenService.saveTokenForProject(projectId, authResponse, token);
          setTimeout(() => {
            navigate(`/project/${projectId}`, { replace: true });
          }, 1500);
        } else {
          // Otherwise redirect back to GitHub loader
          setTimeout(() => {
            navigate('/github', { replace: true });
          }, 1500);
        }
      } catch (err) {
        setError(`Authentication error: ${String(err)}`);
      }
    };

    handleCallback();
  }, [searchParams, navigate, token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-center mb-4">
            <Github className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-4 text-center">Authentication Failed</h1>
          <p className="text-gray-300 mb-6 text-center">{error}</p>
          <button
            onClick={() => navigate('/github')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Github className="w-12 h-12 text-purple-400" />
            <div className="absolute inset-0 animate-ping opacity-75">
              <Github className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Authenticating</h1>
        <p className="text-gray-400">Connecting to GitHub...</p>
      </div>
    </div>
  );
}
