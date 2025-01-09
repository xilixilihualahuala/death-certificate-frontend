// blockchain.js
import { ethers } from 'ethers';

export const getContract = async (contractAddress, contractABI) => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum, {
            // Disable ENS for networks that don't support it
            ensAddress: null
        });
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        return contract;
    } catch (error) {
        console.error('Error in getContract:', error);
        throw new Error(`Failed to initialize contract: ${error.message}`);
    }
};

export const formatCertificateData = (data) => {
    return {
        fullName: data.fullName,
        ic: data.ic,
        age: parseInt(data.age),
        gender: data.gender,
        dateTimeOfDeath: Math.floor(new Date(data.dateTimeOfDeath).getTime() / 1000),
        race: data.race,
        lastAddress: data.lastAddress,
        placeOfDeath: data.placeOfDeath,
        causeOfDeath: data.causeOfDeath
    };
};