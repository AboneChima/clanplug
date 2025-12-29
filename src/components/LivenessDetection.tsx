'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  IoCamera,
  IoCheckmarkCircle,
  IoClose,
  IoRefreshOutline,
  IoWarning,
} from 'react-icons/io5';

interface LivenessDetectionProps {
  onComplete: (photos: { front: string; smile: string; left: string; right: string }) => void;
  onCancel: () => void;
}

type Step = 'front' | 'smile' | 'left' | 'right' | 'complete';

const STEP_INSTRUCTIONS = {
  front: {
    title: 'Look at the Camera',
    instruction: 'Position your face in the center',
    icon: '👤',
    voice: 'Please look at the camera',
  },
  smile: {
    title: 'Smile!',
    instruction: 'Give us a big smile',
    icon: '😊',
    voice: 'Please smile',
  },
  left: {
    title: 'Turn Left',
    instruction: 'Slowly turn your head to the left',
    icon: '👈',
    voice: 'Please turn your head to the left',
  },
  right: {
    title: 'Turn Right',
    instruction: 'Slowly turn your head to the right',
    icon: '👉',
    voice: 'Please turn your head to the right',
  },
  complete: {
    title: 'All Done!',
    instruction: 'Processing your verification...',
    icon: '✅',
    voice: 'Verification complete',
  },
};

export default function LivenessDetection({ onComplete, onCancel }: LivenessDetectionProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('front');
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Voice command function
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Simple face detection using video dimensions
  const detectFace = useCallback(() => {
    if (!videoRef.current || !cameraReady) return false;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return false;

    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple brightness check in center area (where face should be)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const checkRadius = Math.min(canvas.width, canvas.height) / 4;

    let brightPixels = 0;
    let totalPixels = 0;

    for (let y = centerY - checkRadius; y < centerY + checkRadius; y += 5) {
      for (let x = centerX - checkRadius; x < centerX + checkRadius; x += 5) {
        const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 50) brightPixels++;
        totalPixels++;
      }
    }

    // If center area has enough bright pixels, assume face is present
    const facePresent = (brightPixels / totalPixels) > 0.3;
    return facePresent;
  }, [cameraReady]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraReady(true);
        
        // Speak instruction for current step
        const stepInfo = STEP_INSTRUCTIONS[currentStep];
        setTimeout(() => speak(stepInfo.voice), 500);
        
        // Start face detection
        detectionIntervalRef.current = setInterval(() => {
          const detected = detectFace();
          setFaceDetected(detected);
          
          // Auto-capture when face is detected and not already capturing
          if (detected && !autoCapturing && countdown === null) {
            setAutoCapturing(true);
            startCountdown();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showToast('Failed to access camera. Please allow camera permissions.', 'error');
    }
  }, [showToast, currentStep, speak, detectFace, autoCapturing, countdown]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      setPhotos(prev => ({ ...prev, [currentStep]: photoData }));
      
      // Move to next step
      const steps: Step[] = ['front', 'smile', 'left', 'right', 'complete'];
      const currentIndex = steps.indexOf(currentStep);
      const nextStep = steps[currentIndex + 1];
      
      if (nextStep === 'complete') {
        stopCamera();
        setCurrentStep('complete');
        speak('Verification complete');
        
        // Call onComplete with all photos
        setTimeout(() => {
          onComplete({
            front: photos.front || photoData,
            smile: photos.smile || '',
            left: photos.left || '',
            right: photos.right || '',
          });
        }, 1000);
      } else {
        setCurrentStep(nextStep);
        setAutoCapturing(false);
        setFaceDetected(false);
        
        // Speak next instruction
        const stepInfo = STEP_INSTRUCTIONS[nextStep];
        setTimeout(() => speak(stepInfo.voice), 500);
      }
    }
  }, [currentStep, photos, stopCamera, onComplete, speak]);

  const startCountdown = useCallback(() => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [capturePhoto]);

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  const handleRetake = () => {
    setPhotos({});
    setCurrentStep('front');
    startCamera();
  };

  // Start camera on mount
  useState(() => {
    startCamera();
    return () => stopCamera();
  });

  const stepInfo = STEP_INSTRUCTIONS[currentStep];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-2xl w-full overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Face Verification</h2>
            <p className="text-sm text-blue-100">Step {['front', 'smile', 'left', 'right'].indexOf(currentStep) + 1} of 4</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <IoClose className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800 h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
            style={{
              width: `${((['front', 'smile', 'left', 'right'].indexOf(currentStep) + 1) / 4) * 100}%`,
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{stepInfo.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{stepInfo.title}</h3>
            <p className="text-gray-400">{stepInfo.instruction}</p>
          </div>

          {/* Camera View */}
          {currentStep !== 'complete' && (
            <div className="relative bg-black rounded-xl overflow-hidden mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover mirror"
                onLoadedMetadata={() => setCameraReady(true)}
              />
              
              {/* Face Oval Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-64 h-80 border-4 rounded-full transition-colors ${
                  faceDetected ? 'border-green-500' : 'border-blue-500'
                } opacity-50`}></div>
              </div>

              {/* Face Detection Status */}
              {cameraReady && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    faceDetected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-black'
                  }`}>
                    {faceDetected ? '✓ Face Detected' : 'Position Your Face'}
                  </div>
                </div>
              )}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-8xl font-bold text-white animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Camera Not Ready */}
              {!cameraReady && (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <IoCamera className="w-16 h-16 text-gray-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-400">Starting camera...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Complete View */}
          {currentStep === 'complete' && (
            <div className="text-center py-12">
              <IoCheckmarkCircle className="w-24 h-24 text-green-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">Verification Complete!</h3>
              <p className="text-gray-400">Your photos are being processed...</p>
            </div>
          )}

          {/* Action Buttons */}
          {currentStep !== 'complete' && (
            <div className="flex gap-4">
              <button
                onClick={handleRetake}
                disabled={Object.keys(photos).length === 0}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <IoRefreshOutline className="w-5 h-5" />
                Restart
              </button>
              <div className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center gap-2 font-semibold">
                <IoCamera className="w-5 h-5" />
                {faceDetected ? 'Capturing...' : 'Waiting for face...'}
              </div>
            </div>
          )}

          {/* Tips */}
          {currentStep !== 'complete' && (
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <IoWarning className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Tips for best results:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Ensure good lighting on your face</li>
                    <li>Remove glasses or hats if possible</li>
                    <li>Keep your face within the oval guide</li>
                    <li>Follow the instructions carefully</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
