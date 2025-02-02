import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  getPendingCertificates, 
  removePendingCertificate, 
  updateCertificateStatus 
} from '../utils/pendingStorage';
import { CONTRACTS } from '../utils/blockchain';
const CONTRACT_ADDRESS = CONTRACTS.DEATH_CERTIFICATE.ADDRESS;

const AdminCertificateCreator = () => {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [account, setAccount] = useState('');
  const [isAuthority, setIsAuthority] = useState(false);
  const [formData, setFormData] = useState({
    ic: '',
    ipfsCID: '',
    submitterAddress: ''
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const checkAuthorityRole = useCallback(async () => {
    if (!account) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        [
          'function checkRoles(address account) public view returns (bool isAuthority, bool isFamily)',
          'function createCertificate(string memory ic, string memory ipfsCID, address submitterAddress) public returns (bytes32)'
        ],
        signer
      );

      const roles = await contract.checkRoles(account);
      setIsAuthority(roles[0]);
      if (!roles[0]) {
        setError('You must have Authority role to create certificates');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Error checking authority role:', error);
      setError('Error checking authority role: ' + error.message);
    }
  }, [account]);

  useEffect(() => {
    checkAuthorityRole();
  }, [checkAuthorityRole]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Error connecting wallet: ' + error.message);
    }
  };

  useEffect(() => {
    setPendingCerts(getPendingCertificates());
  }, []);

  const handleCreateCertificate = async (ic, cid, submitterAddress) => {
    try {
        updateCertificateStatus(cid, 'processing');
        setPendingCerts(getPendingCertificates());

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            [
                'function createCertificate(string memory ic, string memory ipfsCID, address submitterAddress) public returns (bytes32)'
            ],
            signer
        );

        const tx = await contract.createCertificate(ic, cid, submitterAddress);
        await tx.wait();
        
        // Remove from pending list
        removePendingCertificate(cid);
        setPendingCerts(getPendingCertificates());
        
        setStatus('Certificate created successfully! Transaction hash: ' + tx.hash);
        
        // Clear form
        setFormData({
            ic: '',
            ipfsCID: '',
            submitterAddress: ''
        });
    } catch (error) {
        console.error('Error creating certificate:', error);

        // Extract user-friendly error message
        let errorMessage = 'Error creating certificate: ';
        if (error.message.includes('user rejected action')) {
            errorMessage += 'Transaction rejected by user.';
        } else {
            errorMessage += error.message;
        }

        setError(errorMessage);

        // Revert certificate status to "pending"
        updateCertificateStatus(cid, 'pending');
        setPendingCerts(getPendingCertificates());
    }
};

  const handleDeleteCertificate = (cid) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this pending certificate?");
    if (confirmDelete) {
        removePendingCertificate(cid);
        setPendingCerts(getPendingCertificates());
    }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Death Certificate (Admin)</h2>
      
      <div className="space-y-6">
        {/* Wallet Connection */}
        <div>
          <button
            onClick={connectWallet}
            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
          >
            {account ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}` : 'Connect Wallet'}
          </button>
        </div>

        {/* Role Status */}
        {account && (
          <div className="p-3 bg-gray-100 rounded-md flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAuthority ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>
              Authority Role: {isAuthority ? 'Active' : 'Not Authorized'}
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Status Display */}
        {status && (
          <div className="p-3 bg-blue-100 text-blue-700 rounded-md">
            {status}
          </div>
        )}

        {/* Pending Certificates Section */}
        {pendingCerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Pending Certificates</h3>
            <div className="space-y-4">
              {pendingCerts.map(({ ic, cid, timestamp, status, submitterAddress }) => (
                <div key={cid} className="p-4 border rounded-md">
                  <p><strong>IC:</strong> {ic}</p>
                  <p><strong>IPFS CID:</strong> {cid}</p>
                  <p><strong>Submitted:</strong> {new Date(timestamp).toLocaleString()}</p>
                  <p><strong>Status:</strong> {status}</p>
                  <p><strong>Submitter Address:</strong> {submitterAddress}</p>
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => handleCreateCertificate(ic, cid, submitterAddress)}
                      disabled={status === 'processing'}
                      className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 
                        ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {status === 'processing' ? 'Processing...' : 'Verify and Create'}
                    </button>
                    <a 
                      href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      View Certificate
                    </a>
                    <button
                      onClick={() => handleDeleteCertificate(cid)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                      Delete
                  </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Creation Form */}
        <form onSubmit={handleCreateCertificate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IC Number
            </label>
            <input
              type="text"
              name="ic"
              value={formData.ic}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter 12-digit IC number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IPFS CID
            </label>
            <input
              type="text"
              name="ipfsCID"
              value={formData.ipfsCID}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter IPFS CID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Submitter Address
            </label>
            <input
              type="text"
              name="submitterAddress"
              value={formData.submitterAddress}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter IPFS CID"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!account || !isAuthority}
            className={`w-full p-2 rounded-md text-white ${
              !account || !isAuthority
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            Create Certificate
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminCertificateCreator;