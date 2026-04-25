import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Builder } from './pages/Builder';
import { GitHubLoader } from './pages/GitHubLoader';
import { parseXml } from './steps';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/github" element={<GitHubLoader />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
