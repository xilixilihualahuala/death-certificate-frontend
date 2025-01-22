import { ethers } from 'ethers';

export const getContract = async (contractAddress, contractABI) => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create a provider (remove the ensAddress option)
        const provider = new ethers.BrowserProvider(window.ethereum);

        // Get the signer
        const signer = await provider.getSigner();

        // Initialize the contract
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