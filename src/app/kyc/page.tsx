'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  IoShieldCheckmarkOutline, 
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoCameraOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoCheckmarkOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';
import Image from 'next/image';

export default function KYCPage() {
  const { user, refetchUser } = useAuth();
  const { showToast } = useToast();
  const [kycStatus, setKycStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [ninImage, setNinImage] = useState<File | null>(null);
  const [ninImagePreview, setNinImagePreview] = useState<string | null>(null);
  const [selfies, setSelfies] = useState<File[]>([]);
  const [selfiePreviews, setSelfiePreviews] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ninInputRef = React.useRef<HTMLInputElement>(null);

  // Check KYC status
  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.status) {
            setKycStatus(data.data.status);
          } else if (user?.isKYCVerified) {
            setKycStatus('APPROVED');
          }
        } else if (user?.isKYCVerified) {
          setKycStatus('APPROVED');
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
        if (user?.isKYCVerified) {
          setKycStatus('APPROVED');
        }
      } finally {
        setLoading(false);
      }
    };

    checkKycStatus();
  }, [user?.isKYCVerified]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => showToast('Cannot start video', 'error'));
        }
      }, 100);
    } catch (error) {
      showToast('Cannot access camera', 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setShowCamera(false);
  };

  const handleNinImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      setNinImage(file);
      setNinImagePreview(URL.createObjectURL(file));
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || selfies.length >= 3) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `selfie-${selfies.length + 1}.jpg`, { type: 'image/jpeg' });
          setSelfies([...selfies, file]);
          setSelfiePreviews([...selfiePreviews, URL.createObjectURL(file)]);
          showToast(`Photo ${selfies.length + 1}/3 captured!`, 'success');
          
          if (selfies.length + 1 >= 3) {
            stopCamera();
          }
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const removeSelfie = (index: number) => {
    setSelfies(selfies.filter((_, i) => i !== index));
    setSelfiePreviews(selfiePreviews.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('isKYCUpload', 'true');

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload file');
    const data = await response.json();
    return data.data.url;
  };

  const handleSubmit = async () => {
    if (!ninImage || selfies.length < 3) {
      showToast('Please complete all steps', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload NIN image and all selfies
      const ninUrl = await uploadFile(ninImage);
      const selfieUrls = await Promise.all(selfies.map(file => uploadFile(file)));

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          idType: 'nin',
          idNumber: 'NIN_IMAGE_UPLOAD',
          documentImages: [ninUrl],
          selfieUrl: selfieUrls[0],
          selfieUrl2: selfieUrls[1],
          selfieUrl3: selfieUrls[2],
          phoneNumber: user?.phoneNumber || '',
          address: user?.address || 'N/A',
          dateOfBirth: user?.dateOfBirth || '2000-01-01',
        }),
      });

      if (response.ok) {
        setKycStatus('PENDING');
        showToast('KYC submitted successfully!', 'success');
        refetchUser();
      } else {
        const result = await response.json();
        showToast(result.message || 'Failed to submit KYC', 'error');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      showToast('Error submitting KYC. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = kycStatus === 'APPROVED' && user?.isKYCVerified;

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-black pb-20 lg:pb-8">
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#2f3336] px-4 py-3">
          <h1 className="text-xl font-bold text-white">KYC Verification</h1>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {isVerified ? (
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6 text-center max-w-xs mx-auto shadow-lg shadow-green-500/5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <IoCheckmarkCircleOutline className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Verified</h2>
              <p className="text-gray-400 text-sm">Your account is verified</p>
            </div>
          ) : kycStatus === 'PENDING' ? (
            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-6 text-center max-w-xs mx-auto shadow-lg shadow-yellow-500/5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <IoTimeOutline className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Under Review</h2>
              <p className="text-gray-400 text-sm">We're reviewing your submission</p>
            </div>
          ) : kycStatus === 'REJECTED' ? (
            <div className="bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20 rounded-2xl p-6 text-center max-w-xs mx-auto shadow-lg shadow-red-500/5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <IoCloseCircleOutline className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Verification Failed</h2>
              <p className="text-gray-400 text-sm mb-4">Your submission was not approved</p>
              <button
                onClick={() => {
                  setKycStatus(null);
                  setCurrentStep(1);
                  setNinImage(null);
                  setNinImagePreview(null);
                  setSelfies([]);
                  setSelfiePreviews([]);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              {/* Progress */}
              <div className="mb-8 flex items-center justify-between max-w-xs mx-auto">
                {[1, 2].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all shadow-lg ${
                        currentStep >= step 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/30' 
                          : 'bg-[#2a2a2a] text-gray-500 shadow-black/20'
                      }`}>
                        {currentStep > step ? <IoCheckmarkOutline className="w-5 h-5" /> : step}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${currentStep >= step ? 'text-blue-400' : 'text-gray-600'}`}>
                        {step === 1 ? 'NIN' : 'Selfies'}
                      </span>
                    </div>
                    {step < 2 && <div className={`flex-1 h-1 mx-3 rounded-full transition-all ${currentStep > step ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-[#2a2a2a]'}`} />}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: NIN Image Upload */}
              {currentStep === 1 && (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-2xl p-6 border border-[#2f3336] shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-700/10 flex items-center justify-center shadow-inner">
                      <IoDocumentTextOutline className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">NIN Verification</h3>
                      <p className="text-xs text-gray-400">Upload or capture your NIN card</p>
                    </div>
                  </div>

                  {/* Warning Note */}
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <IoInformationCircleOutline className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-300">
                      <p className="font-semibold mb-1">Important:</p>
                      <p>Ensure good lighting and all text on your NIN card is clearly visible. Avoid shadows and glare.</p>
                    </div>
                  </div>

                  {ninImagePreview ? (
                    <div className="relative mb-4">
                      <Image 
                        src={ninImagePreview} 
                        alt="NIN Card" 
                        width={400} 
                        height={250} 
                        className="w-full h-48 object-cover rounded-xl border border-[#2f3336]" 
                        unoptimized 
                      />
                      <button
                        onClick={() => {
                          setNinImage(null);
                          setNinImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 rounded-lg transition-all"
                      >
                        <IoCloseCircleOutline className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      <input
                        ref={ninInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleNinImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => ninInputRef.current?.click()}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-lg shadow-blue-500/20"
                      >
                        <IoCameraOutline className="w-6 h-6" />
                        Capture NIN Card with Camera
                      </button>
                      <p className="text-center text-xs text-gray-500">
                        Click to open camera and take a photo of your NIN card
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!ninImage}
                    className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Continue <IoArrowForwardOutline />
                  </button>
                </div>
              )}

              {/* Step 2: 3 Selfies */}
              {currentStep === 2 && (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-2xl p-6 border border-[#2f3336] shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-700/10 flex items-center justify-center shadow-inner">
                      <IoCameraOutline className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Take 3 Selfies</h3>
                      <p className="text-xs text-gray-400">{selfies.length}/3 captured</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <IoInformationCircleOutline className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-300">
                      <p className="font-semibold mb-1">Important Tips:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-400">
                        <li>Ensure good lighting</li>
                        <li>Face the camera directly</li>
                        <li>Remove glasses/hats</li>
                        <li>Take from different angles</li>
                      </ul>
                    </div>
                  </div>

                  {selfiePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {selfiePreviews.map((preview, i) => (
                        <div key={i} className="relative group">
                          <Image src={preview} alt={`Selfie ${i+1}`} width={150} height={150} className="w-full h-28 object-cover rounded-xl border border-[#2f3336]" unoptimized />
                          <button onClick={() => removeSelfie(i)} className="absolute top-1 right-1 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-lg transition-all shadow-lg opacity-0 group-hover:opacity-100">
                            <IoCloseCircleOutline className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showCamera ? (
                    <div className="relative bg-black rounded-xl overflow-hidden mb-4 border border-[#2f3336]">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        <button onClick={capturePhoto} disabled={selfies.length >= 3} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white text-sm rounded-full font-semibold shadow-lg transition-all">
                          Capture
                        </button>
                        <button onClick={stopCamera} className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white text-sm rounded-full font-semibold shadow-lg transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : selfies.length < 3 && (
                    <button onClick={startCamera} className="w-full h-40 border-2 border-dashed border-[#3a3a3a] rounded-xl hover:border-blue-500 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-2 mb-4 transition-all">
                      <IoCameraOutline className="w-10 h-10 text-gray-500" />
                      <p className="text-sm text-gray-400 font-medium">Start Camera</p>
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setCurrentStep(1)} className="flex-1 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-lg">
                      <IoArrowBackOutline /> Back
                    </button>
                    <button onClick={handleSubmit} disabled={selfies.length < 3 || isSubmitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-lg shadow-blue-500/20">
                      {isSubmitting ? 'Submitting...' : (<><IoCheckmarkCircleOutline /> Submit</>)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
