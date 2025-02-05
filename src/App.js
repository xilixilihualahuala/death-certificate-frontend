import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractABI } from './contractABI';

// Import components
import RoleManager from './components/roleManager';
import ViewCertificate from './components/viewCertificate';
import AdminCert from './components/adminCert';
import DeathCertificateForm from './components/deathCertForm';
import UnauthorizedPage from './components/UnauthorizedPage';
import { CONTRACTS } from './utils/blockchain';
const CONTRACT_ADDRESS = CONTRACTS.DEATH_CERTIFICATE.ADDRESS;

// Authentication Context
export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [roles, setRoles] = useState({
    isAdmin: false,
    isAuthority: false,
    isFamily: false
  });

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await checkRoles(accounts[0]);
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  const checkRoles = async (userAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      const authorityRole = await contract.AUTHORITY_ROLE();
      const familyRole = await contract.FAMILY_ROLE();

      const [isAdminRole, isAuthorityRole, isFamilyRole] = await Promise.all([
        contract.hasRole(adminRole, userAddress),
        contract.hasRole(authorityRole, userAddress),
        contract.hasRole(familyRole, userAddress)
      ]);

      setRoles({
        isAdmin: isAdminRole,
        isAuthority: isAuthorityRole,
        isFamily: isFamilyRole
      });
    } catch (error) {
      console.error('Role checking error:', error);
    }
  };

  const logout = () => {
    setAccount(null);
    setRoles({ isAdmin: false, isAuthority: false, isFamily: false });
  };

  return (
    <AuthContext.Provider value={{ 
      account, 
      roles, 
      connectWallet, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const AdminRoutes = () => {
  const { roles, account } = React.useContext(AuthContext);
  
  return (account && (roles.isAdmin || roles.isAuthority)) ? (
    <Routes>
      <Route path="/createCert" element={<AdminCert />} />
      <Route path="/view" element={<ViewCertificate />} />
      <Route path="/roles" element={<RoleManager />} />
    </Routes>
  ) : <Navigate to="/unauthorized" />;
};

const FamilyRoutes = () => {
  const { roles, account } = React.useContext(AuthContext);
  
  return (account && roles.isFamily) ? (
    <Routes>
      <Route path="/view" element={<ViewCertificate />} />
    </Routes>
  ) : <Navigate to="/unauthorized" />;
};

const PublicRoutes = () => {
  const { account } = React.useContext(AuthContext);
  
  return (
    <Routes>
      <Route path="/" element={account ? <DeathCertificateForm /> : <Navigate to="/unauthorized" />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  );
};

const Navigation = () => {
  const { account, roles, connectWallet, logout } = React.useContext(AuthContext);

  return (
    <nav className="bg-white shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            {account && <Link to="/" className="text-gray-700 hover:text-blue-500">Create Certificate</Link>}
            
            {(account && roles.isFamily) && (
              <Link to="/family/view" className="text-gray-700 hover:text-blue-500">View Certificate</Link>
            )}
            
            {(account && (roles.isAdmin || roles.isAuthority)) && (
              <>
                <Link to="/admin/createCert" className="text-gray-700 hover:text-blue-500">Admin Create Cert</Link>
                <Link to="/admin/view" className="text-gray-700 hover:text-blue-500">View Certificate</Link>
                <Link to="/admin/roles" className="text-gray-700 hover:text-blue-500">Manage Roles</Link>
              </>
            )}
          </div>
          
          <div>
            {account ? (
              <div className="flex items-center space-x-4">
                <span>{account.substring(0, 6)}...{account.substring(38)}</span>
                <button 
                  onClick={logout} 
                  className="text-red-500 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet} 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            <Route path="/*" element={<PublicRoutes />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/family/*" element={<FamilyRoutes />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;