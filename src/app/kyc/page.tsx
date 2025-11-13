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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement KYC submission
    console.log('KYC Data:', formData, files);
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

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
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
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  <div className="space-y-6 animate-fade-in">
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
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <IoDocumentTextOutline className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">Upload Documents</h3>
                    </div>

                    {['idFront', 'idBack', 'selfie'].map((type) => (
                      <div key={type}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {type === 'idFront' ? 'ID Front' : type === 'idBack' ? 'ID Back' : 'Selfie with ID'}
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleFileChange(e, type as any)}
                            className="hidden"
                            id={type}
                          />
                          <label
                            htmlFor={type}
                            className="flex flex-col items-center justify-center w-full h-32 bg-gray-900/50 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-gray-900/70 transition-all"
                          >
                            <IoCloudUploadOutline className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-400">
                              {files[type as keyof typeof files]?.name || 'Click to upload'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">Image or Video (Max 10MB)</span>
                          </label>
                        </div>
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
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                    >
                      Submit for Verification
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
