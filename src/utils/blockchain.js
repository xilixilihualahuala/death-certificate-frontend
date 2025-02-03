// utils/blockchain.js
import { ethers } from 'ethers';
import { contractABI } from '../contractABI';

export const CONTRACTS = {
    DEATH_CERTIFICATE: {
        ADDRESS: '0xCd154e77d5Ba49A650f2955E8D83a7765743966e',
    }
};

class BlockchainService {
    static instance;
    static contract;
    static provider;
    static signer;

    static async initialize() {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
        }

        try {
            // Initialize provider
            this.provider = new ethers.BrowserProvider(window.ethereum);
            
            // Get signer
            this.signer = await this.provider.getSigner();
            
            // Initialize contract
            this.contract = new ethers.Contract(
                CONTRACTS.DEATH_CERTIFICATE.ADDRESS,
                contractABI,
                this.signer
            );

            // Set up event listener for account changes
            window.ethereum.on('accountsChanged', () => {
                this.handleAccountChange();
            });

            return this.contract;
        } catch (error) {
            console.error('Blockchain initialization error:', error);
            throw new Error(`Failed to initialize blockchain connection: ${error.message}`);
        }
    }

    static async handleAccountChange() {
        try {
            this.signer = await this.provider.getSigner();
            this.contract = new ethers.Contract(
                CONTRACTS.DEATH_CERTIFICATE.ADDRESS,
                contractABI,
                this.signer
            );
        } catch (error) {
            console.error('Account change handling error:', error);
        }
    }

    static async getContract() {
        if (!this.contract) {
            await this.initialize();
        }
        return this.contract;
    }

    static async getSigner() {
        if (!this.signer) {
            await this.initialize();
        }
        return this.signer;
    }

    // Utility methods for common contract interactions
    static async createCertificate(ic, ipfsCID, submitterAddress) {
        const contract = await this.getContract();
        const tx = await contract.createCertificate(ic, ipfsCID, submitterAddress);
        return tx.wait();
    }

    static async getCertificateMetadata(certificateId) {
        const contract = await this.getContract();
        return contract.getCertificateMetadata(certificateId);
    }

    static async generateCertificateId(ic) {
        const contract = await this.getContract();
        return contract.generateCertificateId(ic);
    }

    // Role management methods
    static async grantAuthorityRole(address) {
        const contract = await this.getContract();
        const tx = await contract.grantAuthorityRole(address);
        return tx.wait();
    }

    static async revokeAuthorityRole(address) {
        const contract = await this.getContract();
        const tx = await contract.revokeAuthorityRole(address);
        return tx.wait();
    }

    static async grantFamilyRole(address) {
        const contract = await this.getContract();
        const tx = await contract.grantFamilyRole(address);
        return tx.wait();
    }

    static async revokeFamilyRole(address) {
        const contract = await this.getContract();
        const tx = await contract.revokeFamilyRole(address);
        return tx.wait();
    }

    static async checkRoles(address) {
        const contract = await this.getContract();
        return contract.checkRoles(address);
    }
    
}

export default BlockchainService;