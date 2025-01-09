import React, { useState } from 'react';
import axios from 'axios';

const PINATA_API_KEY = 'd5cf5f85350e35c53b62';
const PINATA_SECRET_KEY = '0a94733425b1f56f354641765314782f13314bc2b89a3a9228a66343b5630fc4';

const DeathCertificateForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        ic: '',
        age: '',
        gender: '',
        dateTimeOfDeath: '',
        race: '',
        lastAddress: '',
        placeOfDeath: '',
        causeOfDeath: ''
    });
    const [status, setStatus] = useState('');
    const [ipfsCID, setIpfsCID] = useState('');

    const formatCertificateData = (data) => {
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

    const uploadToPinata = async (jsonData) => {
        try {
            console.log('Uploading JSON data to Pinata:', jsonData);
            const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
            const response = await axios.post(url, jsonData, {
                headers: {
                    'Content-Type': 'application/json',
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
            });
            console.log('Pinata response:', response.data);
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading to Pinata:', error.response ? error.response.data : error.message);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Processing...');
        
        try {
            const formattedData = formatCertificateData(formData);
            const cid = await uploadToPinata(formattedData);
            setIpfsCID(cid);
            setStatus('Data uploaded to IPFS successfully! CID: ' + cid);
            
            // Clear form
            setFormData({
                fullName: '',
                ic: '',
                age: '',
                gender: '',
                dateTimeOfDeath: '',
                race: '',
                lastAddress: '',
                placeOfDeath: '',
                causeOfDeath: ''
            });
        } catch (error) {
            console.error('Error uploading data:', error);
            setStatus('Error: ' + error.message);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Rest of your form JSX remains the same, but let's add CID display
    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Create Death Certificate</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">IC Number</label>
                <input
                type="text"
                name="ic"
                value={formData.ic}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Date and Time of Death</label>
                <input
                type="datetime-local"
                name="dateTimeOfDeath"
                value={formData.dateTimeOfDeath}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Race</label>
                <input
                type="text"
                name="race"
                value={formData.race}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Last Address</label>
                <input
                type="text"
                name="lastAddress"
                value={formData.lastAddress}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Place of Death</label>
                <input
                type="text"
                name="placeOfDeath"
                value={formData.placeOfDeath}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Cause of Death</label>
                <input
                type="text"
                name="causeOfDeath"
                value={formData.causeOfDeath}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                />
            </div>
            <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
                Submit
            </button>
            </form>
            
            {status && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    {status}
                </div>
            )}
            
            {ipfsCID && (
                <div className="mt-4 p-4 bg-green-100 rounded">
                    <p className="font-medium">IPFS CID (for admin use):</p>
                    <p className="font-mono break-all">{ipfsCID}</p>
                </div>
            )}
        </div>
    );
};

export default DeathCertificateForm;