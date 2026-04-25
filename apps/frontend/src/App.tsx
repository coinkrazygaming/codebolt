import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

// Pages
import { Home } from './pages/Home';
import { Builder } from './pages/Builder';
import { GitHubLoader } from './pages/GitHubLoader';
import { GitHubBuilder } from './pages/GitHubBuilder';
import { GitHubAuthCallback } from './pages/GitHubAuthCallback';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { ProjectSettings } from './pages/ProjectSettings';
import { ProjectGitHubSetup } from './pages/ProjectGitHubSetup';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminWorkspaces } from './pages/AdminWorkspaces';
import { AdminProjects } from './pages/AdminProjects';
import { AdminSettings } from './pages/AdminSettings';
import { AdminPricing } from './pages/AdminPricing';
import { AdminAiKeys } from './pages/AdminAiKeys';
import { AdminApiKeys } from './pages/AdminApiKeys';
import { AdminSetup } from './pages/AdminSetup';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin setup - public route for initial setup */}
          <Route path="/admin-setup" element={<AdminSetup />} />

          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* Home page - accessible to everyone */}
          <Route path="/" element={<Home />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/github"
            element={
              <ProtectedRoute>
                <ProjectGitHubSetup />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workspaces"
            element={
              <ProtectedRoute>
                <AdminWorkspaces />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute>
                <AdminProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute>
                <AdminPricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-keys"
            element={
              <ProtectedRoute>
                <AdminAiKeys />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/api-keys"
            element={
              <ProtectedRoute>
                <AdminApiKeys />
              </ProtectedRoute>
            }
          />

          {/* Builder routes */}
          <Route path="/builder" element={<Builder />} />
          <Route path="/github" element={<GitHubLoader />} />
          <Route path="/github-builder" element={<GitHubBuilder />} />
          <Route path="/auth/github/callback" element={<GitHubAuthCallback />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
