"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanResult, ScanMode } from "@/types/pos";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
  // eslint-disable-next-line
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  // Initialize scanner
  const startScanner = useCallback(() => {
    if (!scannerElementRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Configure supported formats for barcode scanning
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      };

      // Success callback
      const onScanSuccess = (decodedText: string) => {
        const result: ScanResult = {
          type: "barcode",
          data: decodedText,
          timestamp: new Date(),
        };
        onScanResult(result);
        stopScanner();
        onClose();
      };

      // Error callback
      const onScanError = (errorMessage: string) => {
        // Don't log every frame error, only actual errors
        if (
          !errorMessage.includes(
            "No MultiFormat Readers were able to detect the code"
          )
        ) {
          console.warn("Scan error:", errorMessage);
        }
      };

      scannerRef.current = new Html5QrcodeScanner(
        "barcode-scanner",
        config,
        false
      );

      scannerRef.current.render(onScanSuccess, onScanError);
      setHasPermission(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Unable to start scanner. Please check camera permissions.");
      setHasPermission(false);
      setIsScanning(false);
    }
    // eslint-disable-next-line
  }, [onScanResult, onClose]);

  // Stop scanner
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Handle manual barcode input
  const [manualInput, setManualInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const manualInputRef = useRef<HTMLInputElement>(null);

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

  // Initialize scanner when component opens
  useEffect(() => {
    if (isOpen) {
      startScanner();
      // Focus the manual input field when modal opens
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 300); // Small delay to ensure modal is fully rendered
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

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
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scanner View */}
        <div className="relative w-full h-full">
          {/* Scanner Container */}
          <div
            id="barcode-scanner"
            ref={scannerElementRef}
            className="w-full h-full barcode-scanner-container"
            style={
              {
                "--qr-border-color": "#ffffff",
                "--qr-scanner-border-color": "#ffffff",
                "--qr-text-color": "#ffffff",
              } as React.CSSProperties
            }
          />

          {/* Permission / Error States */}
          {(hasPermission === false || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="p-6 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    {error ? "Error de Cámara" : "Acceso a la Cámara Requerido"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error ||
                      "Por favor permita el acceso a la cámara para escanear códigos de barras"}
                  </p>
                  <Button onClick={startScanner} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 space-y-4">
          {/* Manual Input */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isInputFocused ? "bg-green-400" : "bg-gray-400"
                    }`}
                  />
                  <span>
                    {isInputFocused
                      ? "Listo para escáner de código de barras"
                      : "Campo de entrada manual"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={manualInputRef}
                    type="text"
                    placeholder="Enter barcode manually or use scanner device..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg bg-input transition-all duration-200 ${
                      isInputFocused
                        ? "border-blue-500 ring-2 ring-blue-200 bg-white shadow-md"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleManualSubmit()
                    }
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
