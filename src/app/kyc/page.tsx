'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import LivenessDetection from '@/components/LivenessDetection';
import { 
  IoShieldCheckmarkOutline, 
  IoDocumentTextOutline,
  IoPersonOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoAlertCircleOutline,
  IoCameraOutline,
  IoFlashOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5';

export default function KYCPage() {
  const { user, refetchUser } = useAuth();
  const [kycStatus, setKycStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationType, setVerificationType] = useState<'liveness' | 'nin' | null>(null);
  const [showLiveness, setShowLiveness] = useState(false);
  const [livenessPhotos, setLivenessPhotos] = useState<any>(null);
  const [step, setStep] = useState(1);

  // Check KYC status on mount and when user changes
  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // First check if user.isKYCVerified is true
        if (user?.isKYCVerified) {
          setKycStatus('APPROVED');
          setLoading(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.status) {
            setKycStatus(data.data.status);
          }
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkKycStatus();
  }, [user?.isKYCVerified]);
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
          formData.append('isKYCUpload', 'true'); // Flag for KYC uploads
          
          const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });
          
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            uploadedUrls[key as keyof typeof uploadedUrls] = data.data.urls[0];
          } else {
            const errorData = await uploadRes.json();
            throw new Error(errorData.message || 'Failed to upload document');
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
        setKycStatus('PENDING');
        alert('KYC submitted successfully! We will review it within 24-48 hours.');
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

  const isVerified = user?.isKYCVerified || kycStatus === 'APPROVED';

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-3 sm:py-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading KYC status...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-3 sm:py-6">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* Header - Compact on mobile */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 shadow-lg">
              <IoShieldCheckmarkOutline className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
              KYC Verification
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Complete verification to unlock features
            </p>
          </div>

          {isVerified ? (
            /* Verified State */
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
              <IoCheckmarkCircleOutline className="w-16 h-16 sm:w-20 sm:h-20 text-green-400 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Verification Complete!</h2>
              <p className="text-sm sm:text-base text-gray-300">Your account is fully verified</p>
            </div>
          ) : kycStatus === 'PENDING' ? (
            /* Pending State */
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
              <IoTimeOutline className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">KYC Submitted Successfully!</h2>
              <p className="text-sm sm:text-base text-gray-300 mb-4">Your verification is pending admin approval</p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-left">
                <div className="flex gap-3">
                  <IoAlertCircleOutline className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-yellow-400 mb-1">What's next?</p>
                    <p>Our team will review your submission within 24-48 hours. You'll receive a notification once your verification is complete.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : kycStatus === 'REJECTED' ? (
            /* Rejected State */
            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
              <IoCloseCircleOutline className="w-16 h-16 sm:w-20 sm:h-20 text-red-400 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Verification Rejected</h2>
              <p className="text-sm sm:text-base text-gray-300 mb-4">Your KYC submission was not approved</p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left mb-4">
                <div className="flex gap-3">
                  <IoAlertCircleOutline className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-red-400 mb-1">Common reasons for rejection:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      <li>Blurry or unclear photos</li>
                      <li>Documents not fully visible</li>
                      <li>Information mismatch</li>
                      <li>Expired documents</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setKycStatus(null);
                  setVerificationType(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                Submit Again
              </button>
            </div>
          ) : !verificationType ? (
            /* Verification Type Selection */
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Choose Verification Method</h2>
                <p className="text-gray-400">Select how you'd like to verify your account</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Liveness Detection Option */}
                <button
                  onClick={() => {
                    setVerificationType('liveness');
                    setShowLiveness(true);
                  }}
                  className="group relative bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl p-6 text-left transition-all transform hover:scale-105 shadow-xl"
                >
                  <div className="absolute top-4 right-4">
                    <IoCameraOutline className="w-8 h-8 text-white/80" />
                  </div>
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white mb-3">
                      <IoFlashOutline className="w-4 h-4" />
                      RECOMMENDED
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Face Verification</h3>
                    <p className="text-blue-100 text-sm mb-4">Quick & Easy - No documents needed</p>
                  </div>
                  <div className="space-y-2 text-sm text-blue-50">
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />
                      <span>Takes only 2 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />
                      <span>No NIN or BVN required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />
                      <span>Transaction limit: ₦500,000/day</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <span className="text-white font-semibold">Start Face Verification →</span>
                  </div>
                </button>

                {/* Full KYC Option */}
                <button
                  onClick={() => setVerificationType('nin')}
                  className="group relative bg-gradient-to-br from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-2xl p-6 text-left transition-all transform hover:scale-105 shadow-xl"
                >
                  <div className="absolute top-4 right-4">
                    <IoDocumentTextOutline className="w-8 h-8 text-white/80" />
                  </div>
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white mb-3">
                      <IoShieldCheckmarkOutline className="w-4 h-4" />
                      FULL KYC
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Document Verification</h3>
                    <p className="text-green-100 text-sm mb-4">Complete KYC with NIN or BVN</p>
                  </div>
                  <div className="space-y-2 text-sm text-green-50">
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />
                      <span>Unlimited transactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />
                      <span>Higher trust level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />
                      <span>Requires NIN or BVN</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <span className="text-white font-semibold">Start Full KYC →</span>
                  </div>
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
                <div className="flex gap-3">
                  <IoAlertCircleOutline className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-1">Why verify?</p>
                    <p>Verification helps protect your account and enables higher transaction limits. Choose the method that works best for you!</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* KYC Form */
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
              {/* Progress Steps - Compact */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all ${
                      step >= s 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {s}
                    </div>
                    {s < 3 && (
                      <div className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded-full transition-all ${
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

      {/* Liveness Detection Modal */}
      {showLiveness && (
        <LivenessDetection
          onComplete={async (photos) => {
            setLivenessPhotos(photos);
            setShowLiveness(false);
            
            try {
              const token = localStorage.getItem('accessToken');
              
              // Convert base64 to blob and upload each photo
              const uploadPhoto = async (base64Data: string, filename: string) => {
                const blob = await fetch(base64Data).then(r => r.blob());
                const file = new File([blob], filename, { type: 'image/jpeg' });
                
                const formData = new FormData();
                formData.append('media', file);
                formData.append('isKYCUpload', 'true'); // Flag for KYC uploads
                
                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData,
                });
                
                if (uploadRes.ok) {
                  const data = await uploadRes.json();
                  return data.data.urls[0];
                }
                const errorData = await uploadRes.json();
                throw new Error(errorData.message || 'Upload failed');
              };

              // Upload all 4 photos
              alert('Uploading photos... Please wait.');
              const [frontUrl, smileUrl, leftUrl, rightUrl] = await Promise.all([
                uploadPhoto(photos.front, 'liveness-front.jpg'),
                uploadPhoto(photos.smile, 'liveness-smile.jpg'),
                uploadPhoto(photos.left, 'liveness-left.jpg'),
                uploadPhoto(photos.right, 'liveness-right.jpg'),
              ]);

              // Submit KYC with liveness photos
              const kycData = {
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                verificationType: 'liveness',
                livenessFrontUrl: frontUrl,
                livenessSmileUrl: smileUrl,
                livenessLeftUrl: leftUrl,
                livenessRightUrl: rightUrl,
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
                setKycStatus('PENDING');
                alert('✅ Face verification submitted successfully! We will review it within 24 hours.');
              } else {
                alert(result.message || 'Failed to submit verification');
              }
            } catch (error) {
              console.error('Upload error:', error);
              alert('Failed to upload photos. Please try again.');
            }
          }}
          onCancel={() => {
            setShowLiveness(false);
            setVerificationType(null);
          }}
        />
      )}
    </AppShell>
  );
}
