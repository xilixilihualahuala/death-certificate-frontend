import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractABI } from '../contractABI';

const CONTRACT_ADDRESS = '0x59D82984f6E02d340508f9295144b396B52e2cd0';

const RetrieveCertificate = () => {
    const [ic, setIC] = useState('');
    const [certificateId, setCertificateId] = useState('');
    const [certificateMetadata, setCertificateMetadata] = useState(null);
    const [userRoles, setUserRoles] = useState({ isAuthority: false, isFamily: false });
    const [status, setStatus] = useState('');
    const [account, setAccount] = useState('');

    // Check user roles on component mount and account change
    useEffect(() => {
        const checkUserRoles = async () => {
            if (window.ethereum && account) {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const contract = new ethers.Contract(
                        CONTRACT_ADDRESS,
                        contractABI,
                        provider
                    );
                    
                    const roles = await contract.checkRoles(account);
                    setUserRoles({
                        isAuthority: roles[0],
                        isFamily: roles[1]
                    });
                } catch (error) {
                    console.error('Error checking roles:', error);
                    setStatus('Error checking user roles');
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

    const handleRetrieve = async () => {
        if (!account) {
            setStatus('Please connect your wallet first');
            return;
        }

        if (!userRoles.isAuthority && !userRoles.isFamily) {
            setStatus('You must have Authority or Family role to view certificates');
            return;
        }

        setStatus('Processing...');
        
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
                setStatus('No certificate found for this IC number');
            } else {
                setStatus(`Error: ${error.message}`);
            }
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
                    <p>Roles: {userRoles.isAuthority ? '👨‍⚖️ Authority ' : ''} 
                    {userRoles.isFamily ? '👨‍👩‍👧‍👦 Family' : ''}</p>
                </div>
            )}

            {/* Input Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">IC Number</label>
                    <input
                        type="text"
                        value={ic}
                        onChange={(e) => setIC(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter IC Number"
                        required
                    />
                </div>
                <button
                    onClick={handleRetrieve}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    disabled={!account || (!userRoles.isAuthority && !userRoles.isFamily)}
                >
                    View Certificate
                </button>

                {/* Status Messages */}
                {status && (
                    <div className="mt-4 p-4 bg-gray-100 rounded">
                        {status}
                    </div>
                )}

                {/* Certificate Details */}
                {certificateMetadata && (
                    <div className="mt-4 p-4 bg-green-100 rounded space-y-2">
                        <h2 className="font-semibold">Certificate Details:</h2>
                        <p>Certificate ID: {certificateId}</p>
                        <p>IPFS CID: {certificateMetadata.ipfsCID}</p>
                        <p>Status: {certificateMetadata.isValid ? 'Valid' : 'Invalid'}</p>
                        <p>Timestamp: {certificateMetadata.timestamp}</p>
                        <button
            onClick={() => {
                const ipfsUrl = `https://ipfs.io/ipfs/${certificateMetadata.ipfsCID}`;
                window.location.href = ipfsUrl; // Redirect to the IPFS URL
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
            View Certificate on IPFS
        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RetrieveCertificate;