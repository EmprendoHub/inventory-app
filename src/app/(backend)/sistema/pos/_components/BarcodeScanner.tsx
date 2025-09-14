"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Flashlight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanResult, ScanMode } from "@/types/pos";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: ScanResult) => void;
  scanMode?: ScanMode;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScanResult,
  scanMode = "item",
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
      setHasPermission(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Toggle flashlight
  const toggleFlash = useCallback(async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && "torch" in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            // @ts-expect-error - torch is not in the standard type definition yet
            advanced: [{ torch: !flashOn }],
          });
          setFlashOn(!flashOn);
        } catch (err) {
          console.error("Flash control not supported:", err);
        }
      }
    }
  }, [flashOn]);

  // Handle manual barcode input
  const [manualInput, setManualInput] = useState("");

  const handleManualSubmit = useCallback(() => {
    if (manualInput.trim()) {
      const result: ScanResult = {
        type: "barcode",
        data: manualInput.trim(),
        timestamp: new Date(),
      };
      onScanResult(result);
      setManualInput("");
      onClose();
    }
  }, [manualInput, onScanResult, onClose]);

  // Initialize camera when component opens
  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {scanMode === "item" && "Scan Product Barcode"}
              {scanMode === "customer" && "Scan Customer QR Code"}
              {scanMode === "discount" && "Scan Discount Code"}
            </h2>
            <p className="text-white/70 text-sm">
              Apunte la cámara al código de barras o código QR
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlash}
              className="text-white hover:bg-white/20"
            >
              <Flashlight
                className={`w-5 h-5 ${flashOn ? "fill-yellow-400" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative w-full h-full">
          {isScanning ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : hasPermission === false ? (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="p-6 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    Acceso a la Cámara Requerido
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Por favor permita el acceso a la cámara para escanear
                    códigos de barras
                  </p>
                  <Button onClick={startCamera} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="p-6 text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">
                    Error
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={startCamera} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-white">Iniciando Cámara...</div>
            </div>
          )}

          {/* Scan Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scan Frame */}
                <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg"></div>

                  {/* Scanning Line Animation */}
                  <motion.div
                    className="absolute inset-x-0 h-0.5 bg-red-500 shadow-lg shadow-red-500/50"
                    animate={{
                      y: [0, 256, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <p className="text-white text-center mt-4">
                  Alinear el código de barras dentro del marco
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 space-y-4">
          {/* Manual Input */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode manually..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
                />
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                >
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
