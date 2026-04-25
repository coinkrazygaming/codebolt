import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, ArrowLeft } from 'lucide-react';
import { githubAuthService } from '../services/github-auth';

export function GitHubLoader() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      if (githubAuthService.isAuthenticated()) {
        setIsAuthenticated(true);
        const user = await githubAuthService.getCurrentUser();
        if (user) {
          setUserName(user.login);
        }
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      setError('Please authenticate with GitHub first');
      return;
    }

    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Validate GitHub URL format
    const githubUrlRegex = /^(https:\/\/github\.com\/|git@github\.com:)[\w\-]+\/[\w\-]+$/;
    if (!githubUrlRegex.test(repoUrl.trim())) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)');
      return;
    }

    setLoading(true);

    // Navigate to builder with GitHub repo info
    navigate('/github-builder', {
      state: {
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || 'main',
      },
    });
  };

  const handleLogin = () => {
    githubAuthService.startOAuthFlow();
  };

  const handleLogout = () => {
    githubAuthService.clearToken();
    setIsAuthenticated(false);
    setUserName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Github className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Load & Code from GitHub
          </h1>
          <p className="text-lg text-gray-300">
            Load a GitHub repository and let AI help you code, then PR or push changes back
          </p>
        </div>

        {/* Authentication Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              {isAuthenticated ? (
                <div>
                  <p className="text-sm text-gray-400">Authenticated as</p>
                  <p className="text-lg font-semibold text-green-400">@{userName}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400">You need to authenticate</p>
                  <p className="text-lg font-semibold text-gray-300">Not logged in</p>
                </div>
              )}
            </div>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                Login with GitHub
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                disabled={!isAuthenticated}
                className="w-full p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter the full GitHub repository URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                disabled={!isAuthenticated}
                className="w-full p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-1">
                The branch to load (default: main)
              </p>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="w-full mt-6 bg-purple-600 text-gray-100 py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load Repository & Open Builder'}
            </button>
          </div>
        </form>

        <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">What happens next?</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-sm font-medium rounded-full flex-shrink-0">1</span>
              <span>We load your repository files</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-sm font-medium rounded-full flex-shrink-0">2</span>
              <span>The AI analyzes your code structure</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-sm font-medium rounded-full flex-shrink-0">3</span>
              <span>You can describe changes or features you want to add</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-sm font-medium rounded-full flex-shrink-0">4</span>
              <span>AI generates the code changes</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-sm font-medium rounded-full flex-shrink-0">5</span>
              <span>You can review, test, and push or create a PR on GitHub</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
