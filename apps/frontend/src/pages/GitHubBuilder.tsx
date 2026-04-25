import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Github, Code2, GitBranch, Save, Plus, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { githubAuthService } from '../services/github-auth';
import {
  parseGitHubUrl,
  fetchRepositoryTree,
  getFileContentAuthenticated,
  fetchBranches,
  commitChanges,
  createPullRequest,
  createBranch,
  GitHubFile,
  GitHubBranch,
} from '../services/github';
import { FileExplorer } from '../components/FileExplorer';
import { CodeEditor } from '../components/CodeEditor';
import { Loader } from '../components/Loader';

interface RepositoryState {
  owner: string;
  repo: string;
  branch: string;
  files: GitHubFile[];
  branches: GitHubBranch[];
  selectedFile: GitHubFile | null;
  fileContent: string;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileItem[];
}

export function GitHubBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { repoUrl, branch: initialBranch } = location.state as { repoUrl: string; branch?: string };

  const [repo, setRepo] = useState<RepositoryState>({
    owner: '',
    repo: '',
    branch: initialBranch || 'main',
    files: [],
    branches: [],
    selectedFile: null,
    fileContent: '',
    isLoading: true,
    error: null,
    isDirty: false,
  });

  const [userPrompt, setUserPrompt] = useState('');
  const [llmMessages, setLlmMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPRDialog, setShowPRDialog] = useState(false);
  const [prDetails, setPRDetails] = useState({ title: '', body: '', newBranch: false, branchName: '' });

  // Initialize repository
  useEffect(() => {
    const initializeRepo = async () => {
      const isAuthenticated = githubAuthService.isAuthenticated();
      if (!isAuthenticated) {
        setRepo(prev => ({
          ...prev,
          error: 'Please authenticate with GitHub first',
          isLoading: false,
        }));
        return;
      }

      try {
        const parsed = parseGitHubUrl(repoUrl);
        if (!parsed) {
          throw new Error('Invalid repository URL');
        }

        // Fetch repository tree
        const files = await fetchRepositoryTree(parsed.owner, parsed.repo, repo.branch);
        
        // Fetch branches
        const branches = await fetchBranches(parsed.owner, parsed.repo);

        setRepo(prev => ({
          ...prev,
          owner: parsed.owner,
          repo: parsed.repo,
          files,
          branches,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        setRepo(prev => ({
          ...prev,
          error: `Failed to load repository: ${String(error)}`,
          isLoading: false,
        }));
      }
    };

    initializeRepo();
  }, [repoUrl]);

  // Load file content when selected file changes
  useEffect(() => {
    const loadFileContent = async () => {
      if (!repo.selectedFile || repo.selectedFile.type === 'dir') {
        setRepo(prev => ({ ...prev, fileContent: '' }));
        return;
      }

      try {
        const content = await getFileContentAuthenticated(
          repo.owner,
          repo.repo,
          repo.selectedFile.path,
          repo.branch
        );
        setRepo(prev => ({ ...prev, fileContent: content }));
      } catch (error) {
        setRepo(prev => ({
          ...prev,
          error: `Failed to load file: ${String(error)}`,
        }));
      }
    };

    loadFileContent();
  }, [repo.selectedFile, repo.branch]);

  const handleFileSelect = (file: GitHubFile) => {
    setRepo(prev => ({
      ...prev,
      selectedFile: file,
      isDirty: false,
    }));
  };

  const handleFileContentChange = (content: string) => {
    setRepo(prev => ({ ...prev, fileContent: content, isDirty: true }));
  };

  const handleBranchChange = async (newBranch: string) => {
    if (repo.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Switch branch anyway?');
      if (!confirmed) return;
    }

    setRepo(prev => ({
      ...prev,
      branch: newBranch,
      selectedFile: null,
      isDirty: false,
    }));
  };

  const handleSaveFile = async () => {
    if (!repo.selectedFile || !repo.isDirty) return;

    try {
      await commitChanges({
        owner: repo.owner,
        repo: repo.repo,
        branch: repo.branch,
        message: `Update ${repo.selectedFile.name}`,
        files: [
          {
            path: repo.selectedFile.path,
            content: repo.fileContent,
          },
        ],
      });

      setRepo(prev => ({ ...prev, isDirty: false }));
    } catch (error) {
      setRepo(prev => ({
        ...prev,
        error: `Failed to save file: ${String(error)}`,
      }));
    }
  };

  const handleAIModification = async () => {
    if (!userPrompt.trim()) return;

    setIsGenerating(true);

    try {
      const newMessage = { role: 'user' as const, content: userPrompt };
      setLlmMessages(prev => [...prev, newMessage]);

      const response = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...llmMessages, newMessage],
      });

      const aiResponse = response.data.response;
      setLlmMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // TODO: Parse AI response and apply code modifications
      // For now, just update the prompt
      setUserPrompt('');
    } catch (error) {
      setRepo(prev => ({
        ...prev,
        error: `Failed to generate modifications: ${String(error)}`,
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatePR = async () => {
    if (!prDetails.title.trim()) {
      setRepo(prev => ({ ...prev, error: 'Please enter a PR title' }));
      return;
    }

    try {
      let targetBranch = repo.branch;

      // Create new branch if requested
      if (prDetails.newBranch && prDetails.branchName.trim()) {
        await createBranch(repo.owner, repo.repo, prDetails.branchName.trim());
        targetBranch = prDetails.branchName.trim();
      }

      // Create PR
      const pr = await createPullRequest({
        owner: repo.owner,
        repo: repo.repo,
        title: prDetails.title,
        body: prDetails.body,
        baseBranch: 'main',
        headBranch: targetBranch,
      });

      setShowPRDialog(false);
      setRepo(prev => ({
        ...prev,
        error: `PR created! ${pr.prUrl}`,
      }));
    } catch (error) {
      setRepo(prev => ({
        ...prev,
        error: `Failed to create PR: ${String(error)}`,
      }));
    }
  };

  if (repo.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Github className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-xl font-semibold text-gray-100">
                {repo.owner}/{repo.repo}
              </h1>
              <p className="text-sm text-gray-400">GitHub Builder - AI-powered code modifications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={repo.branch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="bg-gray-700 text-gray-100 px-3 py-2 rounded text-sm border border-gray-600 hover:border-gray-500 focus:outline-none focus:border-purple-500 flex items-center gap-2"
            >
              {repo.branches.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowPRDialog(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Create PR
            </button>
          </div>
        </div>
        {repo.error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm mt-2">
            {repo.error}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          {/* File Explorer */}
          <div className="col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 h-full overflow-auto">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Files</h2>
              <div className="space-y-1">
                {repo.files.map(file => (
                  <button
                    key={file.path}
                    onClick={() => handleFileSelect(file)}
                    className={`w-full text-left px-3 py-2 rounded text-sm truncate ${
                      repo.selectedFile?.path === file.path
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    title={file.path}
                  >
                    <span className="mr-2">{file.type === 'file' ? '📄' : '📁'}</span>
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Editor & AI Panel */}
          <div className="col-span-3 space-y-4">
            {/* Code Editor */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex-1 overflow-auto" style={{ height: '60%' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  {repo.selectedFile?.path || 'Select a file'}
                </h2>
                {repo.isDirty && (
                  <button
                    onClick={handleSaveFile}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                )}
              </div>
              {repo.selectedFile?.type === 'file' ? (
                <textarea
                  value={repo.fileContent}
                  onChange={(e) => handleFileContentChange(e.target.value)}
                  className="w-full h-[calc(100%-2rem)] p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded font-mono text-sm focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <div className="text-gray-400">Select a file to edit</div>
              )}
            </div>

            {/* AI Modification Panel */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4" style={{ height: '40%' }}>
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                AI Code Assistant
              </h2>
              <div className="space-y-3">
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Describe the code modifications you want..."
                  className="w-full h-20 p-3 bg-gray-900 text-gray-100 border border-gray-700 rounded focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <button
                  onClick={handleAIModification}
                  disabled={isGenerating || !userPrompt.trim()}
                  className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Modifications'}
                </button>
                {llmMessages.length > 0 && (
                  <div className="bg-gray-900 rounded p-3 max-h-32 overflow-y-auto text-sm text-gray-300 border border-gray-700">
                    {llmMessages.map((msg, i) => (
                      <div key={i} className="mb-2">
                        <span className="font-semibold text-gray-400">{msg.role}:</span> {msg.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PR Dialog */}
      {showPRDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-100">Create Pull Request</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={prDetails.title}
                onChange={(e) => setPRDetails(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of changes"
                className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={prDetails.body}
                onChange={(e) => setPRDetails(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Detailed description (optional)"
                className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded focus:ring-2 focus:ring-purple-500 resize-none h-24"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newBranch"
                checked={prDetails.newBranch}
                onChange={(e) => setPRDetails(prev => ({ ...prev, newBranch: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="newBranch" className="text-sm text-gray-300">Create new branch</label>
            </div>

            {prDetails.newBranch && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Branch Name</label>
                <input
                  type="text"
                  value={prDetails.branchName}
                  onChange={(e) => setPRDetails(prev => ({ ...prev, branchName: e.target.value }))}
                  placeholder="feature/my-feature"
                  className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowPRDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-100 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePR}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create PR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
