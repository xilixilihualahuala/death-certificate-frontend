import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import '../../src/index.css'; 
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AuthContext } from '../App'; 
import { addPendingCertificate } from '../utils/pendingStorage';

const PINATA_API_KEY = 'd5cf5f85350e35c53b62';
const PINATA_SECRET_KEY = '0a94733425b1f56f354641765314782f13314bc2b89a3a9228a66343b5630fc4';

const DeathCertificateForm = () => {
    const { account } = useContext(AuthContext); // Get the account
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
    
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('');
    const [ipfsCID, setIpfsCID] = useState('');
    const [maxDateTime, setMaxDateTime] = useState('');

    // Set max date-time to current date and time
    useEffect(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        now.setMinutes(now.getMinutes() - offset);
        setMaxDateTime(now.toISOString().slice(0, 16));
    }, []);

    const validateForm = () => {
        const newErrors = {};
        
        // Check if all required fields are filled
        const requiredFields = Object.keys(formData);
        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = 'This field is required';
            }
        });

        // IC validation (12 digits)
        if (formData.ic) {
            if (!/^\d{12}$/.test(formData.ic)) {
                newErrors.ic = 'IC number must be exactly 12 digits';
            }
        }

        // Age validation (positive number)
        if (formData.age) {
            const ageNum = parseInt(formData.age);
            if (isNaN(ageNum) || ageNum <= 0 || ageNum > 150) {
                newErrors.age = 'Age must be a positive number between 1 and 150';
            }
        }

        // Date and time validation (not in future)
        if (formData.dateTimeOfDeath) {
            const deathDate = new Date(formData.dateTimeOfDeath);
            const now = new Date();
            if (deathDate > now) {
                newErrors.dateTimeOfDeath = 'Date and time cannot be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const formatCertificateData = (data) => {
        return {
            fullName: data.fullName.trim(),
            ic: data.ic,
            age: parseInt(data.age),
            gender: data.gender,
            dateTimeOfDeath: Math.floor(new Date(data.dateTimeOfDeath).getTime() / 1000),
            race: data.race,
            lastAddress: data.lastAddress.trim(),
            placeOfDeath: data.placeOfDeath.trim(),
            causeOfDeath: data.causeOfDeath.trim()
        };
    };

    const generatePDF = async (data) => {
        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595.276, 841.890]); // A4 size
            const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            const fontSize = 12;

            let signatureImage;
            try {
                const signatureImageResponse = await fetch('./signature.png');
                if (!signatureImageResponse.ok) {
                    throw new Error(`HTTP error! status: ${signatureImageResponse.status}`);
                }
                const signatureImageBytes = await signatureImageResponse.arrayBuffer();
                signatureImage = await pdfDoc.embedPng(signatureImageBytes);
            } catch (signatureError) {
                console.error('Failed to load signature:', signatureError);
                // Continue without signature
            }

            // Calculate signature image dimensions (adjust as needed)
            const signatureWidth = 100; // Adjust based on your image
            const signatureHeight = 50; // Adjust based on your image

            // Add title
            page.drawText('DEATH CERTIFICATE', {
                x: 200,
                y: 800,
                size: 20,
                font,
                color: rgb(0, 0, 0),
            });

            // Format date for display
            const deathDate = new Date(data.dateTimeOfDeath * 1000);
            const formattedDate = deathDate.toLocaleString();

            // Add certificate content
            const content = [
                { label: 'Full Name:', value: data.fullName },
                { label: 'IC Number:', value: data.ic },
                { label: 'Age:', value: `${data.age} years` },
                { label: 'Gender:', value: data.gender },
                { label: 'Date and Time of Death:', value: formattedDate },
                { label: 'Race:', value: data.race },
                { label: 'Last Address:', value: data.lastAddress },
                { label: 'Place of Death:', value: data.placeOfDeath },
                { label: 'Cause of Death:', value: data.causeOfDeath },
                { label: 'MetaMask Address:', value: account }
            ];

            let yPosition = 700;
            content.forEach(({ label, value }) => {
                page.drawText(`${label} ${value}`, {
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
                yPosition -= 30;
            });

            // Add certification statement
            page.drawText('Certified as a true extract from the Register Death', {
                x: 50,
                y: 300,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });

            // Draw signature image
            page.drawImage(signatureImage, {
                x: 50,
                y: 210,
                width: signatureWidth,
                height: signatureHeight,
            });

            // Add signature line
            page.drawLine({
                start: { x: 50, y: 200 },
                end: { x: 200, y: 200 },
                thickness: 1,
                color: rgb(0, 0, 0),
            });

            // Add date of certification
            const certificationDate = new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });            
            page.drawText(`Date: ${certificationDate}`, {
                x: 50,
                y: 180,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });

            return await pdfDoc.save();
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    }
    };

    const uploadToPinata = async (data) => {
        try {
            const pdfBytes = await generatePDF(data);
            
            const formData = new FormData();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            formData.append('file', blob, 'death_certificate.pdf');
    
            const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });
    
            if (!response.data || !response.data.IpfsHash) {
                throw new Error('Invalid response from Pinata');
            }
    
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Pinata upload error:', error);
            if (error.response) {
                throw new Error(`Pinata API error: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('No response received from Pinata');
            } else {
                throw new Error(`Upload error: ${error.message}`);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setStatus('Please fix the errors before submitting.');
            return;
        }

        setStatus('Processing...');
        
        try {
            const formattedData = formatCertificateData(formData);
            const cid = await uploadToPinata(formattedData);
            setIpfsCID(cid);

            addPendingCertificate(formData.ic, cid);
            setStatus('');
    
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
            setStatus('Error: ' + error.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Clear error when field is edited
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Create Death Certificate</h1>
            <h6>Connected Metamask: {account}</h6>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">IC Number</label>
                    <input
                        type="text"
                        name="ic"
                        value={formData.ic.trim()}
                        onChange={handleChange}
                        maxLength={12}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.ic ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter 12 digit IC number"
                    />
                    {errors.ic && (
                        <p className="text-red-500 text-sm mt-1">{errors.ic}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                        type="number"
                        name="age"
                        value={formData.age.trim()}
                        onChange={handleChange}
                        min="1"
                        max="150"
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.age ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.gender ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Date and Time of Death</label>
                    <input
                        type="datetime-local"
                        name="dateTimeOfDeath"
                        value={formData.dateTimeOfDeath}
                        onChange={handleChange}
                        max={maxDateTime}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.dateTimeOfDeath ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.dateTimeOfDeath && (
                        <p className="text-red-500 text-sm mt-1">{errors.dateTimeOfDeath}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Race</label>
                    <select
                        name="race"
                        value={formData.race}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.race ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Race</option>
                        <option value="Malays">Malays</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Indians">Indians</option>
                        <option value="Others">Others</option>
                        <option value="Non-Malaysian Resident">Non-Malaysian Resident</option>
                    </select>
                    {errors.race && <p className="text-red-500 text-sm mt-1">{errors.race}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Last Address</label>
                    <input
                        type="text"
                        name="lastAddress"
                        value={formData.lastAddress}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.lastAddress ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.lastAddress && <p className="text-red-500 text-sm mt-1">{errors.lastAddress}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Place of Death</label>
                    <input
                        type="text"
                        name="placeOfDeath"
                        value={formData.placeOfDeath}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.placeOfDeath ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.placeOfDeath && <p className="text-red-500 text-sm mt-1">{errors.placeOfDeath}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Cause of Death</label>
                    <input
                        type="text"
                        name="causeOfDeath"
                        value={formData.causeOfDeath}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                            errors.causeOfDeath ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.causeOfDeath && <p className="text-red-500 text-sm mt-1">{errors.causeOfDeath}</p>}
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    Submit
                </button>
            </form>
            
            {status && (
                <div className={`mt-4 p-4 rounded ${
                    status.startsWith('Error') ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                    {status}
                </div>
            )}
            
            {(
                <div className="mt-4 p-4 bg-green-100 rounded">
                    <p className="font-medium">Death Certificate submitted successfully! Please wait for admin to verify it.</p>
                </div>
            )}
        </div>
    );
};

export default DeathCertificateForm;