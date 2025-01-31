import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xC27BF1EdbCa24ef9b7AF5E9EF8199A2801EE869B';

const AdminCertificateCreator = () => {
  const [account, setAccount] = useState('');
  const [isAuthority, setIsAuthority] = useState(false);
  const [formData, setFormData] = useState({
    ic: '',
    ipfsCID: ''
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
          'function createCertificate(string memory ic, string memory ipfsCID) public returns (bytes32)'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || !isAuthority) {
      setError('Please connect with an authority account');
      return;
    }

    setStatus('Processing...');
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        [
          'function createCertificate(string memory ic, string memory ipfsCID) public returns (bytes32)'
        ],
        signer
      );

      const tx = await contract.createCertificate(formData.ic, formData.ipfsCID);
      setStatus('Transaction submitted. Waiting for confirmation...');
      
      await tx.wait();
      setStatus('Certificate created successfully! Transaction hash: ' + tx.hash);
      
      // Clear form
      setFormData({
        ic: '',
        ipfsCID: ''
      });
    } catch (error) {
      console.error('Error creating certificate:', error);
      setError('Error creating certificate: ' + error.message);
      setStatus('');
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

        {/* Certificate Creation Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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