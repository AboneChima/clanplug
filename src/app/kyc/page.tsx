'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { 
  IoShieldCheckmarkOutline, 
  IoDocumentTextOutline,
  IoPersonOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

export default function KYCPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    idType: 'nin',
    idNumber: '',
    bvn: '',
  });
  const [files, setFiles] = useState<{
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idFront' | 'idBack' | 'selfie') => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [type]: e.target.files[0] });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState<'idFront' | 'idBack' | 'selfie' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Step 1: Upload documents to Cloudinary
      const uploadedUrls: { idFront?: string; idBack?: string; selfie?: string } = {};
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const formData = new FormData();
          formData.append('media', file);
          
          const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });
          
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            uploadedUrls[key as keyof typeof uploadedUrls] = data.data.urls[0];
          }
        }
      }

      // Step 2: Submit KYC with document URLs
      const kycData = {
        ...formData,
        idFrontUrl: uploadedUrls.idFront,
        idBackUrl: uploadedUrls.idBack,
        selfieUrl: uploadedUrls.selfie,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kycData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('KYC submitted successfully! We will review it within 24-48 hours.');
        window.location.reload();
      } else {
        alert(result.message || 'Failed to submit KYC');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      alert('Error submitting KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCamera = async (type: 'idFront' | 'idBack' | 'selfie') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: type === 'selfie' ? 'user' : 'environment' } 
      });
      setCameraStream(stream);
      setShowCamera(type);
    } catch (error) {
      alert('Camera access denied. Please allow camera access or upload a file.');
    }
  };

  const capturePhoto = () => {
    if (!cameraStream || !showCamera) return;

    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${showCamera}.jpg`, { type: 'image/jpeg' });
        setFiles({ ...files, [showCamera]: file });
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(null);
  };

  const isVerified = user?.isKYCVerified;

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <IoShieldCheckmarkOutline className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              KYC Verification
            </h1>
            <p className="text-gray-400">
              Complete your verification to unlock all features
            </p>
          </div>

          {isVerified ? (
            /* Verified State */
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-3xl p-8 text-center">
              <IoCheckmarkCircleOutline className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Verification Complete!</h2>
              <p className="text-gray-300">Your account is fully verified</p>
            </div>
          ) : (
            /* KYC Form */
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {s}
                    </div>
                    {s < 3 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                        step > s ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-3 sm:space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <IoPersonOutline className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                      <div className="grid grid-cols-3 gap-3">
                        <select
                          value={formData.dateOfBirth.split('-')[2] || ''}
                          onChange={(e) => {
                            const [year, month] = formData.dateOfBirth.split('-');
                            setFormData({ ...formData, dateOfBirth: `${year || '2000'}-${month || '01'}-${e.target.value.padStart(2, '0')}` });
                          }}
                          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        >
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <select
                          value={formData.dateOfBirth.split('-')[1] || ''}
                          onChange={(e) => {
                            const [year, , day] = formData.dateOfBirth.split('-');
                            setFormData({ ...formData, dateOfBirth: `${year || '2000'}-${e.target.value.padStart(2, '0')}-${day || '01'}` });
                          }}
                          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        >
                          <option value="">Month</option>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                            <option key={i} value={i + 1}>{month}</option>
                          ))}
                        </select>
                        <select
                          value={formData.dateOfBirth.split('-')[0] || ''}
                          onChange={(e) => {
                            const [, month, day] = formData.dateOfBirth.split('-');
                            setFormData({ ...formData, dateOfBirth: `${e.target.value}-${month || '01'}-${day || '01'}` });
                          }}
                          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        >
                          <option value="Nigeria">Nigeria</option>
                          <option value="Ghana">Ghana</option>
                          <option value="Kenya">Kenya</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: ID Verification */}
                {step === 2 && (
                  <div className="space-y-3 sm:space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <IoCardOutline className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">ID Verification</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">ID Type</label>
                      <select
                        name="idType"
                        value={formData.idType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      >
                        <option value="nin">National ID (NIN)</option>
                        <option value="passport">International Passport</option>
                        <option value="drivers">Driver's License</option>
                        <option value="voters">Voter's Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">ID Number</label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your ID number"
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">BVN (Optional)</label>
                      <input
                        type="text"
                        name="bvn"
                        value={formData.bvn}
                        onChange={handleInputChange}
                        placeholder="Bank Verification Number"
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex gap-3">
                        <IoAlertCircleOutline className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium text-blue-400 mb-1">Why we need this</p>
                          <p>We verify your identity to comply with regulations and keep your account secure.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Document Upload */}
                {step === 3 && (
                  <div className="space-y-3 sm:space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <IoDocumentTextOutline className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">Upload Documents</h3>
                    </div>

                    {showCamera ? (
                      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                        <div className="max-w-2xl w-full">
                          <video
                            id="camera-preview"
                            autoPlay
                            playsInline
                            ref={(video) => {
                              if (video && cameraStream) {
                                video.srcObject = cameraStream;
                              }
                            }}
                            className="w-full rounded-xl mb-4"
                          />
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                            >
                              Capture Photo
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {['idFront', 'idBack', 'selfie'].map((type) => (
                      <div key={type}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {type === 'idFront' ? 'ID Front' : type === 'idBack' ? 'ID Back' : 'Selfie with ID'}
                        </label>
                        {files[type as keyof typeof files] ? (
                          <div className="relative bg-gray-900/50 border border-gray-600 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <IoCheckmarkCircleOutline className="w-6 h-6 text-green-400" />
                                <span className="text-sm text-gray-300">{files[type as keyof typeof files]?.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFiles({ ...files, [type]: null })}
                                className="text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, type as any)}
                              className="hidden"
                              id={type}
                            />
                            <label
                              htmlFor={type}
                              className="flex flex-col items-center justify-center h-32 bg-gray-900/50 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-gray-900/70 transition-all"
                            >
                              <IoCloudUploadOutline className="w-6 h-6 text-gray-400 mb-1" />
                              <span className="text-xs text-gray-400">Upload File</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => startCamera(type as any)}
                              className="flex flex-col items-center justify-center h-32 bg-gray-900/50 border-2 border-dashed border-gray-600 rounded-xl hover:border-blue-500 hover:bg-gray-900/70 transition-all"
                            >
                              <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-xs text-gray-400">Use Camera</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-6">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all"
                    >
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !files.idFront || !files.idBack || !files.selfie}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </span>
                      ) : 'Submit for Verification'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
