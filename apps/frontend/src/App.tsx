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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
