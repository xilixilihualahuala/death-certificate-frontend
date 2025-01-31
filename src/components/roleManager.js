import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractABI } from '../contractABI';

const CONTRACT_ADDRESS = '0xC27BF1EdbCa24ef9b7AF5E9EF8199A2801EE869B';

const RoleManager = () => {
    const [account, setAccount] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthority, setIsAuthority] = useState(false);
    const [targetAddress, setTargetAddress] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    // Check admin and authority roles on component mount and account change
    useEffect(() => {
        const checkRoles = async () => {
            if (!account) return;

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

                // Get role constants
                const adminRole = await contract.DEFAULT_ADMIN_ROLE();
                const authorityRole = await contract.AUTHORITY_ROLE();

                // Check roles for connected account
                const [isAdminRole, isAuthorityRole] = await Promise.all([
                    contract.hasRole(adminRole, account),
                    contract.hasRole(authorityRole, account)
                ]);

                setIsAdmin(isAdminRole);
                setIsAuthority(isAuthorityRole);

                if (!isAdminRole && !isAuthorityRole) {
                    setError('You must have Admin or Authority role to manage roles');
                } else {
                    setError('');
                }
            } catch (error) {
                console.error('Error checking roles:', error);
                setError('Error checking roles: ' + error.message);
            }
        };

        checkRoles();
    }, [account]);

    // Connect wallet
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

    // Handle role management
    const handleRoleAction = async (action) => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        if (!ethers.isAddress(targetAddress)) {
            setError('Please enter a valid Ethereum address');
            return;
        }

        // Check permissions
        if ((action.includes('Authority') && !isAdmin) || 
            (action.includes('Family') && !isAuthority)) {
            setError(`You don't have permission to ${action}`);
            return;
        }

        setStatus('Processing...');
        setError('');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

            let tx;
            switch (action) {
                case 'grantAuthority':
                    tx = await contract.grantAuthorityRole(targetAddress);
                    break;
                case 'revokeAuthority':
                    tx = await contract.revokeAuthorityRole(targetAddress);
                    break;
                case 'grantFamily':
                    tx = await contract.grantFamilyRole(targetAddress);
                    break;
                case 'revokeFamily':
                    tx = await contract.revokeFamilyRole(targetAddress);
                    break;
                default:
                    throw new Error('Invalid action');
            }

            setStatus('Transaction submitted. Waiting for confirmation...');
            await tx.wait();
            setStatus(`${action} completed successfully! Transaction hash: ${tx.hash}`);
            setTargetAddress('');

            // Refresh roles after successful action
            const targetRoles = await contract.checkRoles(targetAddress);
            console.log('Updated roles for target address:', targetRoles);
        } catch (error) {
            console.error('Error managing role:', error);
            setError('Error managing role: ' + error.message);
            setStatus('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Role Management</h2>
            
            {/* Wallet Connection */}
            <div className="mb-6">
                <button
                    onClick={connectWallet}
                    className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                >
                    {account ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}` : 'Connect Wallet'}
                </button>
            </div>

            {/* Role Status */}
            {account && (
                <div className="mb-6 p-3 bg-gray-100 rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>Admin Role: {isAdmin ? 'Active' : 'Not Active'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAuthority ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>Authority Role: {isAuthority ? 'Active' : 'Not Active'}</span>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {/* Status Display */}
            {status && (
                <div className="mb-6 p-3 bg-blue-100 text-blue-700 rounded-md">
                    {status}
                </div>
            )}

            {/* Role Management Form */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Address
                    </label>
                    <input
                        type="text"
                        value={targetAddress}
                        onChange={(e) => setTargetAddress(e.target.value.trim())}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="0x..."
                        required
                    />
                </div>

                {/* Authority Role Management (Admin Only) */}
                {isAdmin && (
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleRoleAction('grantAuthority')}
                            className="flex-1 p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Grant Authority Role
                        </button>
                        <button
                            onClick={() => handleRoleAction('revokeAuthority')}
                            className="flex-1 p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                            Revoke Authority Role
                        </button>
                    </div>
                )}

                {/* Family Role Management (Authority Only) */}
                {isAuthority && (
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleRoleAction('grantFamily')}
                            className="flex-1 p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Grant Family Role
                        </button>
                        <button
                            onClick={() => handleRoleAction('revokeFamily')}
                            className="flex-1 p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                            Revoke Family Role
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManager;