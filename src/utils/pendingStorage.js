// Create a new file: src/utils/pendingStorage.js

// This will store our pending CIDs
let pendingCertificates = [];

// Try to load initial data from localStorage on module load
try {
    const saved = localStorage.getItem('pendingCertificates');
    if (saved) {
        pendingCertificates = JSON.parse(saved);
    }
} catch (error) {
    console.error('Error loading pending certificates:', error);
}

// Function to save to localStorage
const saveToStorage = () => {
    try {
        localStorage.setItem('pendingCertificates', JSON.stringify(pendingCertificates));
    } catch (error) {
        console.error('Error saving pending certificates:', error);
    }
};

// Get all pending certificates
export const getPendingCertificates = () => {
    return [...pendingCertificates]; // Return a copy to prevent direct mutations
};

// Add a new pending certificate
export const addPendingCertificate = (ic, cid, submitterAddress) => {
    pendingCertificates.push({
        ic,
        cid,
        timestamp: Date.now(),
        submitterAddress,
        status: 'pending'
    });
    saveToStorage();
    return true;
};

// Remove a certificate after verification
export const removePendingCertificate = (cid) => {
    pendingCertificates = pendingCertificates.filter(cert => cert.cid !== cid);
    saveToStorage();
    return true;
};

// Update certificate status
export const updateCertificateStatus = (cid, status) => {
    const cert = pendingCertificates.find(cert => cert.cid === cid);
    if (cert) {
        cert.status = status;
        saveToStorage();
        return true;
    }
    return false;
};