import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Builder } from './pages/Builder';
import { GitHubLoader } from './pages/GitHubLoader';
import { GitHubBuilder } from './pages/GitHubBuilder';
import { GitHubAuthCallback } from './pages/GitHubAuthCallback';
import { parseXml } from './steps';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/github" element={<GitHubLoader />} />
        <Route path="/github-builder" element={<GitHubBuilder />} />
        <Route path="/auth/github/callback" element={<GitHubAuthCallback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
