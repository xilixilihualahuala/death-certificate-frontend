import React, { useState } from 'react';
import BlockchainService from '../utils/blockchain';

const RetrieveCertificate = () => {
    const [ic, setIC] = useState('');
    const [certificateId, setCertificateId] = useState('');
    const [certificateMetadata, setCertificateMetadata] = useState(null);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    // Function to parse error messages
    const getErrorMessage = (error) => {
        if (error.message.includes('Certificate does not exist')) {
            return 'No certificate found for this IC number';
        }
        if (error.message.includes('Unauthorized access')) {
            return 'You are not authorized to view this certificate';
        }
        if (error.message.includes('execution reverted')) {
            // Extract custom error message if present
            const match = error.message.match(/reason="([^"]+)"/);
            return match ? match[1] : 'Transaction failed. Please try again.';
        }
        return 'An unexpected error occurred. Please try again.';
    };

    const handleRetrieve = async () => {
        if (!ic.trim()) {
            setError('Please enter an IC number');
            return;
        }

        setStatus('Processing...');
        setError('');
        setCertificateMetadata(null);
        
        try {
            const generatedId = await BlockchainService.generateCertificateId(ic);
            setCertificateId(generatedId);

            const metadata = await BlockchainService.getCertificateMetadata(generatedId);
            setCertificateMetadata({
                id: metadata.id,
                ipfsCID: metadata.ipfsCID,
                isValid: metadata.isValid,
                submitterAddress: metadata.submitterAddress,
                timestamp: new Date(Number(metadata.timestamp) * 1000).toLocaleString()
            });

            setStatus('Certificate retrieved successfully!');
        } catch (error) {
            console.error('Error:', error);
            setError(getErrorMessage(error));
            setStatus('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">View Death Certificate</h1>
    
            {/* Alert Messages */}
            {(error || status) && (
                <div className={`mb-4 p-4 rounded-lg ${
                    error 
                        ? 'bg-red-50 border-l-4 border-red-400 text-red-700'
                        : 'bg-blue-50 border-l-4 border-blue-400 text-blue-700'
                }`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {error ? (
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{error || status}</p>
                        </div>
                    </div>
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
                    className="w-full px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                    disabled={!ic.trim()}
                >
                    View Certificate
                </button>
            </div>
    
            {/* Certificate Details */}
            {certificateMetadata && (
                <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200 space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">Certificate Details</h2>
                    <div className="space-y-2 text-gray-600">
                        <p><span className="font-medium">Certificate ID:</span> {certificateId}</p>
                        <p><span className="font-medium">IPFS CID:</span> {certificateMetadata.ipfsCID}</p>
                        <p><span className="font-medium">Status:</span> 
                            <span className={certificateMetadata.isValid ? 'text-green-600' : 'text-red-600'}>
                                {certificateMetadata.isValid ? ' Valid' : ' Invalid'}
                            </span>
                        </p>
                        <p><span className="font-medium">Submitter Address:</span> {certificateMetadata.submitterAddress}</p>
                        <p><span className="font-medium">Timestamp:</span> {certificateMetadata.timestamp}</p>
                    </div>
                    <button
                        onClick={() => window.open(`https://ipfs.io/ipfs/${certificateMetadata.ipfsCID}`, '_blank')}
                        className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                        View Certificate on IPFS
                    </button>
                </div>
            )}
        </div>
    );
};

export default RetrieveCertificate;