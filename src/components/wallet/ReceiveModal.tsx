"use client";

import { useState, useEffect } from 'react';
import { IoClose, IoQrCode, IoCopy, IoCheckmark } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<'NGN'>('NGN');
  const [copied, setCopied] = useState(false);
  
  // Generate a wallet address based on user ID and currency
  const walletAddress = user ? `${user.id.slice(0, 8)}-${currency}-${user.id.slice(-8)}` : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <IoQrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Receive Funds</h2>
              <p className="text-sm text-gray-600">Share your wallet address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <IoClose className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded-xl border-2 border-green-500 bg-green-50 text-green-700">
                <div className="font-semibold">NGN</div>
                <div className="text-xs text-gray-500">Nigerian Naira</div>
              </div>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <IoQrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">QR Code</p>
                <p className="text-xs text-gray-400">Coming Soon</p>
              </div>
            </div>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your {currency} Wallet Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={walletAddress}
                readOnly
                className="w-full pr-12 py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 text-sm font-mono text-gray-900"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copied ? (
                  <IoCheckmark className="w-5 h-5 text-green-600" />
                ) : (
                  <IoCopy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Address copied to clipboard!</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">How to receive funds:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share this address with the sender</li>
              <li>• Or show them the QR code to scan</li>
              <li>• Funds will appear in your wallet once confirmed</li>
              <li>• Only send {currency} to this address</li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}