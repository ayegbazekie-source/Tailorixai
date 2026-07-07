import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function CameraCapture({ onCapture, onFileSelect }) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Check camera permission state on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' }).then((result) => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      }).catch(() => {});
    }
  }, []);

  const startCamera = async () => {
    setPermissionDenied(false);

    // If already denied, show settings guidance immediately
    if (permissionState === 'denied') {
      setPermissionDenied(true);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setPermissionState('granted');
    } catch (err) {
      console.error('Camera error:', err);
      setPermissionDenied(true);
      setPermissionState('denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Button
          onClick={startCamera}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Camera className="w-5 h-5" />
          Take Photo
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload File
        </Button>
      </div>

      {permissionDenied && (
        <div className="flex items-start gap-2 p-3 bg-[#1e1e1e] border border-[#D4AF37]/50 rounded-xl text-sm text-[#D4AF37]">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
          <div>
            <p className="font-semibold">Camera Permission Required</p>
            <p className="text-[#F8F8F2]/70 mt-0.5">Go to <strong>Settings → Apps → Tailorix AI → Permissions</strong> and enable Camera, then return to the app.</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[200] flex flex-col"
          >
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] bg-black/80 backdrop-blur-sm">
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="bg-rose-500 hover:bg-rose-600 gap-2 px-8"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}