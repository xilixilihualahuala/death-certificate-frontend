import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DeathCertificateForm from './components/deathCertForm';
import ViewCertificate from './components/viewCertificate';
import AdminCert from './components/adminCert';
import RoleManager from './components/roleManager';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm mb-6">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex space-x-4">
              <Link to="/" className="text-gray-700 hover:text-blue-500">Create Certificate</Link>
              <Link to="/view" className="text-gray-700 hover:text-blue-500">View Certificate</Link>
              <Link to="/createCert" className="text-gray-700 hover:text-blue-500">Admin Create Cert</Link>
              <Link to="/roles" className="text-gray-700 hover:text-blue-500">Manage Roles</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<DeathCertificateForm />} />
          <Route path="/view" element={<ViewCertificate />} />
          <Route path="/createCert" element={<AdminCert />} />
          <Route path="/roles" element={<RoleManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;