import React, { useState } from 'react';
import BlockchainService from '../utils/blockchain';

const RetrieveCertificate = () => {
    const [ic, setIC] = useState('');
    const [certificateId, setCertificateId] = useState('');
    const [certificateMetadata, setCertificateMetadata] = useState(null);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    // Modify the handleRetrieve function
    const handleRetrieve = async () => {
        setStatus('Processing...');
        setError(''); // Clear any previous errors
        
        try {
            const generatedId = await BlockchainService.generateCertificateId(ic);
            setCertificateId(generatedId);

            // Get certificate metadata
            const metadata = await BlockchainService.getCertificateMetadata(generatedId);
            setCertificateMetadata({
                id: metadata.id,
                ipfsCID: metadata.ipfsCID,
                isValid: metadata.isValid,
                submitterAdress: metadata.submitterAddress,
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
                    className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                >
                    View Certificate
                </button>
            </div>
    
            {/* Certificate Details */}
            {certificateMetadata && (
                <div className="mt-4 p-4 bg-green-100 rounded space-y-2">
                    <h2 className="font-semibold">Certificate Details:</h2>
                    <p>Certificate ID: {certificateId}</p>
                    <p>IPFS CID: {certificateMetadata.ipfsCID}</p>
                    <p>Status: {certificateMetadata.isValid ? 'Valid' : 'Invalid'}</p>
                    <p>Submitter Address: {certificateMetadata.submitterAdress}</p>
                    <p>Timestamp: {certificateMetadata.timestamp}</p>
                    <button
                        onClick={() => {
                            const ipfsUrl = `https://ipfs.io/ipfs/${certificateMetadata.ipfsCID}`;
                            window.open(ipfsUrl, '_blank'); // Redirect to the IPFS URL
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                        View Certificate on IPFS
                    </button>
                </div>
            )}
        </div>
    );
};

export default RetrieveCertificate;