import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/blockchain'; 
import { contractABI } from '../contractABI';

const CONTRACT_ADDRESS = '0x507DF1F1249B6EE6913281a4d950b64Eb8D65b8E';

const RetrieveCertificate = () => {
    const [ic, setIC] = useState('');
    const [certificateId, setCertificateId] = useState('');
    const [certificateMetadata, setCertificateMetadata] = useState(null);
    const [userRoles, setUserRoles] = useState({ isAuthority: false, isFamily: false });
    const [status, setStatus] = useState('');
    const [account, setAccount] = useState('');
    const [error, setError] = useState('');

    // Check user roles on component mount and account change
    useEffect(() => {
        const checkUserRoles = async () => {
            if (window.ethereum && account) {
                try {
                    console.log('Checking roles for account:', account);
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner();
                    const contract = new ethers.Contract(
                        CONTRACT_ADDRESS,
                        contractABI,
                        signer
                    );
                    
                    const roles = await contract.checkRoles(account);
                    console.log('Roles received:', roles);
                    
                    setUserRoles({
                        isAuthority: roles[0],
                        isFamily: roles[1]
                    });
                    
                    if (!roles[0] && !roles[1]) {
                        setError('You must have Authority or Family role to view certificates');
                    } else {
                        setError('');
                    }
                } catch (error) {
                    console.error('Error checking roles:', error);
                    setError('Error checking user roles: ' + error.message);
                }
            }
        };

        checkUserRoles();
    }, [account]);

    // Connect wallet and get account
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
            setStatus('Error connecting wallet');
        }
    };

    // Modify the handleRetrieve function
    const handleRetrieve = async () => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        if (!userRoles.isAuthority && !userRoles.isFamily) {
            setError('You must have Authority or Family role to view certificates');
            return;
        }

        setStatus('Processing...');
        setError(''); // Clear any previous errors
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                contractABI,
                signer
            );

            // Generate certificate ID
            const generatedId = await contract.generateCertificateId(ic);
            setCertificateId(generatedId);

            // Get certificate metadata
            const metadata = await contract.getCertificateMetadata(generatedId);
            setCertificateMetadata({
                id: metadata.id,
                ipfsCID: metadata.ipfsCID,
                isValid: metadata.isValid,
                timestamp: new Date(Number(metadata.timestamp) * 1000).toLocaleString()
            });

            setStatus('Certificate retrieved successfully!');
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('Certificate does not exist')) {
                setError('No certificate found for this IC number');
            } else {
                setError(`Error: ${error.message}`);
            }
            setStatus(''); // Clear the processing status
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">View Death Certificate</h1>
            
            {/* Wallet Connection */}
            <div className="mb-4">
                <button
                    onClick={connectWallet}
                    className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                >
                    {account ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}` : 'Connect Wallet'}
                </button>
            </div>
    
            {/* Role Status */}
            {account && (
                <div className="mb-4 p-2 bg-gray-100 rounded">
                    <p>
                        Roles: {userRoles.isAuthority ? '👨‍⚖️ Authority ' : ''} 
                        {userRoles.isFamily ? '👨‍👩‍👧‍👦 Family' : ''}
                        {!userRoles.isAuthority && !userRoles.isFamily && 'No roles assigned'}
                    </p>
                </div>
            )}
    
            {/* Error Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
    
            {/* Status Messages */}
            {status && (
                <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                    {status}
                </div>
            )}
    
            {/* Input Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">IC Number</label>
                    <input
                        type="text"
                        value={ic}
                        onChange={(e) => setIC(e.target.value.trim())}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter IC Number"
                        required
                    />
                </div>
                <button
                    onClick={handleRetrieve}
                    className={`px-4 py-2 rounded-md ${
                        !account || (!userRoles.isAuthority && !userRoles.isFamily)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                    disabled={!account || (!userRoles.isAuthority && !userRoles.isFamily)}
                >
                    View Certificate
                </button>
            </div>
    
            {/* Certificate Details */}
            {certificateMetadata && (
                <div className="mt-4 p-4 bg-green-100 rounded space-y-2">
                    {/* ... rest of your certificate details code ... */}
                </div>
            )}
        </div>
    );
};

export default RetrieveCertificate;